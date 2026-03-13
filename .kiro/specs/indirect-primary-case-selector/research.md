# Research & Design Decisions

## Summary
- **Feature**: `indirect-primary-case-selector`
- **Discovery Scope**: Extension（既存シミュレーション画面の拡張）
- **Key Findings**:
  - 3エンティティすべてに `isPrimary: boolean` フラグが既に存在し、バックエンドAPIのレスポンスに含まれている
  - 現在の `useIndirectSimulation` フックにはprimary自動選択ロジックが一切なく、3つのuseStateがすべて`null`で初期化される
  - マスタ管理画面（`/master/headcount-plans`, `/master/capacity-scenarios`, `/master/indirect-work-cases`）は既に存在する

## Research Log

### 既存のケース選択メカニズム
- **Context**: 現在のケース選択UIと自動選択ロジックの有無を調査
- **Sources Consulted**: `useIndirectSimulation.ts`, `simulation/index.lazy.tsx`
- **Findings**:
  - 3つのエンティティの選択は独立した `useState<number | null>(null)` で管理
  - BU変更時にすべて `null` にリセットされる（L95-105）
  - `isPrimary` フラグはAPIレスポンスに含まれるが、選択ロジックでは一切利用されていない
  - 画面UIは3つの `<Select>` ドロップダウンで構成
- **Implications**: 自動選択ロジックの追加はuseStateの初期値設定ロジックの変更のみで可能。既存のSelect UIはそのまま活用できる

### isPrimaryフラグの現状
- **Context**: データベース・API・フロントエンドでのisPrimaryの扱いを確認
- **Sources Consulted**: 型定義ファイル、DBスキーマドキュメント
- **Findings**:
  - DB: `is_primary BIT NOT NULL DEFAULT 0`（3テーブルとも同一）
  - バックエンド制約: 同一BU内で複数のprimaryが技術的に許容される（排他制御なし）
  - フロントエンド型: `isPrimary: boolean`（3エンティティとも同一）
  - headcount_plan_cases、indirect_work_cases はBUスコープ、capacity_scenarios はグローバル
- **Implications**: 複数primaryが存在し得るため、「最初のprimary」をデフォルト選択する方針が妥当

### マスタ管理画面の遷移先
- **Context**: 計算条件パネルからのリンク先ルートを確認
- **Sources Consulted**: `apps/frontend/src/routes/master/` ディレクトリ
- **Findings**:
  - `/master/headcount-plans` - 人員計画ケース管理
  - `/master/capacity-scenarios` - キャパシティシナリオ管理
  - `/master/indirect-work-cases` - 間接作業ケース管理
- **Implications**: リンク先はすべて既存。新規ルート作成は不要

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| フック内自動選択 | useIndirectSimulationフック内でuseEffect/条件分岐によりprimaryを自動選択 | 既存フックの自然な拡張、ロジックが集約 | フック内のuseEffectが増えることで複雑化のリスク | 選択 |
| 専用フック分離 | usePrimaryCaseSelection のような新規フックを作成 | 関心の分離、テスタビリティ | フック間の状態同期が必要 | 不採用: オーバーエンジニアリング |

## Design Decisions

### Decision: 自動選択ロジックの配置場所
- **Context**: primaryケースの自動選択ロジックをどこに実装するか
- **Alternatives Considered**:
  1. `useIndirectSimulation` フック内にインライン実装
  2. 新規 `usePrimaryCaseSelection` フックとして分離
- **Selected Approach**: `useIndirectSimulation` フック内にインライン実装
- **Rationale**: 既存のケース選択ステート管理と同じスコープに配置することで、BU変更時のリセットロジックとの統合が自然に行える。3エンティティ分のprimary検出は単純なfind操作であり、専用フックを分離するほどの複雑性はない
- **Trade-offs**: フックの行数が若干増加するが、可読性は維持される
- **Follow-up**: BU変更時のリセットロジックがprimary自動選択と競合しないことを実装時に確認

### Decision: UIコントロールの方式
- **Context**: Issue #70ではprimaryをテキスト表示（ドロップダウン不要）としていたが、本拡張では変更可能にする
- **Alternatives Considered**:
  1. テキスト表示 + 編集ボタンでセレクタを開く
  2. 常時セレクタ表示（現在と同じSelect方式）
- **Selected Approach**: 常時セレクタ表示（既存のSelect UIを拡張）
- **Rationale**: 既存の `SelectSection` コンポーネントを拡張するのが最もコスト効率が良い。primaryバッジとマスタ遷移リンクの追加のみで要件を満たせる
- **Trade-offs**: Issue #70のテキスト表示案よりもUI密度が高いが、操作性は向上
- **Follow-up**: なし

### Decision: primary非選択時の視覚的区別
- **Context**: デフォルト（primary）から変更されていることをどう示すか
- **Alternatives Considered**:
  1. セレクタのボーダー色を変更
  2. 「primaryから変更済み」テキストラベル
  3. セレクタ内にprimaryバッジを表示 + 変更時はバッジなし
- **Selected Approach**: セレクタ内のprimaryケースにバッジ表示 + セレクタ横に「デフォルトに戻す」アクション
- **Rationale**: ケース一覧内でprimaryを識別できればよく、セレクタ外の追加UIは最小限に抑える
- **Trade-offs**: 微細な視覚的差異のため、ユーザーが気づきにくい可能性がある
- **Follow-up**: ユーザビリティテストで確認

## Risks & Mitigations
- 複数primaryが存在する場合 → 最初に見つかったものを選択。バックエンドでの排他制御は本スコープ外
- ケース0件の場合 → セレクタを無効化し、マスタ画面への誘導メッセージを表示
- データロード中のフラッシュ → ロード完了後に自動選択を実行し、ロード中はスケルトン表示

## References
- Issue #70: 間接工数管理画面の統合・簡素化
- 既存フック: `apps/frontend/src/features/indirect-case-study/hooks/useIndirectSimulation.ts`
- マスタルート: `/master/headcount-plans`, `/master/capacity-scenarios`, `/master/indirect-work-cases`

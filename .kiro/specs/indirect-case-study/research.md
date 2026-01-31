# Research & Design Decisions

## Summary
- **Feature**: indirect-case-study（間接作業・キャパシティ設定画面）
- **Discovery Scope**: Extension（バックエンド実装済み、フロントエンド新規）
- **Key Findings**:
  - バックエンドAPI 9エンティティ分が全て実装済み。フロントエンド開発のみで要件を満たせる
  - 既存 feature パターン（business-units, workload）が確立されており、踏襲で一貫性を維持可能
  - Excelエクスポートは SheetJS（xlsx）の `writeFileXLSX` を使用し、動的インポートでバンドルサイズを最適化

## Research Log

### Excelエクスポートライブラリ選定
- **Context**: 要件13でExcelエクスポート機能が必要。プロジェクトに未導入
- **Sources Consulted**: SheetJS公式ドキュメント、npm、GitHub Issues
- **Findings**:
  - SheetJS（`xlsx` パッケージ）がデファクトスタンダード
  - `writeFileXLSX` を使えばXLSX専用のスリムビルドが利用可能
  - ESM ビルドで Vite のツリーシェイキングに対応
  - フルバンドルは約1MB、`writeFileXLSX` + ESM で大幅削減可能
  - 動的インポート（`import('xlsx')`）でエクスポート時のみロード推奨
- **Implications**: 新規依存として `xlsx` パッケージを追加。動的インポートでバンドル影響を最小化

### TanStack Router 遷移ガード（未保存警告）
- **Context**: 要件12で未保存変更時の画面遷移ブロックが必要
- **Findings**:
  - TanStack Router は `useBlocker` フックを提供
  - `window.addEventListener('beforeunload', handler)` でブラウザタブ閉じを検知
  - `useBlocker` の `condition` に未保存状態フラグを渡す設計
- **Implications**: `useUnsavedChanges` カスタムフックで `useBlocker` + `beforeunload` を統合

### workload feature との型重複
- **Context**: `IndirectWorkCase` 型が `features/workload/types/index.ts` に既に存在（簡易版）
- **Findings**:
  - workload の型は `{ indirectWorkCaseId, caseName, businessUnitCode, createdAt, updatedAt }` のみ
  - indirect-case-study では完全な型（`description`, `isPrimary`, `deletedAt` 含む）が必要
  - features 間の依存は CLAUDE.md で禁止されている
- **Implications**: indirect-case-study feature 内で独自の完全な型定義を持つ。workload の既存型はそのまま維持（変更不要）

### 画面レイアウトパターン
- **Context**: 本画面は2カラム（設定+結果）のレイアウトが必要。既存のマスタ管理画面は1カラム
- **Findings**:
  - 既存マスタ管理画面は一覧→詳細→編集のCRUDフロー
  - workload画面はチャート+サイドパネルの複合レイアウト
  - 本画面は「設定エリア（左）+ 計算結果エリア（右）」の独自レイアウト
- **Implications**: 新しいルートカテゴリ（`/settings/indirect-capacity`）または `/workload/indirect-capacity` が適切。マスタ管理配下ではない

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks | Notes |
|--------|-------------|-----------|-------|-------|
| A: 単一feature | 全コンポーネントを1 feature に集約 | 凝集度高い、feature間依存なし | types/api が肥大化 | gap-analysis Option A |
| B: エンティティ別feature | 人員計画/キャパシティ/間接作業を分離 | 各featureが小さい | feature間依存発生（CLAUDE.md違反） | gap-analysis Option B |
| C: ハイブリッド | 1 feature内でファイル粒度を分割 | 凝集+分割のバランス | feature内ファイル数がやや多い | **採用** |

## Design Decisions

### Decision: feature モジュール構成
- **Context**: 7エンティティのAPIクライアント・型定義・UIコンポーネントをどう整理するか
- **Alternatives Considered**:
  1. 単一の types/index.ts、api-client.ts に全て集約
  2. エンティティ別にファイル分割（types/headcount-plan.ts, api/headcount-plan-client.ts 等）
- **Selected Approach**: Option 2 — エンティティ別にファイル分割
- **Rationale**: 各ファイルが200-300行程度に収まり可読性が高い。並行実装時のコンフリクトも回避
- **Trade-offs**: ファイル数は増えるが、各ファイルの責務が明確

### Decision: 画面ルートの配置
- **Context**: 間接作業・キャパシティ設定画面をどのURLパスに配置するか
- **Alternatives Considered**:
  1. `/master/indirect-capacity-settings` — マスタ管理配下
  2. `/settings/indirect-capacity` — 設定カテゴリとして独立
  3. `/workload/indirect-capacity` — ダッシュボード関連として配置
- **Selected Approach**: Option 1 — `/master/indirect-capacity-settings`
- **Rationale**: 既存のメニュー構造に自然に収まる。ケース管理はマスタデータ管理の一種
- **Trade-offs**: 本画面は計算機能を含むため純粋なマスタ管理ではないが、ユーザー導線としてはマスタ管理セクションが最も直感的

### Decision: 状態管理方式
- **Context**: BU選択、3つのケース選択、計算結果の中間状態をどう管理するか
- **Alternatives Considered**:
  1. 全てURL search params
  2. BU選択のみURL、ケース選択はローカルstate
  3. Zustand store で管理
- **Selected Approach**: Option 2 — BU選択はURL search params、ケース選択・計算結果はコンポーネントローカルstate
- **Rationale**: BU選択はブックマーク・共有可能にしたい。ケース選択は画面固有のUI状態でURL化の必要なし。Zustandはこの画面のみで使用のため過剰
- **Trade-offs**: ブラウザリロードでケース選択はリセットされる（許容可能）

### Decision: Excelエクスポート実装方式
- **Context**: 要件13のExcelエクスポート
- **Alternatives Considered**:
  1. SheetJS（xlsx パッケージ）— クライアントサイド生成
  2. バックエンドAPI で生成 — サーバーサイド
  3. CSV出力のみ — 簡易版
- **Selected Approach**: Option 1 — SheetJS のクライアントサイド生成
- **Rationale**: 表示中のデータをそのままエクスポートするためクライアントサイドが自然。バックエンドに新規エンドポイント不要
- **Trade-offs**: `xlsx` パッケージの依存追加（動的インポートでバンドル影響最小化）

## Risks & Mitigations

- **グリッド入力のUX複雑性** — 12ヶ月×年度のグリッドは入力量が多い。一括入力ダイアログとタブ移動でUXを補完
- **計算フローの状態整合性** — キャパシティ計算→間接工数計算の順序依存。UIでボタンの活性/非活性を制御し、不正な操作順序を防止
- **大量データ時のパフォーマンス** — 10年分×12ヶ月=120レコードの表示・編集。TanStack Virtual の適用は不要な範囲（120行程度）

## References

- [SheetJS 公式ドキュメント - Data Export](https://docs.sheetjs.com/docs/solutions/output/) — writeFileXLSX の使用方法
- [SheetJS React デモ](https://docs.sheetjs.com/docs/demos/frontend/react/) — React統合パターン
- [SheetJS Bundlers ガイド](https://docs.sheetjs.com/docs/demos/frontend/bundler/) — Vite/Webpack対応

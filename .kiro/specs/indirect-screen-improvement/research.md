# Research & Design Decisions

## Summary
- **Feature**: `indirect-screen-improvement`
- **Discovery Scope**: Extension（既存システムの拡張）
- **Key Findings**:
  - `useIndirectSimulation` フックがプライマリケースの自動検出と月次データ取得を一体化しており、ケース選択のパラメータ化が改善の核心
  - `CalculationConditionPanel` は現在読み取り専用の表示のみで、セレクタUIは未実装
  - URL検索パラメータのパターン（BU選択）が既に確立されており、同パターンの拡張でケースID永続化が可能

## Research Log

### 既存のケースセレクタUIパターン
- **Context**: 間接工数画面にケースセレクタを追加するにあたり、既存のセレクタUIパターンを調査
- **Sources Consulted**: `HeadcountPlanCaseChips.tsx`, `IndirectWorkCaseList.tsx`, shadcn/ui Select
- **Findings**:
  - `HeadcountPlanCaseChips`: 水平チップ形式。選択・CRUD・ソフトデリート対応。マスタ管理画面向け
  - `IndirectWorkCaseList`: 垂直リスト+ラジオボタン形式。選択・CRUD・ソフトデリート対応。マスタ管理画面向け
  - いずれもCRUD操作を含むフルマスタ管理UIであり、間接工数画面の計算条件パネルに組み込むには重すぎる
- **Implications**: 間接工数画面ではCRUD不要の軽量セレクタ（shadcn/ui `Select` ドロップダウン）が適切

### useIndirectSimulation フックの構造
- **Context**: ケース選択をパラメータ化するための改修箇所を特定
- **Sources Consulted**: `useIndirectSimulation.ts` (274行), `simulation-utils.ts`
- **Findings**:
  - フックは `businessUnitCode` のみを受け取り、内部で3種のケースリストを取得後、`findPrimaryId()` でプライマリを自動検出
  - 月次データクエリはプライマリIDに依存（`enabled: caseId > 0`）
  - 再計算フローもプライマリIDをハードコード参照
  - 戻り値に `primaryXxxId`, `primaryXxxName` を含む
- **Implications**: フック入力を `{ businessUnitCode, selectedHeadcountCaseId?, selectedCapacityScenarioId?, selectedIndirectWorkCaseId? }` に拡張し、選択IDが渡された場合はそれを優先、未指定時はプライマリにフォールバックする設計が自然

### URL検索パラメータのパターン
- **Context**: ケース選択状態のURL永続化方法を調査
- **Sources Consulted**: `routes/indirect/index.tsx`, TanStack Router search params ドキュメント
- **Findings**:
  - 現在の検索スキーマ: `{ bu: z.string().catch("").default("") }`
  - `Route.useSearch()` で取得、`Route.useNavigate()` で更新
  - `z.number().catch(0).default(0)` パターンでIDパラメータを追加可能（0は「未指定」を意味）
- **Implications**: 既存パターンを踏襲し、`headcountCaseId`, `capacityScenarioId`, `indirectWorkCaseId` を検索パラメータに追加

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A: フック入力拡張 | useIndirectSimulationの入力にケースIDを追加、内部でフォールバック | 既存構造への最小変更、後方互換 | フック内部の条件分岐が増加 | 採用 |
| B: 別フック分離 | ケース選択専用のhookを新設、useIndirectSimulationは選択済みIDのみ受け取る | 責務分離が明確 | フック間の依存が増え、状態同期が複雑化 | 不採用 |

## Design Decisions

### Decision: ケースセレクタUIコンポーネント
- **Context**: CalculationConditionPanelにケース選択機能を追加する方法
- **Alternatives Considered**:
  1. 既存のChips/Listコンポーネントを流用 — CRUD付きで重い
  2. shadcn/ui Select（ドロップダウン） — 軽量・コンパクト
  3. Combobox（検索付きセレクタ） — ケース数が少なければ過剰
- **Selected Approach**: shadcn/ui `Select` コンポーネント
- **Rationale**: 計算条件パネルはケース選択のみが目的でCRUDは不要。3カラムグリッド内に収まるコンパクトさが必要。ケース数は通常10件未満で検索不要
- **Trade-offs**: ケース数が大量になった場合の検索性は犠牲になるが、現実的なユースケースでは問題なし
- **Follow-up**: ケース数が20件を超える運用が判明した場合はComboboxへの変更を検討

### Decision: ケースID解決ロジック
- **Context**: URL検索パラメータ・プライマリケース・未指定状態の優先順位
- **Selected Approach**: URL param > プライマリ > null の3段階フォールバック
- **Rationale**: URLパラメータが最も明示的な意図表明。プライマリは合理的なデフォルト。どちらもなければnull（未選択）
- **Trade-offs**: URL paramの無効化（削除済みケース参照）時はサイレントにフォールバック。ユーザーへの通知は不要（自然な挙動として）

## Risks & Mitigations
- **BU変更時のケース無効化**: BU変更でBU依存ケース（人員計画・間接作業）が無効になる → BU変更時にURL paramをクリアし、新BUのプライマリにフォールバック
- **ケース削除後のURL参照**: 削除済みケースIDがURLに残る → フェッチ結果でIDが見つからない場合はプライマリにフォールバック
- **同時3セレクタの操作性**: 3つのドロップダウンが並ぶUIの煩雑さ → CalculationConditionPanelの既存3カラムレイアウトを活用し、各条件名の下にセレクタを配置

## References
- TanStack Router Search Params: ファイルベースルーティングでのZodバリデーション付きURL検索パラメータ
- shadcn/ui Select: Radix UI SelectをベースとしたドロップダウンUIコンポーネント

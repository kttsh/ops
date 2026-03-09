# Research & Design Decisions: workload-case-selector

## Summary
- **Feature**: `workload-case-selector`
- **Discovery Scope**: Extension（既存ワークロードダッシュボードの拡張）
- **Key Findings**:
  - ChartView（プロファイル）経由のケース指定パターンが `chart_view_project_items.project_case_id` として既に存在し、バックエンド SQL の参考実装となる
  - `GET /projects` のレスポンスにケース情報が含まれていないため、案件一覧 API の拡張またはバッチ取得 API が必要
  - `getProjectDetailsByDefault` の `pc.is_primary = 1` がハードコードされており、動的ケース指定には SQL の条件分岐が必要

## Research Log

### API パラメータ形式の検討
- **Context**: フロントエンドからバックエンドへ「案件 X のケース Y を使う」という情報をどう伝達するか
- **Findings**:
  - 既存パラメータ `projectIds`, `capacityScenarioIds`, `indirectWorkCaseIds` はすべて CSV 形式（`id1,id2,id3`）
  - `project_case_id` は `project_cases` テーブルでグローバルユニーク（`project_id` との紐付けは DB 側で解決可能）
  - `projectCaseIds` CSV 形式が既存パターンと最も一貫性がある
- **Implications**: `projectCaseIds` パラメータを CSV 形式で追加。バックエンドが `project_cases` テーブルから `project_id` を逆引きし、未指定案件は `isPrimary` にフォールバック

### ケースデータ取得方式
- **Context**: サイドパネルの案件カードにケースセレクタを表示するため、全案件のケース一覧が必要
- **Sources Consulted**: 既存の `projectData.ts`、`projectCaseData.ts`、`case-study/api/queries.ts`
- **Findings**:
  - `GET /projects/:projectId/project-cases` は案件ごとの個別取得（N+1問題）
  - `GET /projects` のバックエンド SQL（`projectData.ts`）は `projects` テーブルのみを参照し、`project_cases` への JOIN なし
  - `project_cases` テーブルには `project_id` インデックスが存在（FK制約による暗黙インデックス）
- **Implications**: `GET /projects` のレスポンスに `cases` フィールドを追加する方式を採用。LEFT JOIN + サブクエリでケースサマリを取得。既存のページネーション・フィルタ機能に影響なし

### 既存 ChartView のケース指定パターン分析
- **Context**: `getProjectDetailsByChartView` が既にケース指定対応している
- **Findings**:
  - `chart_view_project_items` テーブルの `project_case_id` (nullable) で案件ごとのケースを指定
  - NULL の場合は `is_primary = 1` にフォールバック（既存 SQL の条件: `(cvpi.project_case_id IS NOT NULL AND pc.project_case_id = cvpi.project_case_id) OR (cvpi.project_case_id IS NULL AND pc.is_primary = 1)`）
  - この条件パターンを `getProjectDetailsByDefault` の拡張に応用可能
- **Implications**: 新しい SQL メソッド `getProjectDetailsWithCaseOverrides` を追加し、同様の条件分岐パターンを適用

### フロントエンド状態管理パターン
- **Context**: 案件ごとのケース選択状態をどう管理するか
- **Findings**:
  - 現在の `workload/index.lazy.tsx` は既に408行で、`selectedProjectIds`, `projectColors`, `projectOrder` 等の状態を管理
  - 他の状態（`capVisible`, `capColors`, `indirectColors`, `indirectOrder`）も同コンポーネントで管理されている
  - 既存パターンとして、状態管理はページコンポーネントに集約、UI コンポーネントは props 経由で受け取る
- **Implications**: 既存パターンに従い、`selectedCaseIds: Map<number, number>` をページコンポーネントで管理。ただしデフォルト初期化ロジックは `useProjectCaseSelection` フックに分離

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A: 既存コンポーネント拡張 | SidePanelProjects 内にセレクタを直接追加 | 変更ファイル最小 | コンポーネント肥大化 | 小規模なら適切 |
| B: 新規コンポーネント分離 | ProjectCaseSelector + useProjectCaseSelection を新設 | 責務分離明確、テスト容易 | ファイル数増加 | 中規模に適切 |
| C: ハイブリッド（採用） | FE は分離、BE は最小拡張 | バランスが良い | — | Gap分析の推奨と一致 |

## Design Decisions

### Decision: API パラメータ形式
- **Context**: ケース指定情報をフロントエンドからバックエンドへ伝達する形式
- **Alternatives Considered**:
  1. `projectCaseIds` CSV — `projectCaseIds=101,102,105`
  2. `projectCaseMappings` key-value CSV — `projectCaseMappings=1:101,2:102`
  3. 個別パラメータ — `projectCase[1]=101&projectCase[2]=102`
- **Selected Approach**: `projectCaseIds` CSV（選択肢 1）
- **Rationale**: 既存の `projectIds`, `capacityScenarioIds` と同じ CSV パターン。`project_case_id` はグローバルユニークなので `project_id` とのマッピングは不要（バックエンドが解決）
- **Trade-offs**: フロントエンド側で「どの案件にどのケース」という対応が見えないが、バックエンド側で解決可能
- **Follow-up**: バックエンドで `projectCaseIds` のバリデーション（存在確認・案件所属確認）を行うか、フォールバックに任せるか

### Decision: ケースデータ取得方式
- **Context**: フロントエンドが案件カード表示時にケース一覧を取得する方式
- **Alternatives Considered**:
  1. `GET /projects` レスポンスにケースサマリ追加
  2. バッチ取得 API 新設（`GET /project-cases?projectIds=...`）
  3. 案件ごとに個別取得（`useQueries`）
- **Selected Approach**: `GET /projects` レスポンス拡張（選択肢 1）
- **Rationale**: 1リクエストで全情報を取得。既存の `projectsQueryOptions` をそのまま活用でき、フロントエンド側の変更が最小
- **Trade-offs**: プロジェクト一覧 API のレスポンスサイズが増加するが、ケース数は案件あたり2–5件程度で影響は限定的

### Decision: フロントエンド UI コンポーネント構成
- **Context**: ケースセレクタの UI をどう構成するか
- **Selected Approach**: `SidePanelProjects.tsx` 内に直接ケースセレクタのインラインUI（Select コンポーネント）を追加
- **Rationale**: ケースセレクタは案件カード内の単純なドロップダウンであり、独立コンポーネントにするほどの複雑さはない。`SidePanelProjects` の行数増加は20–30行程度で許容範囲内
- **Trade-offs**: コンポーネント分離せず `SidePanelProjects` に集約することで、ファイル増加を回避

## Risks & Mitigations
- プロジェクト一覧 API のレスポンスサイズ増加 — ケースは `{ projectCaseId, caseName, isPrimary }` のサマリのみで最小化
- SQL パフォーマンス — `project_cases` の LEFT JOIN は FK インデックスを利用するため影響は限定的。必要に応じてサブクエリに変更可能
- 既存テストへの影響 — プロジェクト一覧のレスポンス型変更により既存テストの修正が必要

## References
- 既存 ChartView ケース指定: `apps/backend/src/data/chartDataData.ts` の `getProjectDetailsByChartView`
- 案件一覧 API: `apps/backend/src/data/projectData.ts`
- TanStack Query パターン: `apps/frontend/src/features/workload/api/queries.ts`

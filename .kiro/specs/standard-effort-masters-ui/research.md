# Research & Design Decisions

## Summary
- **Feature**: standard-effort-masters-ui
- **Discovery Scope**: Extension（既存マスタ UI パターンの踏襲 + 新規パターン追加）
- **Key Findings**:
  - 既存ファクトリパターン（createCrudClient / createQueryKeys / createCrudMutations）で API 層の 90% をカバー可能
  - TanStack Form の `mode="array"` で 21 行固定の重みテーブル入力を実現可能。行数固定のため pushValue / removeValue は不要
  - case-study feature に StandardEffortMaster 型が既存するが、feature 間依存禁止の原則により新 feature で独自定義

## Research Log

### TanStack Form 配列フィールドパターン
- **Context**: 21 行固定（進捗率 0%-100%、5%刻み）の重み入力テーブルを TanStack Form で管理する方法
- **Sources Consulted**: `docs/rules/tanstack-form/arrays-dynamic-fields.md`
- **Findings**:
  - `form.Field name="weights" mode="array"` で配列フィールドを定義
  - サブフィールドは `weights[${i}].weight` 形式でアクセス
  - 21 行は固定なので pushValue / removeValue は使用しない
  - defaultValues に 21 行分の初期値（progressRate: 0,5,10,...,100 / weight: 0）を事前生成
  - Zod バリデーションは配列レベル（`.array().length(21)`）とサブフィールドレベル（`.int().min(0)`）の両方で定義
- **Implications**: 配列操作ボタンは不要。テーブル形式で progressRate を読み取り専用表示、weight のみ入力可能

### 詳細/編集モード切替パターン
- **Context**: Issue #43 で「詳細表示と編集を同一コンポーネントで実現（モード切替）」を要求
- **Sources Consulted**: 既存 projects master（detail + edit 分離パターン）
- **Findings**:
  - 既存 projects master は `$projectId/index.tsx`（詳細）と `$projectId/edit.tsx`（編集）を分離
  - 標準工数マスタは重みテーブル + チャートがあり、ページ遷移時の再描画コストが高い
  - `isEditing` state によるモード切替が適切
  - 閲覧モード: DetailRow + 読み取り専用テーブル + チャート
  - 編集モード: useForm で初期値をセットし、テーブル入力 + チャートプレビュー
- **Implications**: ルートファイルは `$standardEffortId/index.tsx` のみ（edit.tsx は不要）。StandardEffortMasterDetail コンポーネントが閲覧/編集両モードを管理

### Recharts AreaChart パターン
- **Context**: 重み分布を可視化するエリアチャートの設計
- **Sources Consulted**: `features/case-study/components/WorkloadChart.tsx`
- **Findings**:
  - ResponsiveContainer + AreaChart + Area + CartesianGrid + XAxis + YAxis + Tooltip
  - linearGradient で塗りつぶし効果
  - CSS variables (`var(--color-primary)`) でテーマ統合
  - カスタムツールチップで日本語表示
- **Implications**: WeightDistributionChart は WorkloadChart より単純。データ変換は `weights` 配列をそのまま使用（yearMonth → progressRate に置換するだけ）

### BU/PT Select クエリの配置
- **Context**: ビジネスユニットと案件タイプの Select ドロップダウン用クエリの配置場所
- **Sources Consulted**: `features/projects/api/queries.ts`（businessUnitsForSelectQueryOptions / projectTypesForSelectQueryOptions）
- **Findings**:
  - projects feature で `fetchBusinessUnitsForSelect` → `queryOptions` → `select` transform パターンを使用
  - queryKey は `["business-units", "select"]` / `["project-types", "select"]` で feature 横断的に共有可能（queryKey が同一なら TanStack Query がキャッシュを共有）
  - feature 間依存禁止の原則上、import は不可だが queryKey が同一であればキャッシュヒットする
- **Implications**: 新 feature で独自に BU/PT Select クエリを定義。fetch 関数と queryOptions を feature 内に配置。queryKey を `["business-units", "select"]` と合わせることでキャッシュ共有

### Bulk エクスポート/インポートの既存パターン
- **Context**: 案件マスタの Bulk Import/Export パターンを標準工数マスタに適用
- **Sources Consulted**: `features/projects/hooks/useProjectBulkExport.ts`, `useProjectBulkImport.ts`, `lib/excel-utils.ts`, `components/shared/ExcelImportDialog.tsx`, `backend/src/routes/bulk.ts`
- **Findings**:
  - フロントエンド: `useXxxBulkExport` / `useXxxBulkImport` フック + `ExcelImportDialog` 共通コンポーネント
  - Excel 生成/解析: `lib/excel-utils.ts` の `buildBulkExportWorkbook` / `parseExcelFile` / `parseBulkImportSheet`
  - バックエンド: 専用 export/import エンドポイント + トランザクション処理
  - 案件マスタは月別カラム（動的）だが、標準工数マスタは進捗率カラム（固定21列）
  - BU フィルタ連動は案件マスタにはない新規パターン（エクスポート API に `filter[businessUnitCode]` パラメータを追加）
- **Implications**: フロントエンドは既存パターンをほぼそのまま適用可能。バックエンドは標準工数マスタのルートに export/import アクションとして追加。Excel の値カラムは固定（0%, 5%, ..., 100%）のため、年月ヘッダーの動的生成は不要

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A: 既存パターン完全踏襲 | ファクトリパターン + 新規 feature + モード切替 | 一貫性最大、ファクトリ再利用、スコープ限定 | case-study との型重複 | **推奨** |
| B: 共通ユーティリティ抽出 | BU/PT Select、型定義を lib/ に共通化 | DRY 原則、長期保守性 | スコープ拡大、case-study 変更必要 | 将来的に検討 |
| C: 詳細/編集ページ分離 | projects と同様に detail + edit 分離 | 既存パターンとの完全一貫性 | Issue #43 の要件と矛盾 | 却下 |

## Design Decisions

### Decision: 重みテーブル入力の実装方式
- **Context**: 21 行固定の進捗率 × 重みテーブルをフォーム管理する方式
- **Alternatives Considered**:
  1. TanStack Form `mode="array"` — 配列フィールドとして管理
  2. 個別フィールド（`weight0`, `weight5`, ... `weight100`）— 21 個の独立フィールド
- **Selected Approach**: Option 1 — `mode="array"` 配列フィールド
- **Rationale**: Zod の配列バリデーションと自然に統合。API リクエストの weights 配列にそのままマッピング可能。個別フィールドは 21 個の Field 定義が冗長
- **Trade-offs**: 配列アクセスのインデックス管理が必要だが、固定行数なので複雑さは限定的
- **Follow-up**: 21 行同時レンダリングのパフォーマンスを実装時に確認

### Decision: 詳細/編集のモード切替方式
- **Context**: 同一画面で閲覧モードと編集モードを切り替える方式
- **Alternatives Considered**:
  1. `useState(isEditing)` によるモード切替
  2. URL search params (`?mode=edit`) によるモード管理
- **Selected Approach**: Option 1 — `useState(isEditing)`
- **Rationale**: ブラウザ履歴に編集モードを残す必要がない。キャンセル時に state リセットのみで完結。projects master の detail/edit 分離との差異を最小化
- **Trade-offs**: ブラウザバックでは閲覧モードに戻らない（state はリセットされる）。許容範囲

### Decision: BU/PT Select クエリの配置
- **Context**: feature 間依存禁止の制約下で BU/PT Select クエリをどこに配置するか
- **Selected Approach**: 新 feature 内に独自定義。queryKey を既存と同一にしてキャッシュ共有
- **Rationale**: feature 間 import 禁止の原則を遵守。queryKey 一致によりランタイムでのキャッシュ共有は自然に発生
- **Trade-offs**: コード重複（fetch 関数の定義が重複）。許容範囲

## Risks & Mitigations
- **21 行同時レンダリングのパフォーマンス** — TanStack Form の配列フィールドは各サブフィールドが独立してサブスクライブするため、個別の重み値変更時に全行が再レンダリングされるリスクは低い。必要に応じて React.memo で行コンポーネントを最適化
- **チャートのリアルタイム更新頻度** — form.useStore でフォーム値を監視し、useMemo でチャートデータを変換。Recharts の再描画は軽量

## References
- TanStack Form 配列フィールド規約: `docs/rules/tanstack-form/arrays-dynamic-fields.md`
- Recharts 既存実装: `src/features/case-study/components/WorkloadChart.tsx`
- 既存マスタ UI 仕様: `docs/specs/frontend-ui/projects-master.md`
- バックエンド API 仕様: `docs/specs/backend-api/standard-effort-masters.md`
- 既存型定義: `src/features/case-study/types/index.ts`

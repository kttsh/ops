# Research & Design Decisions

## Summary
- **Feature**: `projects-master-ui`
- **Discovery Scope**: Extension（既存マスター管理パターンの拡張）
- **Key Findings**:
  - バックエンド API は完全実装済み。フロントエンドのみの新規開発
  - shadcn/ui の Select コンポーネントが未導入。`@radix-ui/react-select` の追加が必要
  - DataTableToolbar はパラメタライズして共通コンポーネント化し、business-units と projects で共有する

## Research Log

### shadcn/ui Select コンポーネント
- **Context**: FK ドロップダウン（事業部・プロジェクト種別・ステータス）に Select UI が必要
- **Sources Consulted**: shadcn/ui 公式ドキュメント、既存 package.json の Radix UI 依存
- **Findings**:
  - 現在の依存: `@radix-ui/react-alert-dialog`, `@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-switch`, `@radix-ui/react-tooltip`
  - 新規追加必要: `@radix-ui/react-select`
  - shadcn/ui の Select コンポーネントパターンに従い `components/ui/select.tsx` を作成
- **Implications**: Select は今後他のマスター管理画面でも再利用可能

### DataTableToolbar 共通化
- **Context**: ユーザー指示により DataTableToolbar をパラメタライズして共通化
- **Sources Consulted**: 既存の `features/business-units/components/DataTableToolbar.tsx`
- **Findings**:
  - 現在の問題: `Link to="/master/business-units/new"` がハードコード
  - 共通化対象: 検索入力、削除済み表示トグル、新規作成ボタンのリンク先
  - DebouncedSearchInput は既に汎用的で変更不要
- **Implications**: `components/shared/DataTableToolbar.tsx` に移動し、props で `newItemHref` を受け取る設計

### 数値 ID vs 文字列コード
- **Context**: business-units はルートパラメータに文字列コードを使用、projects は数値 ID を使用
- **Sources Consulted**: バックエンド types/project.ts、routes/projects.ts
- **Findings**:
  - Projects API: `GET /api/projects/:id`（数値）
  - API クライアント: `fetch(\`${API_BASE_URL}/projects/${id}\`)` で数値をそのまま使用可
  - ルートパラメータ: `$projectId` として文字列で受け取り、API 呼び出し時に `Number()` 変換
- **Implications**: 型定義で `projectId: number` を明確にし、ルートパラメータとの変換を api-client 層で吸収

### status フィールドの設計
- **Context**: ユーザーの指示により「計画」「確定」の2値。将来の拡張可能性あり
- **Findings**:
  - バックエンド: `status: z.string().min(1).max(20)` — バリデーションは文字列のみ
  - フロントエンド: ドロップダウン選択として実装し、選択肢を定数配列で管理
  - 定数定義: `PROJECT_STATUSES = [{ value: 'planned', label: '計画' }, { value: 'confirmed', label: '確定' }]`
  - 将来の拡張: 配列に要素を追加するだけで対応可能
- **Implications**: フロントエンド側の定数配列で選択肢を管理。バックエンドの enum 化は将来の課題

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 新規 feature + 共通化 | `features/projects/` を新規作成、DataTableToolbar を共通コンポーネントに抽出 | features 間依存禁止ルール準拠、保守性高い | ファイル数増加 | **採用** |
| 既存 feature 拡張 | business-units feature を拡張して projects も含める | ファイル数少ない | features 間依存禁止ルール違反、責務肥大 | 不採用 |

## Design Decisions

### Decision: DataTableToolbar の配置場所
- **Context**: 共通化したツールバーをどこに配置するか
- **Alternatives Considered**:
  1. `components/shared/DataTableToolbar.tsx` — 共有コンポーネントディレクトリ
  2. `components/ui/data-table-toolbar.tsx` — shadcn/ui 層に配置
- **Selected Approach**: `components/shared/DataTableToolbar.tsx`
- **Rationale**: shadcn/ui は外部ライブラリのプリミティブ層、DataTableToolbar はアプリケーション固有のコンポジット。`shared/` が適切
- **Follow-up**: business-units の既存 DataTableToolbar を削除し、共通版に置き換え

### Decision: API 共通型・ユーティリティの共有レイヤー抽出
- **Context**: `PaginatedResponse`, `SingleResponse`, `ProblemDetails`, `ApiError`, `handleResponse` が business-units と projects で完全に同一のコードになる。features 間依存禁止ルールにより相互 import はできない
- **Alternatives Considered**:
  1. 各 feature で独立定義 — features 間依存禁止ルールに厳密に従うが型重複
  2. `lib/api/` 共有レイヤーに抽出 — features ではなく共有レイヤーなのでルール違反にならない
  3. `packages/types` 共有パッケージ — モノレポのパッケージ層だが現時点では過剰
- **Selected Approach**: `lib/api/` に `types.ts` と `client.ts` を作成し共通化
- **Rationale**: `lib/` は既存の共有ユーティリティ層（`lib/utils.ts`）と同じレベル。features 間の依存ではなく、全 feature が共有レイヤーに依存する構造で規約準拠
- **Trade-offs**: 既存 business-units の api-client.ts からの移行作業が追加で必要
- **Follow-up**: business-units の `ApiError`, `handleResponse`, `API_BASE_URL` を `lib/api/client.ts` から import するよう移行

### Decision: Select コンポーネントの実装
- **Context**: FK ドロップダウンとステータス選択に Select が必要
- **Selected Approach**: shadcn/ui の Select パターンに準拠し `components/ui/select.tsx` を作成
- **Rationale**: ユーザー指示。既存の shadcn/ui コンポーネント群と統一

### Decision: 削除確認ダイアログの共通化
- **Context**: 現在の DeleteConfirmDialog は `businessUnitName` プロパティがハードコード
- **Selected Approach**: props を `entityName` と `entityLabel`（例: "案件"）に汎用化
- **Rationale**: projects でも同パターンを使うため、共通化が自然
- **Follow-up**: business-units の既存利用箇所も更新

## Risks & Mitigations
- `@radix-ui/react-select` の追加による bundle サイズ増加 — 影響は軽微（他の Radix コンポーネントと共通部分あり）
- DataTableToolbar 共通化に伴う business-units 側の修正 — 後方互換性を props デフォルト値で担保

## References
- shadcn/ui Select: https://ui.shadcn.com/docs/components/select
- TanStack Form: https://tanstack.com/form/latest
- TanStack Query: https://tanstack.com/query/latest

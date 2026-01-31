# Research & Design Decisions

## Summary
- **Feature**: `project-types-master-ui`
- **Discovery Scope**: Simple Addition（既存パターンの転用）
- **Key Findings**:
  - business-units マスタ UI が完全な参照実装として存在し、エンティティ構造（code, name, displayOrder）が同一
  - バックエンド API（`/project-types`）は全 CRUD + restore エンドポイントが実装済み
  - フロントエンドの feature モジュール・ルートファイルは未作成（完全なグリーンフィールド）

## Research Log

### 既存 business-units 実装の構造分析
- **Context**: project-types UI の設計にあたり、参照実装としての business-units の構造を調査
- **Sources Consulted**: `apps/frontend/src/features/business-units/`, `apps/frontend/src/routes/master/business-units/`
- **Findings**:
  - feature モジュール: `api/`（api-client.ts, queries.ts, mutations.ts）、`components/`（6ファイル）、`types/`（index.ts）、`index.ts`
  - routes: `index.tsx`（一覧）、`new.tsx`（新規）、`$businessUnitCode/index.tsx`（詳細）、`$businessUnitCode/edit.tsx`（編集）
  - 全コンポーネントが shadcn/ui + Tailwind CSS v4 で統一
  - DebouncedSearchInput は IME 対応済み
- **Implications**: 同一パターンを project-types に転用可能。エンティティ名の置換が主な作業

### バックエンド API 型定義の確認
- **Context**: フロントエンドの型定義をバックエンドと整合させるための調査
- **Sources Consulted**: `apps/backend/src/types/projectType.ts`
- **Findings**:
  - `ProjectType` レスポンス型: `projectTypeCode`, `name`, `displayOrder`, `createdAt`, `updatedAt`
  - `createProjectTypeSchema`: `projectTypeCode`（1-20文字, 英数字+ハイフン+アンダースコア）, `name`（1-100文字）, `displayOrder`（0以上整数, デフォルト0）
  - `updateProjectTypeSchema`: `name`（1-100文字）, `displayOrder`（0以上整数, optional）
  - API パスは `/project-types/:projectTypeCode`
- **Implications**: BusinessUnit と ProjectType のフィールド構造が完全に一致。バリデーションルールも同一

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| business-units からの複製・リネーム | feature モジュールとルートファイルを複製し、エンティティ名を置換 | 実績あるパターン、確実性が高い、feature 間依存なし | コード重複（DataTable, DebouncedSearchInput 等） | 推奨。Rule of Three で 3 つ目のマスタ画面追加時に共通化を検討 |

## Design Decisions

### Decision: コード複製 vs 共通化
- **Context**: DataTable, DataTableToolbar, DebouncedSearchInput 等の汎用コンポーネントを共通化するか
- **Alternatives Considered**:
  1. 共通化 — `components/` に抽出して business-units と project-types で共有
  2. 複製 — 各 feature モジュール内にコピーして独立管理
- **Selected Approach**: 複製（feature 内にコピー）
- **Rationale**: features 間依存禁止の規約を遵守。2 つ目のパターンであり、共通化の判断は時期尚早
- **Trade-offs**: コード重複を許容する代わりに、各 feature の独立性を維持
- **Follow-up**: 3 つ目のマスタ画面追加時に共通コンポーネント抽出を検討

### Decision: サイドバーメニューへの追加
- **Context**: 新しいマスタ画面へのナビゲーションリンクが必要
- **Selected Approach**: 既存サイドバーに「案件タイプ」メニュー項目を追加
- **Rationale**: 既存の AppShell / Sidebar コンポーネントの拡張で対応可能

## Risks & Mitigations
- リスク: コード重複によるメンテナンスコスト — 緩和策: 3 つ目のマスタ画面追加時に共通化リファクタリングを計画

## References
- `apps/frontend/src/features/business-units/` — 参照実装
- `apps/backend/src/types/projectType.ts` — バックエンド型定義
- `.kiro/specs/business-units-master-ui/design.md` — 参照デザインドキュメント

# Research & Design Decisions

## Summary
- **Feature**: `master-sheet-crud`
- **Discovery Scope**: Extension（既存マスター管理画面の Sheet 化）
- **Key Findings**:
  - 既存 Sheet 実装（4 件）はすべて編集/作成専用。閲覧モード（view mode）は新規パターン
  - CRUD ファクトリ（`createCrudClient` / `createQueryKeys` / `createCrudMutations`）が成熟しており、API/Query/Mutation 層の変更は不要
  - 3 マスターのフォームコンポーネントは `mode: "create" | "edit"` パターンで統一済み。Sheet 内でそのまま再利用可能

## Research Log

### Sheet モード管理パターン

- **Context**: 既存 Sheet は `create | edit` の 2 モードのみ。今回は `view | edit | create` の 3 モードが必要
- **Sources Consulted**: 既存実装（`ProjectEditSheet.tsx`, `CaseFormSheet.tsx` × 2, `ScenarioFormSheet.tsx`）
- **Findings**:
  - `ProjectEditSheet`: 親が `editingProjectId` で開閉管理、edit のみ
  - `CaseFormSheet`（indirect）: 親が `formOpen` / `formMode` / `editTarget` で管理
  - `CaseFormSheet`（case-study）: 親が `formSheet` オブジェクト（`{ open, mode, editCaseId }`）で管理
  - 最も拡張しやすいのは `formSheet` オブジェクトパターン。`mode` に `"view"` を追加するだけ
- **Implications**: discriminated union で `SheetState` 型を定義し、3 モードを型安全に管理する

### データ取得タイミング

- **Context**: Sheet 内で useQuery vs 親から props のどちらが適切か
- **Sources Consulted**: 既存パターン比較
- **Findings**:
  - Sheet 内 useQuery（`ProjectEditSheet` / `CaseFormSheet` case-study）: Sheet が自身のデータライフサイクルを管理。`enabled: open && id != null` で不要なフェッチを防止
  - 親から props（`CaseFormSheet` indirect）: 親がすでにデータを持つ場合に効率的
  - マスター一覧画面では詳細データ（単一レコード）は一覧レスポンスに含まれている場合がある
- **Implications**: 一覧データから row データを直接渡すのが最も効率的。追加の API コールは不要（一覧レスポンスにすべてのフィールドが含まれている）

### 3 マスター間の差異と共通化戦略

- **Context**: どの粒度で共通化すべきか
- **Sources Consulted**: 各マスターの型定義、フォームコンポーネント、カラム定義
- **Findings**:
  - 共通フィールド: `code`, `name`, `displayOrder`, `createdAt`, `updatedAt`, `deletedAt`
  - 差異: work-types のみ `color` フィールドあり、business-units のみページネーションあり
  - フォーム Props が統一されている: `{ mode, defaultValues, onSubmit, isSubmitting }`
- **Implications**: 共通コンポーネントよりも、各 Sheet で同一パターンを適用する方がシンプル。差異が小さいため過度な抽象化は不要

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A: 個別 Sheet × 3 | 各 feature に DetailSheet を作成 | 固有差異を自然に吸収、独立変更可能 | モード切替ロジックが 3 箇所で重複 | シンプルだが DRY 違反 |
| B: 共通 MasterDetailSheet | shared に汎用 Sheet を作成 | ロジック一元化、UI 統一保証 | ジェネリクスの複雑化、柔軟性低下 | 3 マスターのみでは過度な抽象化 |
| C: 共通 Hook + 個別 Sheet | Hook でモード管理共通化、UI は個別 | ロジック共通化と UI 柔軟性の両立 | ファイル数が若干多い | **採用** |

## Design Decisions

### Decision: Sheet モード管理に discriminated union 型を使用

- **Context**: `view | edit | create` の 3 モードを型安全に管理する必要がある
- **Alternatives Considered**:
  1. 個別 state（`open: boolean`, `mode: string`, `selectedCode: string | null`）
  2. discriminated union（`{ mode: "closed" } | { mode: "view", code: string } | ...`）
- **Selected Approach**: discriminated union（Option 2）
- **Rationale**: モードごとに必要なデータが異なる（view/edit は code が必須、create は不要）。discriminated union で不正な状態を型レベルで排除できる
- **Trade-offs**: 型定義がやや冗長になるが、ランタイムエラーを防止
- **Follow-up**: 各マスターで同一の型パターンを適用

### Decision: 一覧データから詳細表示用データを取得

- **Context**: Sheet 閲覧モードの表示データをどこから取得するか
- **Alternatives Considered**:
  1. Sheet 内で detail API を呼び出す（useQuery）
  2. 一覧の row データを直接渡す
- **Selected Approach**: 一覧の row データを直接渡す（Option 2）
- **Rationale**: マスターエンティティのフィールドは少なく、一覧レスポンスにすべて含まれている。追加 API コールは無駄
- **Trade-offs**: 一覧データが古い可能性があるが、mutation 後のキャッシュ無効化で解決済み
- **Follow-up**: edit モードでも row データを defaultValues として使用

### Decision: 各マスターに個別 Sheet コンポーネントを作成（共通 Hook 使用）

- **Context**: 3 マスターの Sheet をどう構成するか
- **Selected Approach**: Option C（ハイブリッド）
- **Rationale**: モード管理ロジックは Hook で共通化、UI と固有フィールドは各 Sheet で個別管理。feature ベース構成に自然に収まる
- **Trade-offs**: Option B より若干ファイル数が多いが、各マスターを独立して変更可能

## Risks & Mitigations
- **旧ルート削除後のブックマーク/リンク切れ**: 旧ルートへのアクセスは 404 になる。影響は軽微（内部ツール、ユーザー数が限定的）
- **Sheet 内フォームの表示領域**: Sheet の幅（`sm:max-w-lg`）でフォームが窮屈になる可能性。既存 Sheet（ProjectEditSheet）で同一幅を使用しており問題なし
- **routeTree.gen.ts の再生成**: ルートファイル削除後に TanStack Router の自動生成ファイルを更新する必要あり

## References
- 既存実装: `apps/frontend/src/features/workload/components/ProjectEditSheet.tsx`
- 既存実装: `apps/frontend/src/features/indirect-case-study/components/CaseFormSheet.tsx`
- 既存実装: `apps/frontend/src/features/case-study/components/CaseFormSheet.tsx`
- shadcn/ui Sheet: `apps/frontend/src/components/ui/sheet.tsx`（Radix UI Dialog ベース）
- CRUD ファクトリ: `apps/frontend/src/lib/api/`

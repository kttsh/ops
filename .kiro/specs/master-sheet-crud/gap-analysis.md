# Gap Analysis: master-sheet-crud

## 1. 現状調査

### 1.1 対象ファイル・ディレクトリ構成

**ルートファイル（廃止対象: 9ファイル）**

| マスター | list | detail | edit | new |
|----------|------|--------|------|-----|
| business-units | `routes/master/business-units/index.tsx` | `$businessUnitCode/index.tsx` | `$businessUnitCode/edit.tsx` | `new.tsx` |
| project-types | `routes/master/project-types/index.tsx` | `$projectTypeCode/index.tsx` | `$projectTypeCode/edit.tsx` | `new.tsx` |
| work-types | `routes/master/work-types/index.tsx` | `$workTypeCode/index.tsx` | `$workTypeCode/edit.tsx` | `new.tsx` |

**フィーチャーモジュール（再利用対象）**

各マスターとも同一構成:
- `features/[entity]/api/api-client.ts` — CRUDクライアント（`createCrudClient` ファクトリ）
- `features/[entity]/api/queries.ts` — TanStack Query options（`createQueryKeys` / `createListQueryOptions` / `createDetailQueryOptions`）
- `features/[entity]/api/mutations.ts` — Mutation hooks（`createCrudMutations` → useCreate / useUpdate / useDelete / useRestore）
- `features/[entity]/components/[Entity]Form.tsx` — フォーム（mode: create | edit）
- `features/[entity]/components/columns.tsx` — DataTable カラム定義
- `features/[entity]/types/index.ts` — Zod スキーマ・型定義

**共有コンポーネント（再利用対象）**
- `components/shared/DataTable.tsx` — `onRowClick` prop でクリックハンドリング済み
- `components/shared/DetailRow.tsx` — label/value のキーバリュー表示（detail ページで使用中）
- `components/ui/sheet.tsx` — Radix UI ベースの Sheet（side: right, overlay 付き）
- `components/shared/DeleteConfirmDialog.tsx` — 削除確認ダイアログ
- `components/shared/RestoreConfirmDialog.tsx` — 復元確認ダイアログ

### 1.2 既存パターン・規約

- **CRUD ファクトリパターン**: `createCrudClient` / `createQueryKeys` / `createCrudMutations` により、API・クエリ・ミューテーションが完全に抽象化済み
- **フォームモードパターン**: 各フォームが `mode: "create" | "edit"` を受け取り、code フィールドの disabled 制御やバリデーション切替を実装済み
- **キャッシュ自動無効化**: mutation hooks が `lists()` / `detail()` のクエリキーを自動無効化
- **エラーハンドリング**: `ApiError` + `problemDetails` による RFC 9457 準拠のステータス別エラー処理
- **ソフトデリート**: `deletedAt` フィールド、`includeDisabled` フィルタ、復元 API（`/actions/restore`）
- **行クリック**: `DataTable` の `onRowClick` が `<a>` / `<button>` 要素クリックを除外する安全なハンドリング済み

### 1.3 既存 Sheet 実装（先行パターン）

| コンポーネント | パターン | モード | データ取得 | ミューテーション |
|---------------|---------|--------|-----------|---------------|
| `ProjectEditSheet` | 編集専用 | edit のみ | Sheet 内で useQuery | Sheet 内で mutation |
| `CaseFormSheet`（indirect） | 作成/編集 | create / edit | なし（親から defaultValues） | 親で mutation |
| `CaseFormSheet`（case-study） | 作成/編集 | create / edit | Sheet 内で useQuery（edit 時） | Sheet 内で mutation |
| `ScenarioFormSheet` | 作成/編集 | create / edit | なし（親から defaultValues） | 親で mutation |

**重要な発見: 既存 Sheet に「閲覧モード」を持つものはない。すべて編集/作成専用。**

---

## 2. 要件実現可能性分析

### 2.1 要件→既存資産マッピング

| 要件 | 必要な技術要素 | 既存資産 | ギャップ |
|------|-------------|---------|---------|
| Req 1: 詳細 Sheet 表示 | Sheet + DetailRow 表示 + データ取得 | Sheet UI ✅, DetailRow ✅, useQuery ✅ | **Missing**: 閲覧モード付き Sheet コンポーネント |
| Req 2: Sheet 内編集 | 閲覧→編集モード切替 + フォーム + mutation | Form ✅, mutations ✅ | **Missing**: モード切替ロジック（view ↔ edit） |
| Req 3: Sheet 内新規作成 | 空フォーム Sheet + mutation | Form ✅, mutations ✅, CaseFormSheet パターン ✅ | ギャップなし（既存パターンで実現可能） |
| Req 4: 削除・復元 | 確認ダイアログ + mutation | DeleteConfirmDialog ✅, RestoreConfirmDialog ✅, mutations ✅ | **Missing**: Sheet 内への統合 |
| Req 5: 旧ルート廃止 | ルートファイル削除 | — | ギャップなし（削除のみ） |
| Req 6: 共通パターン | 共通 Sheet コンポーネント or Hook | — | **Missing**: 3 マスターで共通化する仕組み |

### 2.2 主要ギャップ

1. **閲覧モード（View Mode）**: 既存 Sheet はすべて編集/作成専用。閲覧モード（DetailRow 表示 + 編集ボタン）は新規実装が必要
2. **モード切替（view → edit → view）**: 既存パターンにない。Sheet 内で `view | edit | create` の 3 モードを管理するステートロジックが必要
3. **共通化パターン**: 3 マスターのフィールド構成が微妙に異なる（work-types に color フィールド）。共通 Sheet をどの粒度で抽象化するかの設計が必要

### 2.3 マスター間の差異

| 差異項目 | business-units | project-types | work-types |
|----------|---------------|---------------|------------|
| ページネーション | あり（page/pageSize） | なし | なし |
| color フィールド | なし | なし | あり |
| 詳細表示フィールド | code, name, displayOrder, updatedAt | code, name, displayOrder, updatedAt | code, name, displayOrder, updatedAt |
| フォームフィールド | code, name, displayOrder | code, name, displayOrder | code, name, displayOrder, color |

### 2.4 複雑性シグナル

- **CRUD パターン**: 既存ファクトリで完全にカバー（低複雑性）
- **UI パターン**: Sheet + モード切替は新規だが、既存 Sheet パターンの拡張で対応可能（中複雑性）
- **外部連携**: なし
- **データモデル変更**: なし（既存 API をそのまま使用）

---

## 3. 実装アプローチ選択肢

### Option A: 各マスターに個別 Sheet コンポーネントを作成

**概要**: 各 feature に `BusinessUnitDetailSheet.tsx` / `ProjectTypeDetailSheet.tsx` / `WorkTypeDetailSheet.tsx` を作成

**変更ファイル**:
- 新規: `features/[entity]/components/[Entity]DetailSheet.tsx` × 3
- 変更: `routes/master/[entity]/index.tsx` × 3（Sheet 統合）
- 削除: `routes/master/[entity]/$code/index.tsx` × 3, `$code/edit.tsx` × 3, `new.tsx` × 3（計 9 ファイル）

**トレードオフ**:
- ✅ 各マスター固有の差異（color フィールド等）を自然に吸収
- ✅ 既存 CaseFormSheet パターンに沿った実装
- ✅ 各マスターを独立して変更可能
- ❌ 3 ファイルで閲覧/編集モード切替ロジックが重複
- ❌ 修正時に 3 箇所を同期する必要

### Option B: 共通 MasterDetailSheet コンポーネントを作成

**概要**: `components/shared/MasterDetailSheet.tsx` を作成し、3 マスターで共用。ジェネリクスと render props / children で差異を吸収

**変更ファイル**:
- 新規: `components/shared/MasterDetailSheet.tsx`
- 変更: `routes/master/[entity]/index.tsx` × 3（Sheet 統合）
- 削除: 同上（計 9 ファイル）

**トレードオフ**:
- ✅ モード切替ロジックの一元管理
- ✅ UI/UX の統一が自動的に保証
- ❌ ジェネリクスによる型の複雑化
- ❌ 差異（color フィールド、ページネーション）の吸収に柔軟性が必要
- ❌ 過度な抽象化リスク（3 マスターのみの共通化）

### Option C: ハイブリッド（共通 Hook + 個別 Sheet）— 推奨

**概要**: モード管理ロジックを共通 Hook（`useMasterSheet`）に抽出し、各マスターに個別の Sheet コンポーネントを作成。Sheet の見た目とフィールド構成は各マスターが持つが、状態管理は共通化

**変更ファイル**:
- 新規: 共通 Hook（`hooks/useMasterSheet.ts` or 各 feature 内にインライン）
- 新規: `features/[entity]/components/[Entity]DetailSheet.tsx` × 3
- 変更: `routes/master/[entity]/index.tsx` × 3（Sheet 統合、onRowClick 変更）
- 削除: 同上（計 9 ファイル）

**トレードオフ**:
- ✅ ロジックの共通化（Hook）と UI の柔軟性（個別 Sheet）を両立
- ✅ 既存 feature 構成（features/[entity]/components/）に自然に収まる
- ✅ 各マスター固有のフィールドや振る舞いを容易にカスタマイズ
- ✅ 適度な抽象度（Hook レベルの共通化で十分）
- ❌ Option B より若干ファイル数が多い
- ❌ Sheet の見た目の統一は開発者の規律に依存

---

## 4. 工数・リスク評価

### 工数: **M（3〜7 日）**
- 既存ファクトリパターンが成熟しており、API/Query/Mutation 層の変更は不要
- フォームコンポーネントをそのまま再利用可能
- 主な作業は Sheet コンポーネント作成 + 一覧ルート変更 + 旧ルート削除
- 3 マスターへの展開は 1 つ目の実装後はコピー＆アジャスト

### リスク: **Low**
- 既存パターン（Sheet, Form, mutations, DataTable）の組み合わせで実現可能
- API・データモデルの変更なし
- 既存 Sheet 実装が 4 つあり、参考パターンが豊富
- 唯一の新規要素は「閲覧モード」だが、DetailRow コンポーネントが既に存在

---

## 5. 設計フェーズへの推奨事項

### 推奨アプローチ: Option C（ハイブリッド）

**理由**:
- 3 マスターの差異が小さい（color フィールドのみ）ため、過度な抽象化は不要
- 共通 Hook でモード管理を統一しつつ、各 Sheet の UI は個別に管理
- 既存の feature ベース構成に自然に適合

### 設計フェーズで決定すべき事項

1. **Sheet のモード管理**: `view | edit | create` の 3 ステート管理をどのレベルで行うか（Hook vs 親コンポーネント vs Sheet 内部）
2. **データ取得タイミング**: Sheet 内で useQuery（ProjectEditSheet パターン）vs 親から props（CaseFormSheet パターン）
3. **ミューテーション配置**: Sheet 内で mutation（ProjectEditSheet パターン）vs 親で mutation
4. **onRowClick の変更方法**: 現在のページ遷移（`navigate()`）を Sheet open に変更する際、hover プリフェッチをどう扱うか

### Research Needed

- 特になし。既存パターンと技術スタックの範囲内で実装可能

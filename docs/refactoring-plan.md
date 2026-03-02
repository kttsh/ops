# リファクタリング計画書

> 策定日: 2026-03-02
> 対象: ops モノレポ全体 (apps/backend, apps/frontend)
> 手法: Martin Fowler「リファクタリング」カタログに基づく

---

## 1. 現状分析サマリー

### コードベース規模

| レイヤー | ファイル数 | 総行数 (本番コードのみ) |
|---------|----------|----------------------|
| Backend (routes/services/data/transform/types) | ~90 | ~12,200 |
| Frontend (features/routes/components/lib) | ~120 | ~16,400 |
| **合計** | **~210** | **~28,600** |

### 検出されたコードスメル総数

| 深刻度 | 件数 | 推定重複行数 |
|--------|------|-------------|
| CRITICAL | 8 | ~1,800 |
| HIGH | 14 | ~1,200 |
| MEDIUM | 12 | ~600 |
| LOW | 5 | ~200 |
| **合計** | **39** | **~3,800** |

重複・ボイラープレートが全体の **約13%** を占める。

---

## 2. コードスメル詳細分析

### 2.1 Backend: Routes レイヤー

#### [B-R1] parseIntParam 関数の重複 (CRITICAL)
- **スメル**: Duplicated Code / Shotgun Surgery
- **影響範囲**: 14ファイル (~110行の重複)
- **内容**: パスパラメータのパース関数が全ルートファイルにコピペ。さらに2つの異なるシグネチャ (`string` vs `string | undefined`) が混在し、エラーメッセージも不統一
- **対象ファイル**: `routes/projects.ts`, `routes/projectCases.ts`, `routes/monthlyCapacities.ts`, `routes/monthlyIndirectWorkLoads.ts`, `routes/chartViewProjectItems.ts`, `routes/monthlyHeadcountPlans.ts`, `routes/indirectWorkTypeRatios.ts`, `routes/projectLoads.ts`, `routes/chartColorSettings.ts`, `routes/chartStackOrderSettings.ts` 他4ファイル

#### [B-R2] ページネーションレスポンスのボイラープレート (CRITICAL)
- **スメル**: Duplicated Code / Feature Envy
- **影響範囲**: 12ファイル (~96行の重複)
- **内容**: `{ data, meta: { pagination: { ... } } }` 構造の組み立てが全一覧エンドポイントで同一コードとして繰り返される
- **対象ファイル**: `routes/workTypes.ts`, `routes/businessUnits.ts`, `routes/projectTypes.ts`, `routes/capacityScenarios.ts`, `routes/headcountPlanCases.ts`, `routes/indirectWorkCases.ts`, `routes/projects.ts`, `routes/projectCases.ts`, `routes/chartColorSettings.ts`, `routes/chartStackOrderSettings.ts`, `routes/chartViews.ts`, `routes/standardEffortMasters.ts`

#### [B-R3] ルート集約の肥大化 (MEDIUM)
- **スメル**: Long Method / Open-Closed Principle 違反
- **影響範囲**: `index.ts` 1ファイル (23ルートを直接マウント)
- **内容**: ドメイン境界なくフラットに全ルートをマウント。新ルート追加のたびに必ず修正が必要

#### [B-R4] Location ヘッダーの手動構築 (LOW)
- **スメル**: Duplicated Code
- **影響範囲**: 7ファイル
- **内容**: POST 成功時の `c.header("Location", ...)` が各ルートで手動構築

---

### 2.2 Backend: Services レイヤー

#### [B-S1] CRUD サービスパターンの大量重複 (CRITICAL)
- **スメル**: Duplicated Code / Parallel Class Hierarchies
- **影響範囲**: 20+ サービスファイル (~85-90% のコード構造が同一)
- **内容**: `findAll`, `findById`, `create`, `update`, `delete`, `restore` の6メソッドが全マスター系サービスで同一構造。差異は型名とデータ層呼び出し先のみ
- **代表例**:
  - `workTypeService.ts` (92行)
  - `projectTypeService.ts` (87行)
  - `businessUnitService.ts` (88行)

#### [B-S2] Middle Man / Pass-Through 層 (HIGH)
- **スメル**: Middle Man / Feature Envy
- **影響範囲**: 15+ サービスファイル
- **内容**: サービス層がビジネスロジックをほとんど持たず、Data 層への委譲 + Transform 呼び出しだけの薄いラッパーとして機能。サービス層としての存在意義が薄い

#### [B-S3] 親リソース存在チェックの重複 (HIGH)
- **スメル**: Duplicated Code
- **影響範囲**: `monthlyCapacityService.ts`, `indirectWorkTypeRatioService.ts`, `monthlyHeadcountPlanService.ts`, `projectLoadService.ts`
- **内容**: ネストリソースの各メソッド冒頭で親リソースの存在チェックを同一コードで繰り返す (1ファイル内で3-4回、ファイル間でも重複)

#### [B-S4] バルク Upsert バリデーションの重複 (MEDIUM)
- **スメル**: Duplicated Code
- **影響範囲**: 4サービスファイル
- **内容**: 一括登録時の重複キーチェック (`new Set(keys).size !== keys.length`) が同一パターンで4箇所に存在

#### [B-S5] ソフトデリート認識ロジックの重複 (HIGH)
- **スメル**: Duplicated Code
- **影響範囲**: `workTypeService.ts`, `projectTypeService.ts`, `businessUnitService.ts` 他
- **内容**: 「削除済みレコードが存在する場合の復元案内付き 409 エラー」パターンが全ソフトデリート対応サービスで同一

---

### 2.3 Backend: Data レイヤー

#### [B-D1] SQL クエリパターンの大量重複 (CRITICAL)
- **スメル**: Duplicated Code
- **影響範囲**: 22 データファイル (~1,770行)
- **内容**:
  - **ソフトデリート SQL**: 7ファイルで同一 UPDATE 文
  - **リストア SQL**: 4ファイルで同一 UPDATE 文
  - **ページネーション計算**: 8ファイルで `offset = (page - 1) * pageSize` + 二重クエリパターン
  - **参照チェック**: 3ファイルで `CASE WHEN EXISTS(...)` パターン
  - **作成パターン**: `INSERT + OUTPUT + findById 再取得` が全データファイルで同一構造

#### [B-D2] WHERE 句の文字列組み立て (MEDIUM)
- **スメル**: Primitive Obsession
- **影響範囲**: `projectData.ts`, `standardEffortMasterData.ts`, `headcountPlanCaseData.ts`, `indirectWorkCaseData.ts`
- **内容**: フィルタ条件を `string[]` に push して `join(" AND ")` する手法が型安全でない

---

### 2.4 Backend: Transform レイヤー

#### [B-T1] 機械的フィールドマッピングのみ (HIGH)
- **スメル**: Unnecessary Indirection / Inline Class
- **影響範囲**: 21 transform ファイル (~170行)
- **内容**: Transform 層の99%が `snake_case → camelCase` のフィールド名変換のみ。ビジネスロジックなし。汎用マッパーで代替可能
- **例**: `workTypeTransform.ts` (12行), `businessUnitTransform.ts` (11行), `projectTypeTransform.ts` (11行)

---

### 2.5 Backend: Types レイヤー

#### [B-TY1] Zod スキーマの重複定義 (CRITICAL)
- **スメル**: Duplicated Code / Shotgun Surgery
- **影響範囲**: 24型ファイル (~1,816行)
- **内容**:
  - **yearMonthSchema**: 7ファイルで同一定義
  - **businessUnitCode バリデーション**: 6ファイルで同一 (min/max 不統一あり)
  - **colorCode 正規表現**: 3ファイルで定義 (大文字小文字の揺れあり)
  - **paginationQuerySchema.extend**: 13ファイルで同一拡張パターン
  - **Create/Update スキーマペア**: 全22ファイルで同一パターン (Update は optional 化)

#### [B-TY2] chartData.ts の肥大化 (MEDIUM)
- **スメル**: God Class
- **影響範囲**: `types/chartData.ts` (162行)
- **内容**: CSV Transform ヘルパー + バリデーションスキーマ + 8つのTypeScript型が1ファイルに混在

---

### 2.6 Frontend: Features API レイヤー

#### [F-A1] API クライアントの CRUD パターン重複 (CRITICAL)
- **スメル**: Duplicated Code
- **影響範囲**: 7 features × api-client.ts (~180行の重複)
- **内容**: `fetch` + `handleResponse` の CRUD ラッパーが全 feature で同一構造。差異は URL パスと型名のみ
- **対象**: `work-types`, `business-units`, `projects`, `project-types`, `case-study`, `indirect-case-study` (3クライアント), `workload`

#### [F-A2] Query Key Factory の重複 (HIGH)
- **スメル**: Data Clumps
- **影響範囲**: 7 features × queries.ts
- **内容**: `{ all, lists, list, details, detail }` の Key Factory 構造が全 feature で同一。9行 × 7 = 63行の重複

#### [F-A3] Mutation Hook の重複 (HIGH)
- **スメル**: Duplicated Code
- **影響範囲**: 7 features × mutations.ts (~192行の重複)
- **内容**: `useCreate*`, `useUpdate*`, `useDelete*`, `useRestore*` が全 feature で同一構造。差異は API 関数名とキーのみ

#### [F-A4] staleTime のマジックナンバー散在 (MEDIUM)
- **スメル**: Magic Number
- **影響範囲**: 6+ queries.ts ファイル
- **内容**: `staleTime: 2 * 60 * 1000` (2分), `60 * 1000` (1分), `5 * 60 * 1000` (5分), `30 * 60 * 1000` (30分) が根拠不明のまま散在

#### [F-A5] トースト通知の不統一 (MEDIUM)
- **スメル**: Inconsistent Code
- **影響範囲**: mutations.ts 全般
- **内容**: 一部の Mutation は `onSuccess/onError` でトースト表示、他はトーストなし。メッセージも不統一

---

### 2.7 Frontend: Features Types レイヤー

#### [F-T1] エンティティ型の構造重複 (HIGH)
- **スメル**: Data Clumps / Parallel Inheritance Hierarchies
- **影響範囲**: 4 master features × types/index.ts
- **内容**: `WorkType`, `BusinessUnit`, `ProjectType`, `Project` が全て `{ code, name, displayOrder, createdAt, updatedAt, deletedAt }` の同一基本構造を持つが、共通の基底型がない

#### [F-T2] Zod バリデーションスキーマの重複 (HIGH)
- **スメル**: Duplicated Code
- **影響範囲**: 4 master features
- **内容**: `createXxxSchema` の `code`, `name`, `displayOrder` フィールドが同一バリデーションルール (min/max/regex) + 同一日本語エラーメッセージで定義。3ファイルで60行以上の重複

#### [F-T3] Search スキーマの不統一 (MEDIUM)
- **スメル**: Inconsistent Code
- **影響範囲**: `workTypeSearchSchema` (ページネーションなし) vs `businessUnitSearchSchema` (ページネーションあり)
- **内容**: 類似機能の一覧画面で異なるページネーション戦略。統一されたパターンがない

---

### 2.8 Frontend: Components レイヤー

#### [F-C1] formatDateTime 関数の4重複 (HIGH)
- **スメル**: Duplicated Code
- **影響範囲**: `columns.tsx` × 4 features
- **内容**: 同一の日時フォーマット関数が4ファイルに定義

#### [F-C2] ステータスバッジカラムの重複 (HIGH)
- **スメル**: Duplicated Code / Feature Envy
- **影響範囲**: `columns.tsx` × 3 features
- **内容**: `deletedAt` 判定 → Badge 表示の同一ロジックが3箇所に

#### [F-C3] 復元アクションカラムの重複 (HIGH)
- **スメル**: Duplicated Code
- **影響範囲**: `columns.tsx` × 4 features
- **内容**: 同一の復元ボタンロジックが4箇所に

#### [F-C4] displayOrder バリデータの重複 (HIGH)
- **スメル**: Duplicated Code
- **影響範囲**: `WorkTypeForm.tsx`, `BusinessUnitForm.tsx`, `ProjectTypeForm.tsx`
- **内容**: onChange/onBlur の同一バリデーションロジックが3箇所に

#### [F-C5] フォームフィールドラッパーの構造重複 (MEDIUM)
- **スメル**: Duplicated Code
- **影響範囲**: 全 Form コンポーネント
- **内容**: `<form.Field> → <div> → <Label> → <Input> → <ErrorMessage>` の同一構造が12+ 箇所で繰り返される

#### [F-C6] ProjectForm.tsx の Select コンポーネント重複 (HIGH)
- **スメル**: Feature Envy / Long Method
- **影響範囲**: `ProjectForm.tsx` (420行)
- **内容**: ローディング/エラー/成功の3状態を持つ Select パターンが2箇所で重複。`<QuerySelect />` として抽出可能

#### [F-C7] ケース管理リストの状態管理重複 (MEDIUM)
- **スメル**: Duplicated Code
- **影響範囲**: `HeadcountPlanCaseList.tsx`, `IndirectWorkCaseList.tsx`, `CapacityScenarioList.tsx`
- **内容**: `formOpen/formMode/editTarget/deleteTargetId` の状態管理 + CRUD ハンドラが3コンポーネントで同一

#### [F-C8] 巨大コンポーネント (200行超) (MEDIUM)
- **スメル**: Large Class / Long Method
- **対象**:
  - `ProjectForm.tsx` (420行) - 7フィールド + ネスト Select
  - `WorkloadDataTable.tsx` (416行) - 仮想化テーブル + 展開ロジック
  - `SidePanelSettings.tsx` (368行) - 期間/カラー/プロファイル管理が混在
  - `CaseForm.tsx` (356行) - 手動/標準計算モード切替
  - `CalculationResultTable.tsx` (320行) - 複数の条件分岐テーブル

---

### 2.9 Frontend: Routes レイヤー

#### [F-RO1] マスター CRUD ルートの大量重複 (CRITICAL)
- **スメル**: Duplicated Code / Clone Classes
- **影響範囲**: 4 master × 4ルート (index/new/edit/detail) = 16ファイル
- **内容**:
  - **一覧ページ**: 検索ハンドラ、ページネーションハンドラ、復元ダイアログロジックが4ファイルで同一 (各115-136行)
  - **新規作成ページ**: `handleSubmit` のエラーハンドリングが4ファイルで同一 (各23-32行)
  - **編集ページ**: ローディング/エラー状態表示 + 更新ハンドラが4ファイルで同一 (各108-125行)
  - **詳細ページ**: 削除/復元エラーハンドリング + ローディング/NotFound 表示が4ファイルで同一 (各145-210行)

#### [F-RO2] DetailRow コンポーネントの4重複 (MEDIUM)
- **スメル**: Duplicated Code
- **影響範囲**: 4 detail ページ
- **内容**: 同一の `DetailRow` ローカルコンポーネントが4ファイルに定義 (各8行)

#### [F-RO3] NotFound コンポーネントの4重複 (MEDIUM)
- **スメル**: Duplicated Code
- **影響範囲**: 4 detail ページ
- **内容**: `notFoundComponent` の同一 JSX が4ファイルに定義 (各12行)

#### [F-RO4] ルートパスのハードコード (MEDIUM)
- **スメル**: Magic String
- **影響範囲**: 全ルートファイル (40+ 箇所)
- **内容**: `"/master/work-types"` 等のパス文字列がリテラルとして散在

---

## 3. ファウラーのリファクタリングメソッド対応表

| ID | コードスメル | 適用するリファクタリング手法 | 難易度 | 削減行数 |
|----|------------|--------------------------|--------|---------|
| B-R1 | parseIntParam 重複 | **Extract Method** → 共通ユーティリティ | 低 | ~110 |
| B-R2 | ページネーション応答重複 | **Extract Method** → ヘルパー関数 | 低 | ~96 |
| B-S1 | CRUD サービスパターン重複 | **Extract Superclass** → ジェネリック Base Service | 高 | ~800 |
| B-S2 | Middle Man | **Inline Class** (検討) / **Move Method** | 中 | - |
| B-S3 | 親リソース存在チェック重複 | **Extract Method** → バリデーションユーティリティ | 低 | ~100 |
| B-S5 | ソフトデリートロジック重複 | **Extract Method** → 共通ヘルパー | 低 | ~60 |
| B-D1 | SQL パターン重複 | **Extract Superclass** → Base Data クラス / クエリビルダー | 高 | ~600 |
| B-T1 | 機械的 Transform | **Inline Class** → 汎用マッパーに置換 | 中 | ~170 |
| B-TY1 | Zod スキーマ重複 | **Extract Method** → 共通スキーマモジュール | 中 | ~200 |
| F-A1 | API クライアント重複 | **Extract Superclass** → CRUD クライアントファクトリ | 中 | ~180 |
| F-A2 | Query Key Factory 重複 | **Extract Method** → Key Factory ジェネレータ | 低 | ~63 |
| F-A3 | Mutation Hook 重複 | **Extract Method** → Mutation フックファクトリ | 中 | ~192 |
| F-T1 | エンティティ型の構造重複 | **Extract Superclass** → 基底インターフェース | 低 | ~80 |
| F-T2 | Zod スキーマ重複 | **Extract Method** → 共通スキーマヘルパー | 低 | ~60 |
| F-C1 | formatDateTime 重複 | **Extract Method** → lib/format-utils.ts | 低 | ~32 |
| F-C2-C3 | カラム定義重複 | **Extract Method** → カラムファクトリ | 低 | ~80 |
| F-C4 | バリデータ重複 | **Extract Method** → lib/validators.ts | 低 | ~40 |
| F-C5 | フォームフィールド構造重複 | **Extract Class** → FormField ラッパー | 中 | ~120 |
| F-C6 | Select ローディング重複 | **Extract Class** → QuerySelect | 中 | ~60 |
| F-C8 | 巨大コンポーネント | **Extract Class** → サブコンポーネント分割 | 中 | - |
| F-RO1 | マスター CRUD ルート重複 | **Extract Method** → カスタムフック群 | 高 | ~600 |
| F-RO2-3 | DetailRow/NotFound 重複 | **Extract Class** → 共有コンポーネント | 低 | ~80 |

---

## 4. リファクタリング実行計画

### Phase 1: 共通ユーティリティ抽出 (低リスク・高効果)

**目標**: 単純な関数/定数の重複を解消。既存の振る舞いを変えずに共通化。

#### 1-1. Backend 共通ユーティリティ
- [ ] `utils/parseParams.ts` 作成: `parseIntParam` を統一シグネチャで一元化 [B-R1]
- [ ] `utils/responseHelper.ts` 作成: `buildPaginatedResponse()` ヘルパー [B-R2]
- [ ] `utils/locationHelper.ts` 作成: `setLocationHeader()` ヘルパー [B-R4]
- [ ] 14ルートファイルからローカル `parseIntParam` を削除し、共通モジュールを import

#### 1-2. Backend 共通 Zod スキーマ
- [ ] `types/common.ts` 作成 (または既存 `pagination.ts` を拡張):
  - `yearMonthSchema` (7ファイルから集約) [B-TY1]
  - `businessUnitCodeSchema` (6ファイルから集約)
  - `colorCodeSchema` (3ファイルから集約)
  - `withIncludeDisabledFilter()` ヘルパー (13ファイルから集約)
- [ ] 各型ファイルを共通スキーマの import に切り替え

#### 1-3. Frontend 共通ユーティリティ
- [ ] `lib/format-utils.ts` に `formatDateTime()` を追加 [F-C1]
- [ ] `lib/validators.ts` 作成: `displayOrderValidators`, `stringLengthValidator`, `numberRangeValidator` [F-C4]
- [ ] `lib/api/constants.ts` 作成: `STALE_TIMES` 定数オブジェクト [F-A4]
- [ ] 4つの `columns.tsx` からローカル `formatDateTime` を削除

#### 1-4. Frontend 共有コンポーネント抽出
- [ ] `components/shared/DetailRow.tsx` 作成 [F-RO2]
- [ ] `components/shared/NotFoundState.tsx` 作成 [F-RO3]
- [ ] 4つの detail ルートから重複ローカルコンポーネントを削除

**推定削減行数**: ~400行
**リスク**: 低 (単純な Extract Method)
**所要規模**: 小

---

### Phase 2: パターン抽象化 (中リスク・高効果)

**目標**: 繰り返される構造パターンをファクトリ/ジェネレータに置き換え。

#### 2-1. Frontend: CRUD API インフラ
- [ ] `lib/api/crud-client-factory.ts` 作成: `createCrudClient<T>()` ファクトリ [F-A1]
  ```typescript
  // 使用例
  export const workTypeClient = createCrudClient<WorkType, CreateInput, UpdateInput>({
    basePath: "/work-types",
    idField: "workTypeCode",
  });
  ```
- [ ] `lib/api/query-key-factory.ts` 作成: `createQueryKeys()` ジェネレータ [F-A2]
- [ ] `lib/api/mutation-hooks-factory.ts` 作成: `createCrudMutations()` ジェネレータ [F-A3]
- [ ] 各 feature の `api-client.ts`, `queries.ts`, `mutations.ts` をファクトリ呼び出しに置換

#### 2-2. Frontend: カラムファクトリ
- [ ] `components/shared/column-helpers.ts` 作成 [F-C2, F-C3]:
  - `createStatusColumn()`
  - `createRestoreActionColumn()`
  - `createDateTimeColumn()`
  - `createSortableColumn()`
- [ ] 4つの `columns.tsx` をファクトリ呼び出しに簡素化

#### 2-3. Frontend: フォームインフラ
- [ ] `components/shared/FormField.tsx` 作成: Label + Input + Error 表示のラッパー [F-C5]
- [ ] `components/shared/QuerySelect.tsx` 作成: ローディング/エラー/成功 3状態の Select [F-C6]
- [ ] 各 Form コンポーネントを共通ラッパーで簡素化

#### 2-4. Frontend: 共通型定義
- [ ] `lib/types/base-entity.ts` 作成 [F-T1]:
  ```typescript
  export interface SoftDeletableEntity {
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
  }
  export interface MasterEntity extends SoftDeletableEntity {
    name: string;
    displayOrder: number;
  }
  ```
- [ ] `lib/schemas/master-entity-schema.ts` 作成: 共通 Zod スキーマヘルパー [F-T2]
- [ ] 各 feature の型を基底型の拡張に変更

#### 2-5. Backend: Transform 層の簡素化
- [ ] `utils/fieldMapper.ts` 作成: `snake_case → camelCase` 汎用変換 + ISO 日付フォーマット [B-T1]
- [ ] 既存 Transform ファイルを汎用マッパー + 差分カスタマイズの構成に移行
- [ ] ビジネスロジックを含む Transform (`chartViewTransform.ts`, `standardEffortMasterTransform.ts`) は個別に残す

**推定削減行数**: ~900行
**リスク**: 中 (API 互換性の維持が必要)
**所要規模**: 中

---

### Phase 3: アーキテクチャリファクタリング (高リスク・最大効果)

**目標**: レイヤー構造自体のボイラープレートを解消。

#### 3-1. Backend: Base CRUD Service
- [ ] `services/base/BaseCrudService.ts` 作成 [B-S1]:
  ```typescript
  abstract class BaseCrudService<TRow, TResponse, TCreate, TUpdate> {
    abstract dataAccess: BaseCrudData<TRow>;
    abstract transform(row: TRow): TResponse;

    async findAll(params): PaginatedResult<TResponse> { ... }
    async findById(id): TResponse { ... }
    async create(data: TCreate): TResponse { ... }
    async update(id, data: TUpdate): TResponse { ... }
    async softDelete(id): void { ... }
    async restore(id): TResponse { ... }
  }
  ```
- [ ] `services/base/BaseNestedService.ts` 作成: ネストリソース用基底 [B-S3]
- [ ] `utils/validationHelpers.ts` 作成: 親存在チェック、複合キー重複チェック [B-S3, B-S4]
- [ ] 既存の単純 CRUD サービスを基底クラス継承に移行

#### 3-2. Backend: Base CRUD Data
- [ ] `data/base/BaseCrudData.ts` 作成 [B-D1]:
  - 共通の `findAll` (ページネーション付き)
  - 共通の `softDelete` / `restore`
  - 共通の `hasReferences`
  - テーブル名・カラム定義をメタデータとして受け取る
- [ ] 単純な CRUD データクラスを基底クラス継承に移行

#### 3-3. Backend: ルートのドメイン別グルーピング
- [ ] `routes/master/index.ts` 作成: マスターデータ系ルートを集約 [B-R3]
- [ ] `routes/chart/index.ts` 作成: チャート関連ルートを集約
- [ ] `routes/workload/index.ts` 作成: 工数関連ルートを集約
- [ ] `index.ts` のルートマウントをドメイン単位に簡素化

#### 3-4. Frontend: マスター CRUD ルートの統合
- [ ] `hooks/useMasterListPage.ts` 作成 [F-RO1]:
  ```typescript
  export function useMasterListPage<T>(config: {
    queryOptions: (params) => QueryOptions;
    searchSchema: ZodSchema;
    basePath: string;
    entityName: string;
  }) { ... }
  ```
- [ ] `hooks/useMasterDetailPage.ts` 作成: 詳細/削除/復元ロジック共通化
- [ ] `hooks/useMasterFormPage.ts` 作成: 新規作成/編集のエラーハンドリング共通化
- [ ] 16のマスタールートファイルを共通フック呼び出し + JSX レイアウトのみに簡素化

#### 3-5. Frontend: 巨大コンポーネントの分割
- [ ] `ProjectForm.tsx` (420行) → `ProjectBasicFields` + `ProjectRelationFields` に分割 [F-C8]
- [ ] `SidePanelSettings.tsx` (368行) → `PeriodSettings` + `ProjectColorSettings` + `ProfileSettings` に分割
- [ ] `WorkloadDataTable.tsx` (416行) → カラム定義、展開ロジック、フィルタリングを分離
- [ ] `CaseForm.tsx` (356行) → 計算モード別コンポーネントに分割

**推定削減行数**: ~1,600行
**リスク**: 高 (アーキテクチャ変更。段階的移行が必須)
**所要規模**: 大

---

### Phase 4: 品質向上・統一化 (低リスク・整理)

**目標**: 一貫性の確保と残余の整理。

#### 4-1. トースト通知の統一
- [ ] `lib/toast-utils.ts` を拡充: CRUD 操作用の標準メッセージテンプレート [F-A5]
- [ ] 全 Mutation のトースト処理を統一パターンに

#### 4-2. ページネーション戦略の統一
- [ ] マスター一覧のページネーション有無を統一 [F-T3]
- [ ] `lib/api/constants.ts` にデフォルトページサイズを定義

#### 4-3. Backend 型ファイルの整理
- [ ] `chartData.ts` を分割 (`chartDataSchemas.ts` + `chartDataTypes.ts`) [B-TY2]
- [ ] `chartColorPalette.ts` と `chartColorSetting.ts` を `chartSettings.ts` に統合
- [ ] `pagination.ts` を `types/common.ts` に統合

#### 4-4. Row 型の命名統一
- [ ] JOIN 付き Row 型を `*DetailRow` / `*QueryRow` に改名して意図を明確化

**推定削減行数**: ~200行
**リスク**: 低
**所要規模**: 小

---

## 5. 実行順序と依存関係

```
Phase 1 (共通ユーティリティ)
  ├── 1-1 Backend ユーティリティ ← 最初に着手
  ├── 1-2 Backend Zod スキーマ
  ├── 1-3 Frontend ユーティリティ
  └── 1-4 Frontend 共有コンポーネント
        │
Phase 2 (パターン抽象化) ← Phase 1 完了後
  ├── 2-1 CRUD API インフラ
  ├── 2-2 カラムファクトリ (Phase 1-3 依存)
  ├── 2-3 フォームインフラ
  ├── 2-4 共通型定義
  └── 2-5 Transform 簡素化
        │
Phase 3 (アーキテクチャ) ← Phase 2 完了後
  ├── 3-1 Base CRUD Service (Phase 2-5 依存)
  ├── 3-2 Base CRUD Data
  ├── 3-3 ルートグルーピング
  ├── 3-4 マスター CRUD ルート統合 (Phase 2-1, 2-2, 2-3 依存)
  └── 3-5 巨大コンポーネント分割
        │
Phase 4 (品質向上) ← 随時実行可
  ├── 4-1 トースト統一
  ├── 4-2 ページネーション統一
  ├── 4-3 型ファイル整理
  └── 4-4 Row 型命名統一
```

---

## 6. リスク管理

### 各 Phase のリスクと対策

| Phase | リスク | 対策 |
|-------|-------|------|
| Phase 1 | 低: 純粋な関数抽出のため振る舞い変化なし | 既存テストが全パスすることを確認 |
| Phase 2 | 中: ファクトリのインターフェース設計ミス | 最初の1 feature で PoC を実施し、残りに展開 |
| Phase 3 | 高: 基底クラスの設計が全エンティティに影響 | feature flag やブランチ戦略で段階的に移行。旧実装との並行稼働期間を設ける |
| Phase 4 | 低: 表面的な変更のみ | — |

### 全体方針
- **各タスクは1機能(1 feature / 1エンティティ)単位でPRを作成**し、段階的にマージ
- **テストカバレッジを維持**: リファクタリング前後で既存テストが全パスすること
- **振る舞いの変更を伴わない**: 外部 API レスポンスや UI の見た目は一切変更しない
- **Strangler Fig パターン**: Phase 3 では旧実装を一度に削除せず、新基底クラスへの移行を1エンティティずつ進める

---

## 7. 期待される効果

### 定量的効果

| 指標 | Before | After (推定) | 改善率 |
|------|--------|-------------|--------|
| 総行数 (本番コード) | ~28,600 | ~24,000 | -16% |
| 重複コード行 | ~3,800 | ~400 | -89% |
| 新エンティティ追加時の必要行数 | ~600 | ~100 | -83% |
| 変更波及ファイル数 (共通パターン修正時) | 14-20 | 1-2 | -90% |

### 定性的効果
- **保守性向上**: 共通パターンの修正が1箇所で完結
- **一貫性確保**: バリデーション、エラーメッセージ、レスポンス形式の統一
- **オンボーディング改善**: 新規開発者が理解すべきパターンが明確に
- **拡張性向上**: 新機能追加時のボイラープレートが大幅削減

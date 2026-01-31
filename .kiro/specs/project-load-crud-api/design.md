# Technical Design: project-load-crud-api

## Overview

**Purpose**: 案件ケース（project_cases）に紐づく月次負荷データ（project_load）の CRUD API を提供し、工数計画の入力・管理を可能にする。

**Users**: プロジェクトマネージャーが月次工数の入力・修正・一括更新に利用する。フロントエンドの積み上げチャートの基盤データとなる。

**Impact**: バックエンドに project_load ファクトテーブル用の CRUD + バルク Upsert エンドポイントを追加。既存レイヤードアーキテクチャに routes/services/data/transform/types の各ファイルを新設し、`index.ts` にルートをマウントする。

### Goals
- project_load テーブルに対する CRUD + バルク Upsert API の提供
- ファクトテーブル特有の動作（物理削除、ページネーションなし）の実現
- 既存の CRUD 実装パターンとの一貫性維持
- year_month ユニーク制約に基づく重複チェック

### Non-Goals
- project_cases テーブルの CRUD（別スペックで実装済み）
- フロントエンド実装
- 認証・認可の実装
- 標準工数パターンからの自動計算ロジック

## Architecture

### Existing Architecture Analysis

既存バックエンドのレイヤードアーキテクチャをそのまま踏襲する:

- **routes/**: Hono ルート定義 + Zod バリデーション
- **services/**: ビジネスロジック + HTTPException によるエラーハンドリング
- **data/**: mssql による直接 SQL 実行
- **transform/**: DB 行（snake_case）→ API レスポンス（camelCase）変換
- **types/**: Zod スキーマ + TypeScript 型定義
- **utils/**: validate ヘルパー、errorHelper（RFC 9457 対応）

**ファクトテーブルとの差異**:
- 論理削除なし → softDelete/restore エンドポイント不要
- ページネーションなし → 全件返却
- バルク Upsert → 新規エンドポイント追加
- 親テーブル（project_cases）の deleted_at チェックが必要

### Architecture Pattern & Boundary Map

```mermaid
graph TB
    subgraph Routes
        PL_Route[projectLoads Route]
    end

    subgraph Services
        PL_Service[projectLoadService]
    end

    subgraph Data
        PL_Data[projectLoadData]
    end

    subgraph Transform
        PL_Transform[projectLoadTransform]
    end

    subgraph Types
        PL_Types[projectLoad types and schemas]
    end

    subgraph ExistingDB[SQL Server]
        T_PL[project_load]
        T_PC[project_cases]
    end

    PL_Route -->|delegates| PL_Service
    PL_Service -->|queries| PL_Data
    PL_Service -->|converts| PL_Transform
    PL_Route -->|validates| PL_Types
    PL_Data -->|CRUD| T_PL
    PL_Data -->|existence check| T_PC
```

**Architecture Integration**:
- Selected pattern: 既存レイヤードアーキテクチャの踏襲
- Domain boundaries: project_load は project_cases のファクトデータ（子リソース）
- Existing patterns preserved: validate → service → data → transform の呼び出しフロー
- New components rationale: 各レイヤーに1ファイルずつ追加（既存パターンと同一構成）
- Steering compliance: routes → services → data の依存方向を遵守

### Technology Stack

| Layer | Choice / Version | Role in Feature | Notes |
|-------|------------------|-----------------|-------|
| Backend | Hono v4 | ルート定義・リクエスト処理 | 既存と同一 |
| Validation | Zod + validate ヘルパー | リクエストバリデーション | 既存パターン利用 |
| Data | mssql | SQL Server 接続・クエリ実行・MERGE 文 | バルク Upsert で MERGE 文を使用 |
| Testing | Vitest | ユニットテスト | app.request() パターン |

## System Flows

### バルク Upsert フロー

```mermaid
sequenceDiagram
    participant Client
    participant Route as projectLoads Route
    participant Service as projectLoadService
    participant Data as projectLoadData
    participant DB as SQL Server

    Client->>Route: PUT /project-cases/:id/project-loads/bulk
    Route->>Route: Zod validate request body
    Route->>Service: bulkUpsert(projectCaseId, items)
    Service->>Data: projectCaseExists(projectCaseId)
    Data->>DB: SELECT from project_cases
    DB-->>Data: result
    alt case not found or deleted
        Data-->>Service: false
        Service-->>Route: HTTPException 404
    else case exists
        Data-->>Service: true
        Service->>Data: bulkUpsert(projectCaseId, items)
        Data->>DB: BEGIN TRANSACTION
        loop for each item
            Data->>DB: MERGE project_load
        end
        Data->>DB: COMMIT
        Data->>DB: SELECT all for projectCaseId
        DB-->>Data: rows
        Data-->>Service: ProjectLoadRow[]
        Service->>Service: transform rows
        Service-->>Route: ProjectLoad[]
        Route-->>Client: 200 OK with data
    end
```

## Requirements Traceability

| Requirement | Summary | Components | Interfaces | Flows |
|-------------|---------|------------|------------|-------|
| 1.1 | 一覧取得 | projectLoads Route, projectLoadService, projectLoadData | API GET / | - |
| 1.2 | data 配列形式 | projectLoads Route | API GET / | - |
| 1.3 | year_month 昇順ソート | projectLoadData | Service findAll | - |
| 1.4 | 親ケース不存在 404 | projectLoadService | Service findAll | - |
| 2.1 | 単一取得 | projectLoads Route, projectLoadService, projectLoadData | API GET /:id | - |
| 2.2 | 単一 404 | projectLoadService | Service findById | - |
| 2.3 | projectCaseId 不一致 404 | projectLoadService | Service findById | - |
| 3.1 | 新規作成 201 | projectLoads Route, projectLoadService, projectLoadData | API POST / | - |
| 3.2 | Location ヘッダ | projectLoads Route | API POST / | - |
| 3.3 | Zod バリデーション | projectLoad types | - | - |
| 3.4 | バリデーション 422 | projectLoads Route (validate) | - | - |
| 3.5 | 親ケース不存在 404 | projectLoadService | Service create | - |
| 3.6 | yearMonth 重複 409 | projectLoadService, projectLoadData | Service create | - |
| 4.1 | 更新 200 | projectLoads Route, projectLoadService, projectLoadData | API PUT /:id | - |
| 4.2 | 更新バリデーション | projectLoad types | - | - |
| 4.3 | 更新 404 | projectLoadService | Service update | - |
| 4.4 | 更新バリデーション 422 | projectLoads Route (validate) | - | - |
| 4.5 | updated_at 更新 | projectLoadData | - | - |
| 4.6 | yearMonth 重複 409 | projectLoadService, projectLoadData | Service update | - |
| 5.1 | 物理削除 204 | projectLoads Route, projectLoadService, projectLoadData | API DELETE /:id | - |
| 5.2 | 削除 404 | projectLoadService | Service delete | - |
| 5.3 | projectCaseId 不一致 404 | projectLoadService | Service delete | - |
| 6.1 | バルク Upsert 200 | projectLoads Route, projectLoadService, projectLoadData | API PUT /bulk | バルク Upsert フロー |
| 6.2 | items 配列形式 | projectLoad types | - | - |
| 6.3 | 各アイテムバリデーション | projectLoad types | - | - |
| 6.4 | 既存更新/新規作成 | projectLoadData | Service bulkUpsert | バルク Upsert フロー |
| 6.5 | バリデーション失敗時全件不変 | projectLoads Route (validate) | - | - |
| 6.6 | 親ケース不存在 404 | projectLoadService | Service bulkUpsert | バルク Upsert フロー |
| 6.7 | yearMonth 配列内重複 422 | projectLoadService | Service bulkUpsert | - |
| 6.8 | トランザクション制御 | projectLoadData | - | バルク Upsert フロー |
| 7.1 | data 形式レスポンス | projectLoads Route | API Contract 全般 | - |
| 7.2 | RFC 9457 エラー | 全コンポーネント（既存 errorHelper） | - | - |
| 7.3 | camelCase レスポンス | projectLoadTransform | - | - |
| 7.4 | ISO 8601 日時 | projectLoadTransform | - | - |
| 7.5 | manhour 数値型 | projectLoadTransform | - | - |
| 8.1 | パスパラメータバリデーション | projectLoads Route | - | - |
| 8.2 | パスパラメータ 422 | projectLoads Route | - | - |
| 8.3 | YYYYMM バリデーション | projectLoad types | - | - |
| 8.4 | manhour 範囲バリデーション | projectLoad types | - | - |
| 9.1-9.4 | テスト | projectLoads.test.ts | - | - |

## Components and Interfaces

| Component | Domain/Layer | Intent | Req Coverage | Key Dependencies | Contracts |
|-----------|--------------|--------|--------------|-----------------|-----------|
| projectLoad types | Types | Zod スキーマ・型定義 | 3.3, 4.2, 6.2-6.3, 8.1-8.4 | - | Service |
| projectLoadData | Data | SQL クエリ実行・MERGE | 1.1-1.4, 2.1-2.3, 3.1, 3.5-3.6, 4.1, 4.3, 4.5-4.6, 5.1-5.3, 6.1, 6.4, 6.6, 6.8 | mssql (P0), getPool (P0) | Service |
| projectLoadTransform | Transform | DB行→APIレスポンス変換 | 7.3-7.5 | projectLoad types (P0) | - |
| projectLoadService | Services | ビジネスロジック・エラー | 1.4, 2.2-2.3, 3.5-3.6, 4.3, 4.6, 5.2-5.3, 6.6-6.7 | projectLoadData (P0), projectLoadTransform (P0) | Service |
| projectLoads Route | Routes | エンドポイント定義 | 1.1-1.2, 2.1, 3.1-3.2, 3.4, 4.1, 4.4, 5.1, 6.1, 6.5, 7.1-7.2, 8.1-8.2 | projectLoadService (P0), validate (P0) | API |

### Types Layer

#### projectLoad types

| Field | Detail |
|-------|--------|
| Intent | project_load の Zod バリデーションスキーマと TypeScript 型を定義する |
| Requirements | 3.3, 4.2, 6.2-6.3, 8.1-8.4 |

**Responsibilities & Constraints**
- 作成・更新リクエストのバリデーションスキーマ定義
- バルク Upsert リクエストのスキーマ定義（items 配列）
- DB 行型（snake_case）と API レスポンス型（camelCase）の定義
- `any` 型禁止、すべて Zod の `z.infer` で導出

**Dependencies**
- Inbound: routes — バリデーション (P0)

**Contracts**: Service [x]

##### Service Interface

```typescript
// Zod スキーマ
const yearMonthSchema: z.ZodString
// regex(/^\d{6}$/) + refine で月の範囲 01-12 チェック

const createProjectLoadSchema: z.ZodObject<{
  yearMonth: z.ZodString        // 必須・YYYYMM形式
  manhour: z.ZodNumber           // 必須・min(0).max(99999999.99)
}>

const updateProjectLoadSchema: z.ZodObject<{
  yearMonth: z.ZodOptional<z.ZodString>   // 任意・YYYYMM形式
  manhour: z.ZodOptional<z.ZodNumber>      // 任意・min(0).max(99999999.99)
}>

const bulkUpsertItemSchema: z.ZodObject<{
  yearMonth: z.ZodString        // 必須・YYYYMM形式
  manhour: z.ZodNumber           // 必須・min(0).max(99999999.99)
}>

const bulkUpsertProjectLoadSchema: z.ZodObject<{
  items: z.ZodArray<typeof bulkUpsertItemSchema>  // min(1)
}>

// TypeScript 型
type CreateProjectLoad = z.infer<typeof createProjectLoadSchema>
type UpdateProjectLoad = z.infer<typeof updateProjectLoadSchema>
type BulkUpsertProjectLoad = z.infer<typeof bulkUpsertProjectLoadSchema>

type ProjectLoadRow = {
  project_load_id: number
  project_case_id: number
  year_month: string
  manhour: number         // DECIMAL(10,2) → number
  created_at: Date
  updated_at: Date
}

type ProjectLoad = {
  projectLoadId: number
  projectCaseId: number
  yearMonth: string
  manhour: number
  createdAt: string       // ISO 8601
  updatedAt: string       // ISO 8601
}
```

- Preconditions: なし
- Postconditions: すべてのスキーマが TypeScript 型と整合
- Invariants: DB 行型は snake_case、API レスポンス型は camelCase

### Data Layer

#### projectLoadData

| Field | Detail |
|-------|--------|
| Intent | project_load テーブルへの SQL クエリ実行（CRUD + MERGE によるバルク Upsert） |
| Requirements | 1.1-1.4, 2.1-2.3, 3.1, 3.5-3.6, 4.1, 4.3, 4.5-4.6, 5.1-5.3, 6.1, 6.4, 6.6, 6.8 |

**Responsibilities & Constraints**
- SQL Server へのクエリ実行のみ担当（ビジネスロジックを含めない）
- project_cases テーブルの存在確認 + deleted_at チェック
- year_month ユニーク制約に基づく重複チェック
- バルク Upsert はトランザクション内で MERGE 文をループ実行
- 物理削除（DELETE 文）

**Dependencies**
- Inbound: projectLoadService — 全メソッド呼び出し (P0)
- Outbound: `@/database/client` — getPool (P0)
- External: mssql — SQL Server 接続 (P0)

**Contracts**: Service [x]

##### Service Interface

```typescript
interface ProjectLoadDataInterface {
  findAll(projectCaseId: number): Promise<ProjectLoadRow[]>
  // ORDER BY year_month ASC

  findById(projectLoadId: number): Promise<ProjectLoadRow | undefined>

  create(data: {
    projectCaseId: number
    yearMonth: string
    manhour: number
  }): Promise<ProjectLoadRow>

  update(
    projectLoadId: number,
    data: Partial<{
      yearMonth: string
      manhour: number
    }>
  ): Promise<ProjectLoadRow | undefined>

  deleteById(projectLoadId: number): Promise<boolean>
  // 物理削除。削除成功 true、レコード不存在 false

  bulkUpsert(
    projectCaseId: number,
    items: Array<{ yearMonth: string; manhour: number }>
  ): Promise<ProjectLoadRow[]>
  // トランザクション内で MERGE 文をループ実行
  // 完了後、projectCaseId の全レコードを year_month ASC で返却

  projectCaseExists(projectCaseId: number): Promise<boolean>
  // project_cases テーブルで deleted_at IS NULL のレコードの存在確認

  yearMonthExists(projectCaseId: number, yearMonth: string, excludeId?: number): Promise<boolean>
  // ユニーク制約チェック（更新時は自身を除外）
}
```

- Preconditions: DB 接続プールが利用可能
- Postconditions: 各メソッドは ProjectLoadRow またはプリミティブ値を返却
- Invariants: findAll は year_month ASC でソート。bulkUpsert はトランザクション内で全操作を実行し、失敗時はロールバック

**Implementation Notes**
- findAll の SELECT: `SELECT * FROM project_load WHERE project_case_id = @projectCaseId ORDER BY year_month ASC`
- create は OUTPUT 句で IDENTITY 値を取得後、findById で行を返却
- bulkUpsert の MERGE 文: `MERGE project_load AS target USING (SELECT @projectCaseId, @yearMonth) AS source(project_case_id, year_month) ON target.project_case_id = source.project_case_id AND target.year_month = source.year_month WHEN MATCHED THEN UPDATE SET manhour = @manhour, updated_at = GETDATE() WHEN NOT MATCHED THEN INSERT (...) VALUES (...)`
- deleteById は `DELETE FROM project_load WHERE project_load_id = @projectLoadId` で rowsAffected > 0 を返却

### Transform Layer

#### projectLoadTransform

| Field | Detail |
|-------|--------|
| Intent | ProjectLoadRow（snake_case）から ProjectLoad（camelCase）への変換 |
| Requirements | 7.3-7.5 |

**Responsibilities & Constraints**
- snake_case → camelCase のフィールド名変換
- Date → ISO 8601 文字列変換
- manhour は number 型のまま返却（DECIMAL → number は mssql ライブラリが自動変換）

**Dependencies**
- Inbound: projectLoadService — 変換処理 (P0)
- Outbound: projectLoad types — ProjectLoadRow, ProjectLoad (P0)

**Contracts**: Service [x]

##### Service Interface

```typescript
function toProjectLoadResponse(row: ProjectLoadRow): ProjectLoad
```

- Preconditions: row が null でないこと
- Postconditions: camelCase の ProjectLoad オブジェクトを返却
- Invariants: created_at/updated_at は ISO 8601 文字列に変換

### Service Layer

#### projectLoadService

| Field | Detail |
|-------|--------|
| Intent | 案件負荷データのビジネスロジック・エラーハンドリングを集約する |
| Requirements | 1.4, 2.2-2.3, 3.5-3.6, 4.3, 4.6, 5.2-5.3, 6.6-6.7 |

**Responsibilities & Constraints**
- 親リソース（project_cases）の存在確認（deleted_at IS NULL）
- year_month ユニーク制約に基づく重複チェック（create/update 時）
- バルク Upsert 時の配列内 yearMonth 重複チェック
- projectCaseId の親子整合性チェック（単一取得/更新/削除時）
- HTTPException による統一的なエラー送出

**Dependencies**
- Inbound: projectLoads Route — 全エンドポイント (P0)
- Outbound: projectLoadData — DB アクセス (P0)
- Outbound: projectLoadTransform — レスポンス変換 (P0)

**Contracts**: Service [x]

##### Service Interface

```typescript
interface ProjectLoadServiceInterface {
  findAll(projectCaseId: number): Promise<ProjectLoad[]>
  // Throws: HTTPException(404) if projectCase not found or deleted (1.4)

  findById(projectCaseId: number, projectLoadId: number): Promise<ProjectLoad>
  // Throws: HTTPException(404) if not found or projectCaseId mismatch (2.2, 2.3)

  create(projectCaseId: number, data: CreateProjectLoad): Promise<ProjectLoad>
  // Throws: HTTPException(404) if projectCase not found or deleted (3.5)
  // Throws: HTTPException(409) if yearMonth already exists (3.6)

  update(projectCaseId: number, projectLoadId: number, data: UpdateProjectLoad): Promise<ProjectLoad>
  // Throws: HTTPException(404) if not found or projectCaseId mismatch (4.3)
  // Throws: HTTPException(409) if yearMonth conflict (4.6)

  delete(projectCaseId: number, projectLoadId: number): Promise<void>
  // Throws: HTTPException(404) if not found or projectCaseId mismatch (5.2, 5.3)

  bulkUpsert(projectCaseId: number, data: BulkUpsertProjectLoad): Promise<ProjectLoad[]>
  // Throws: HTTPException(404) if projectCase not found or deleted (6.6)
  // Throws: HTTPException(422) if yearMonth duplicates in items array (6.7)
}
```

- Preconditions: 各メソッドの引数が型スキーマに適合
- Postconditions: 正常時は ProjectLoad を返却、異常時は HTTPException を送出
- Invariants: projectCaseId の親子整合性は全操作で検証

**Implementation Notes**
- findById/update/delete 時: data 層で取得した行の `project_case_id` と URL の `projectCaseId` を比較し、不一致なら 404
- bulkUpsert: 配列内の yearMonth を Set で重複チェック → data 層の bulkUpsert を呼び出し → 結果を transform

### Route Layer

#### projectLoads Route

| Field | Detail |
|-------|--------|
| Intent | `/project-cases/:projectCaseId/project-loads` 配下の HTTP エンドポイントを定義する |
| Requirements | 1.1-1.2, 2.1, 3.1-3.2, 3.4, 4.1, 4.4, 5.1, 6.1, 6.5, 7.1-7.2, 8.1-8.2 |

**Responsibilities & Constraints**
- Zod バリデーション（json）の適用
- パスパラメータ（projectCaseId, projectLoadId）の parseInt 変換とバリデーション
- サービス層への委譲
- HTTP ステータスコードとレスポンス形式の制御
- Location ヘッダの設定（POST 201 時）
- `/bulk` エンドポイントを `:projectLoadId` の前に定義してルーティング衝突を回避

**Dependencies**
- Inbound: index.ts — app.route() でマウント (P0)
- Outbound: projectLoadService — ビジネスロジック (P0)
- Outbound: validate — Zod バリデーション (P0)
- Outbound: projectLoad types — スキーマ (P0)

**Contracts**: API [x]

##### API Contract

| Method | Endpoint | Request | Response | Errors |
|--------|----------|---------|----------|--------|
| GET | / | - | `{ data: ProjectLoad[] }` 200 | 404, 422 |
| GET | /:projectLoadId | param: projectLoadId (int) | `{ data: ProjectLoad }` 200 | 404, 422 |
| POST | / | json: createProjectLoadSchema | `{ data: ProjectLoad }` 201 + Location | 404, 409, 422 |
| PUT | /bulk | json: bulkUpsertProjectLoadSchema | `{ data: ProjectLoad[] }` 200 | 404, 422 |
| PUT | /:projectLoadId | json: updateProjectLoadSchema | `{ data: ProjectLoad }` 200 | 404, 409, 422 |
| DELETE | /:projectLoadId | - | 204 No Content | 404 |

**Implementation Notes**
- index.ts に `app.route('/project-cases/:projectCaseId/project-loads', projectLoads)` でマウント
- projectCaseId は各ハンドラで `c.req.param('projectCaseId')` → `parseInt` で取得。NaN の場合は HTTPException(422)
- `PUT /bulk` は `PUT /:projectLoadId` より前に定義してルーティング衝突を回避
- GET 一覧はページネーション不要のため query バリデーションなし

## Data Models

### Domain Model

```mermaid
erDiagram
    project_cases ||--o{ project_load : has
    project_load {
        int project_load_id PK
        int project_case_id FK
        char year_month
        decimal manhour
        datetime2 created_at
        datetime2 updated_at
    }
```

- **Aggregate**: project_load は project_cases の子ファクトデータ
- **Business Rules**:
  - 同一 project_case_id 内で year_month は一意
  - 物理削除（deleted_at なし）
  - 親テーブル削除時は ON DELETE CASCADE で自動削除

### Physical Data Model

project_load テーブルの既存定義（`docs/database/table-spec.md` 参照）をそのまま利用する。スキーマ変更は不要。

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| project_load_id | INT IDENTITY(1,1) | NO | 主キー |
| project_case_id | INT | NO | FK → project_cases(ON DELETE CASCADE) |
| year_month | CHAR(6) | NO | 年月 YYYYMM |
| manhour | DECIMAL(10,2) | NO | 工数（人時） |
| created_at | DATETIME2 | NO | 作成日時 |
| updated_at | DATETIME2 | NO | 更新日時 |

**ユニークインデックス**: UQ_project_load_case_ym (project_case_id, year_month)

### Data Contracts & Integration

**API Data Transfer**

リクエスト: camelCase（Zod スキーマで定義）
レスポンス: camelCase（projectLoadTransform で変換）
シリアライゼーション: JSON

## Error Handling

### Error Strategy

既存のグローバルエラーハンドラ（`index.ts` の `app.onError`）と validate ヘルパー（`utils/validate.ts`）を利用する。新規のエラーハンドリングコードは不要。

### Error Categories and Responses

| Category | Status | Trigger | Detail |
|----------|--------|---------|--------|
| バリデーション | 422 | Zod スキーマ不適合、パスパラメータ不正、バルク配列内 yearMonth 重複 | RFC 9457 + errors 配列 |
| リソース不存在 | 404 | projectCaseId 不存在/論理削除済み、projectLoadId 不存在、projectCaseId 不一致 | RFC 9457 |
| 競合 | 409 | year_month ユニーク制約違反（create/update 時） | RFC 9457 |
| 内部エラー | 500 | 予期しない例外 | RFC 9457（グローバルハンドラ） |

## Testing Strategy

### Unit Tests

テストファイル: `src/__tests__/routes/projectLoads.test.ts`

パターン: Vitest + `app.request()` を使用した HTTP レベルテスト。service 層をモック。

| テスト区分 | テスト内容 |
|-----------|-----------|
| GET / 正常系 | 一覧取得、year_month 昇順ソート、data 配列形式 |
| GET /:id 正常系 | 単一取得、data オブジェクト形式 |
| POST / 正常系 | 作成、201 + Location ヘッダ、レスポンスボディ |
| PUT /:id 正常系 | 更新、200 + 更新されたフィールド確認 |
| DELETE /:id 正常系 | 物理削除、204 No Content |
| PUT /bulk 正常系 | バルク Upsert、200 + data 配列形式 |
| GET / 異常系 | 不存在/削除済み projectCaseId → 404 |
| GET /:id 異常系 | 不存在 → 404、projectCaseId 不一致 → 404 |
| POST / 異常系 | バリデーション → 422、親ケース不存在 → 404、yearMonth 重複 → 409 |
| PUT /:id 異常系 | 不存在 → 404、バリデーション → 422、yearMonth 重複 → 409 |
| DELETE /:id 異常系 | 不存在 → 404 |
| PUT /bulk 異常系 | バリデーション → 422、親ケース不存在 → 404、配列内 yearMonth 重複 → 422 |

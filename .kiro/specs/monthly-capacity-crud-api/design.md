# Technical Design: monthly-capacity-crud-api

## Overview

**Purpose**: キャパシティシナリオ（capacity_scenarios）に紐づく月次キャパシティデータ（monthly_capacity）の CRUD API を提供し、事業部ごとのキャパシティ計画の入力・管理を可能にする。

**Users**: 事業部リーダーが月次キャパシティの入力・修正・一括更新に利用する。フロントエンドの積み上げチャートにおける供給キャパシティラインの基盤データとなる。

**Impact**: バックエンドに monthly_capacity ファクトテーブル用の CRUD + バルク Upsert エンドポイントを追加。既存レイヤードアーキテクチャに routes/services/data/transform/types の各ファイルを新設し、`index.ts` にルートをマウントする。

### Goals
- monthly_capacity テーブルに対する CRUD + バルク Upsert API の提供
- ファクトテーブル特有の動作（物理削除、ページネーションなし）の実現
- 既存の CRUD 実装パターン（project_load 等）との一貫性維持
- 3キー ユニーク制約 (capacity_scenario_id, business_unit_code, year_month) に基づく重複チェック
- business_unit_code の外部キー検証

### Non-Goals
- capacity_scenarios テーブルの CRUD（別スペックで実装済み）
- business_units テーブルの CRUD（別スペックで実装済み）
- フロントエンド実装
- 認証・認可の実装

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
- 親テーブル（capacity_scenarios）の deleted_at チェックが必要
- business_unit_code の外部キー検証が追加で必要（project_load にはない要件）

### Architecture Pattern & Boundary Map

```mermaid
graph TB
    subgraph Routes
        MC_Route[monthlyCapacities Route]
    end

    subgraph Services
        MC_Service[monthlyCapacityService]
    end

    subgraph Data
        MC_Data[monthlyCapacityData]
    end

    subgraph Transform
        MC_Transform[monthlyCapacityTransform]
    end

    subgraph Types
        MC_Types[monthlyCapacity types and schemas]
    end

    subgraph ExistingDB[SQL Server]
        T_MC[monthly_capacity]
        T_CS[capacity_scenarios]
        T_BU[business_units]
    end

    MC_Route -->|delegates| MC_Service
    MC_Service -->|queries| MC_Data
    MC_Service -->|converts| MC_Transform
    MC_Route -->|validates| MC_Types
    MC_Data -->|CRUD| T_MC
    MC_Data -->|existence check| T_CS
    MC_Data -->|existence check| T_BU
```

**Architecture Integration**:
- Selected pattern: 既存レイヤードアーキテクチャの踏襲
- Domain boundaries: monthly_capacity は capacity_scenarios のファクトデータ（子リソース）、business_units を外部キーとして参照
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
    participant Route as monthlyCapacities Route
    participant Service as monthlyCapacityService
    participant Data as monthlyCapacityData
    participant DB as SQL Server

    Client->>Route: PUT /capacity-scenarios/:id/monthly-capacities/bulk
    Route->>Route: Zod validate request body
    Route->>Service: bulkUpsert(capacityScenarioId, items)
    Service->>Data: capacityScenarioExists(capacityScenarioId)
    Data->>DB: SELECT from capacity_scenarios
    DB-->>Data: result
    alt scenario not found or deleted
        Data-->>Service: false
        Service-->>Route: HTTPException 404
    else scenario exists
        Data-->>Service: true
        Service->>Service: check duplicate businessUnitCode plus yearMonth in items
        alt duplicates found
            Service-->>Route: HTTPException 422
        else no duplicates
            Service->>Data: businessUnitsExist(codes)
            Data->>DB: SELECT from business_units WHERE code IN
            DB-->>Data: result
            alt any business unit not found
                Data-->>Service: false
                Service-->>Route: HTTPException 422
            else all exist
                Service->>Data: bulkUpsert(capacityScenarioId, items)
                Data->>DB: BEGIN TRANSACTION
                loop for each item
                    Data->>DB: MERGE monthly_capacity
                end
                Data->>DB: COMMIT
                Data->>DB: SELECT all for capacityScenarioId
                DB-->>Data: rows
                Data-->>Service: MonthlyCapacityRow[]
                Service->>Service: transform rows
                Service-->>Route: MonthlyCapacity[]
                Route-->>Client: 200 OK with data
            end
        end
    end
```

## Requirements Traceability

| Requirement | Summary | Components | Interfaces | Flows |
|-------------|---------|------------|------------|-------|
| 1.1 | 一覧取得 | monthlyCapacities Route, monthlyCapacityService, monthlyCapacityData | API GET / | - |
| 1.2 | data 配列形式 | monthlyCapacities Route | API GET / | - |
| 1.3 | business_unit_code, year_month 昇順ソート | monthlyCapacityData | Service findAll | - |
| 1.4 | 親シナリオ不存在 404 | monthlyCapacityService | Service findAll | - |
| 2.1 | 単一取得 | monthlyCapacities Route, monthlyCapacityService, monthlyCapacityData | API GET /:id | - |
| 2.2 | 単一 404 | monthlyCapacityService | Service findById | - |
| 2.3 | capacityScenarioId 不一致 404 | monthlyCapacityService | Service findById | - |
| 3.1 | 新規作成 201 | monthlyCapacities Route, monthlyCapacityService, monthlyCapacityData | API POST / | - |
| 3.2 | Location ヘッダ | monthlyCapacities Route | API POST / | - |
| 3.3 | Zod バリデーション | monthlyCapacity types | - | - |
| 3.4 | バリデーション 422 | monthlyCapacities Route (validate) | - | - |
| 3.5 | 親シナリオ不存在 404 | monthlyCapacityService | Service create | - |
| 3.6 | businessUnitCode 不存在 422 | monthlyCapacityService, monthlyCapacityData | Service create | - |
| 3.7 | ユニーク制約重複 409 | monthlyCapacityService, monthlyCapacityData | Service create | - |
| 4.1 | 更新 200 | monthlyCapacities Route, monthlyCapacityService, monthlyCapacityData | API PUT /:id | - |
| 4.2 | 更新バリデーション | monthlyCapacity types | - | - |
| 4.3 | 更新 404 | monthlyCapacityService | Service update | - |
| 4.4 | 更新バリデーション 422 | monthlyCapacities Route (validate) | - | - |
| 4.5 | updated_at 更新 | monthlyCapacityData | - | - |
| 4.6 | ユニーク制約重複 409 | monthlyCapacityService, monthlyCapacityData | Service update | - |
| 4.7 | businessUnitCode 不存在 422 | monthlyCapacityService, monthlyCapacityData | Service update | - |
| 5.1 | 物理削除 204 | monthlyCapacities Route, monthlyCapacityService, monthlyCapacityData | API DELETE /:id | - |
| 5.2 | 削除 404 | monthlyCapacityService | Service delete | - |
| 5.3 | capacityScenarioId 不一致 404 | monthlyCapacityService | Service delete | - |
| 6.1 | バルク Upsert 200 | monthlyCapacities Route, monthlyCapacityService, monthlyCapacityData | API PUT /bulk | バルク Upsert フロー |
| 6.2 | items 配列形式 | monthlyCapacity types | - | - |
| 6.3 | 各アイテムバリデーション | monthlyCapacity types | - | - |
| 6.4 | 既存更新/新規作成 | monthlyCapacityData | Service bulkUpsert | バルク Upsert フロー |
| 6.5 | バリデーション失敗時全件不変 | monthlyCapacities Route (validate) | - | - |
| 6.6 | 親シナリオ不存在 404 | monthlyCapacityService | Service bulkUpsert | バルク Upsert フロー |
| 6.7 | 配列内 businessUnitCode+yearMonth 重複 422 | monthlyCapacityService | Service bulkUpsert | - |
| 6.8 | トランザクション制御 | monthlyCapacityData | - | バルク Upsert フロー |
| 6.9 | businessUnitCode 不存在 422 | monthlyCapacityService, monthlyCapacityData | Service bulkUpsert | バルク Upsert フロー |
| 7.1 | data 形式レスポンス | monthlyCapacities Route | API Contract 全般 | - |
| 7.2 | RFC 9457 エラー | 全コンポーネント（既存 errorHelper） | - | - |
| 7.3 | camelCase レスポンス | monthlyCapacityTransform | - | - |
| 7.4 | ISO 8601 日時 | monthlyCapacityTransform | - | - |
| 7.5 | capacity 数値型 | monthlyCapacityTransform | - | - |
| 8.1 | パスパラメータバリデーション | monthlyCapacities Route | - | - |
| 8.2 | パスパラメータ 422 | monthlyCapacities Route | - | - |
| 8.3 | YYYYMM バリデーション | monthlyCapacity types | - | - |
| 8.4 | capacity 範囲バリデーション | monthlyCapacity types | - | - |
| 8.5 | businessUnitCode バリデーション | monthlyCapacity types | - | - |
| 9.1-9.4 | テスト | monthlyCapacities.test.ts | - | - |

## Components and Interfaces

| Component | Domain/Layer | Intent | Req Coverage | Key Dependencies | Contracts |
|-----------|--------------|--------|--------------|-----------------|-----------|
| monthlyCapacity types | Types | Zod スキーマ・型定義 | 3.3, 4.2, 6.2-6.3, 8.1-8.5 | - | Service |
| monthlyCapacityData | Data | SQL クエリ実行・MERGE | 1.1-1.4, 2.1-2.3, 3.1, 3.5-3.7, 4.1, 4.3, 4.5-4.7, 5.1-5.3, 6.1, 6.4, 6.6, 6.8-6.9 | mssql (P0), getPool (P0) | Service |
| monthlyCapacityTransform | Transform | DB行→APIレスポンス変換 | 7.3-7.5 | monthlyCapacity types (P0) | - |
| monthlyCapacityService | Services | ビジネスロジック・エラー | 1.4, 2.2-2.3, 3.5-3.7, 4.3, 4.6-4.7, 5.2-5.3, 6.6-6.7, 6.9 | monthlyCapacityData (P0), monthlyCapacityTransform (P0) | Service |
| monthlyCapacities Route | Routes | エンドポイント定義 | 1.1-1.2, 2.1, 3.1-3.2, 3.4, 4.1, 4.4, 5.1, 6.1, 6.5, 7.1-7.2, 8.1-8.2 | monthlyCapacityService (P0), validate (P0) | API |

### Types Layer

#### monthlyCapacity types

| Field | Detail |
|-------|--------|
| Intent | monthly_capacity の Zod バリデーションスキーマと TypeScript 型を定義する |
| Requirements | 3.3, 4.2, 6.2-6.3, 8.1-8.5 |

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

const businessUnitCodeSchema: z.ZodString
// min(1).max(20)

const createMonthlyCapacitySchema: z.ZodObject<{
  businessUnitCode: z.ZodString   // 必須・1-20文字
  yearMonth: z.ZodString          // 必須・YYYYMM形式
  capacity: z.ZodNumber           // 必須・min(0).max(99999999.99)
}>

const updateMonthlyCapacitySchema: z.ZodObject<{
  businessUnitCode: z.ZodOptional<z.ZodString>   // 任意・1-20文字
  yearMonth: z.ZodOptional<z.ZodString>          // 任意・YYYYMM形式
  capacity: z.ZodOptional<z.ZodNumber>           // 任意・min(0).max(99999999.99)
}>

const bulkUpsertItemSchema: z.ZodObject<{
  businessUnitCode: z.ZodString   // 必須・1-20文字
  yearMonth: z.ZodString          // 必須・YYYYMM形式
  capacity: z.ZodNumber           // 必須・min(0).max(99999999.99)
}>

const bulkUpsertMonthlyCapacitySchema: z.ZodObject<{
  items: z.ZodArray<typeof bulkUpsertItemSchema>  // min(1)
}>

// TypeScript 型
type CreateMonthlyCapacity = z.infer<typeof createMonthlyCapacitySchema>
type UpdateMonthlyCapacity = z.infer<typeof updateMonthlyCapacitySchema>
type BulkUpsertMonthlyCapacity = z.infer<typeof bulkUpsertMonthlyCapacitySchema>

type MonthlyCapacityRow = {
  monthly_capacity_id: number
  capacity_scenario_id: number
  business_unit_code: string
  year_month: string
  capacity: number            // DECIMAL(10,2) → number
  created_at: Date
  updated_at: Date
}

type MonthlyCapacity = {
  monthlyCapacityId: number
  capacityScenarioId: number
  businessUnitCode: string
  yearMonth: string
  capacity: number
  createdAt: string           // ISO 8601
  updatedAt: string           // ISO 8601
}
```

- Preconditions: なし
- Postconditions: すべてのスキーマが TypeScript 型と整合
- Invariants: DB 行型は snake_case、API レスポンス型は camelCase

### Data Layer

#### monthlyCapacityData

| Field | Detail |
|-------|--------|
| Intent | monthly_capacity テーブルへの SQL クエリ実行（CRUD + MERGE によるバルク Upsert） |
| Requirements | 1.1-1.4, 2.1-2.3, 3.1, 3.5-3.7, 4.1, 4.3, 4.5-4.7, 5.1-5.3, 6.1, 6.4, 6.6, 6.8-6.9 |

**Responsibilities & Constraints**
- SQL Server へのクエリ実行のみ担当（ビジネスロジックを含めない）
- capacity_scenarios テーブルの存在確認 + deleted_at チェック
- business_units テーブルの存在確認 + deleted_at チェック
- 3キー ユニーク制約 (capacity_scenario_id, business_unit_code, year_month) に基づく重複チェック
- バルク Upsert はトランザクション内で MERGE 文をループ実行
- 物理削除（DELETE 文）

**Dependencies**
- Inbound: monthlyCapacityService — 全メソッド呼び出し (P0)
- Outbound: `@/database/client` — getPool (P0)
- External: mssql — SQL Server 接続 (P0)

**Contracts**: Service [x]

##### Service Interface

```typescript
interface MonthlyCapacityDataInterface {
  findAll(capacityScenarioId: number): Promise<MonthlyCapacityRow[]>
  // ORDER BY business_unit_code ASC, year_month ASC

  findById(monthlyCapacityId: number): Promise<MonthlyCapacityRow | undefined>

  create(data: {
    capacityScenarioId: number
    businessUnitCode: string
    yearMonth: string
    capacity: number
  }): Promise<MonthlyCapacityRow>

  update(
    monthlyCapacityId: number,
    data: Partial<{
      businessUnitCode: string
      yearMonth: string
      capacity: number
    }>
  ): Promise<MonthlyCapacityRow | undefined>

  deleteById(monthlyCapacityId: number): Promise<boolean>
  // 物理削除。削除成功 true、レコード不存在 false

  bulkUpsert(
    capacityScenarioId: number,
    items: Array<{ businessUnitCode: string; yearMonth: string; capacity: number }>
  ): Promise<MonthlyCapacityRow[]>
  // トランザクション内で MERGE 文をループ実行
  // 完了後、capacityScenarioId の全レコードを business_unit_code ASC, year_month ASC で返却

  capacityScenarioExists(capacityScenarioId: number): Promise<boolean>
  // capacity_scenarios テーブルで deleted_at IS NULL のレコードの存在確認

  businessUnitExists(businessUnitCode: string): Promise<boolean>
  // business_units テーブルで deleted_at IS NULL のレコードの存在確認

  businessUnitsExist(businessUnitCodes: string[]): Promise<boolean>
  // 複数の business_unit_code を一括チェック（IN 句）。全て存在すれば true

  uniqueKeyExists(
    capacityScenarioId: number,
    businessUnitCode: string,
    yearMonth: string,
    excludeId?: number
  ): Promise<boolean>
  // 3キー ユニーク制約チェック（更新時は自身を除外）
}
```

- Preconditions: DB 接続プールが利用可能
- Postconditions: 各メソッドは MonthlyCapacityRow またはプリミティブ値を返却
- Invariants: findAll は business_unit_code ASC, year_month ASC でソート。bulkUpsert はトランザクション内で全操作を実行し、失敗時はロールバック

**Implementation Notes**
- findAll の SELECT: `SELECT * FROM monthly_capacity WHERE capacity_scenario_id = @capacityScenarioId ORDER BY business_unit_code ASC, year_month ASC`
- create は OUTPUT 句で IDENTITY 値を取得後、findById で行を返却
- bulkUpsert の MERGE 文: `MERGE monthly_capacity AS target USING (SELECT @capacityScenarioId, @businessUnitCode, @yearMonth) AS source(capacity_scenario_id, business_unit_code, year_month) ON target.capacity_scenario_id = source.capacity_scenario_id AND target.business_unit_code = source.business_unit_code AND target.year_month = source.year_month WHEN MATCHED THEN UPDATE SET capacity = @capacity, updated_at = GETDATE() WHEN NOT MATCHED THEN INSERT (...) VALUES (...)`
- deleteById は `DELETE FROM monthly_capacity WHERE monthly_capacity_id = @monthlyCapacityId` で rowsAffected > 0 を返却
- businessUnitsExist はバルク操作向けに IN 句で一括チェック: `SELECT COUNT(DISTINCT business_unit_code) FROM business_units WHERE business_unit_code IN (...) AND deleted_at IS NULL` の結果が入力件数と一致するか確認

### Transform Layer

#### monthlyCapacityTransform

| Field | Detail |
|-------|--------|
| Intent | MonthlyCapacityRow（snake_case）から MonthlyCapacity（camelCase）への変換 |
| Requirements | 7.3-7.5 |

**Responsibilities & Constraints**
- snake_case → camelCase のフィールド名変換
- Date → ISO 8601 文字列変換
- capacity は number 型のまま返却（DECIMAL → number は mssql ライブラリが自動変換）

**Dependencies**
- Inbound: monthlyCapacityService — 変換処理 (P0)
- Outbound: monthlyCapacity types — MonthlyCapacityRow, MonthlyCapacity (P0)

**Contracts**: Service [x]

##### Service Interface

```typescript
function toMonthlyCapacityResponse(row: MonthlyCapacityRow): MonthlyCapacity
```

- Preconditions: row が null でないこと
- Postconditions: camelCase の MonthlyCapacity オブジェクトを返却
- Invariants: created_at/updated_at は ISO 8601 文字列に変換

### Service Layer

#### monthlyCapacityService

| Field | Detail |
|-------|--------|
| Intent | 月次キャパシティデータのビジネスロジック・エラーハンドリングを集約する |
| Requirements | 1.4, 2.2-2.3, 3.5-3.7, 4.3, 4.6-4.7, 5.2-5.3, 6.6-6.7, 6.9 |

**Responsibilities & Constraints**
- 親リソース（capacity_scenarios）の存在確認（deleted_at IS NULL）
- business_unit_code の存在確認（deleted_at IS NULL）
- 3キー ユニーク制約に基づく重複チェック（create/update 時）
- バルク Upsert 時の配列内 businessUnitCode + yearMonth 重複チェック
- capacityScenarioId の親子整合性チェック（単一取得/更新/削除時）
- HTTPException による統一的なエラー送出

**Dependencies**
- Inbound: monthlyCapacities Route — 全エンドポイント (P0)
- Outbound: monthlyCapacityData — DB アクセス (P0)
- Outbound: monthlyCapacityTransform — レスポンス変換 (P0)

**Contracts**: Service [x]

##### Service Interface

```typescript
interface MonthlyCapacityServiceInterface {
  findAll(capacityScenarioId: number): Promise<MonthlyCapacity[]>
  // Throws: HTTPException(404) if capacityScenario not found or deleted (1.4)

  findById(capacityScenarioId: number, monthlyCapacityId: number): Promise<MonthlyCapacity>
  // Throws: HTTPException(404) if not found or capacityScenarioId mismatch (2.2, 2.3)

  create(capacityScenarioId: number, data: CreateMonthlyCapacity): Promise<MonthlyCapacity>
  // Throws: HTTPException(404) if capacityScenario not found or deleted (3.5)
  // Throws: HTTPException(422) if businessUnitCode not found or deleted (3.6)
  // Throws: HTTPException(409) if unique key already exists (3.7)

  update(
    capacityScenarioId: number,
    monthlyCapacityId: number,
    data: UpdateMonthlyCapacity
  ): Promise<MonthlyCapacity>
  // Throws: HTTPException(404) if not found or capacityScenarioId mismatch (4.3)
  // Throws: HTTPException(409) if unique key conflict (4.6)
  // Throws: HTTPException(422) if businessUnitCode not found or deleted (4.7)

  delete(capacityScenarioId: number, monthlyCapacityId: number): Promise<void>
  // Throws: HTTPException(404) if not found or capacityScenarioId mismatch (5.2, 5.3)

  bulkUpsert(
    capacityScenarioId: number,
    data: BulkUpsertMonthlyCapacity
  ): Promise<MonthlyCapacity[]>
  // Throws: HTTPException(404) if capacityScenario not found or deleted (6.6)
  // Throws: HTTPException(422) if businessUnitCode+yearMonth duplicates in items array (6.7)
  // Throws: HTTPException(422) if any businessUnitCode not found or deleted (6.9)
}
```

- Preconditions: 各メソッドの引数が型スキーマに適合
- Postconditions: 正常時は MonthlyCapacity を返却、異常時は HTTPException を送出
- Invariants: capacityScenarioId の親子整合性は全操作で検証

**Implementation Notes**
- findById/update/delete 時: data 層で取得した行の `capacity_scenario_id` と URL の `capacityScenarioId` を比較し、不一致なら 404
- create/update 時: businessUnitCode の存在確認を uniqueKeyExists の前に実行
- bulkUpsert: 配列内の `${businessUnitCode}_${yearMonth}` を Set で重複チェック → businessUnitsExist で事業部一括検証 → data 層の bulkUpsert を呼び出し → 結果を transform

### Route Layer

#### monthlyCapacities Route

| Field | Detail |
|-------|--------|
| Intent | `/capacity-scenarios/:capacityScenarioId/monthly-capacities` 配下の HTTP エンドポイントを定義する |
| Requirements | 1.1-1.2, 2.1, 3.1-3.2, 3.4, 4.1, 4.4, 5.1, 6.1, 6.5, 7.1-7.2, 8.1-8.2 |

**Responsibilities & Constraints**
- Zod バリデーション（json）の適用
- パスパラメータ（capacityScenarioId, monthlyCapacityId）の parseInt 変換とバリデーション
- サービス層への委譲
- HTTP ステータスコードとレスポンス形式の制御
- Location ヘッダの設定（POST 201 時）
- `/bulk` エンドポイントを `:monthlyCapacityId` の前に定義してルーティング衝突を回避

**Dependencies**
- Inbound: index.ts — app.route() でマウント (P0)
- Outbound: monthlyCapacityService — ビジネスロジック (P0)
- Outbound: validate — Zod バリデーション (P0)
- Outbound: monthlyCapacity types — スキーマ (P0)

**Contracts**: API [x]

##### API Contract

| Method | Endpoint | Request | Response | Errors |
|--------|----------|---------|----------|--------|
| GET | / | - | `{ data: MonthlyCapacity[] }` 200 | 404, 422 |
| GET | /:monthlyCapacityId | param: monthlyCapacityId (int) | `{ data: MonthlyCapacity }` 200 | 404, 422 |
| POST | / | json: createMonthlyCapacitySchema | `{ data: MonthlyCapacity }` 201 + Location | 404, 409, 422 |
| PUT | /bulk | json: bulkUpsertMonthlyCapacitySchema | `{ data: MonthlyCapacity[] }` 200 | 404, 422 |
| PUT | /:monthlyCapacityId | json: updateMonthlyCapacitySchema | `{ data: MonthlyCapacity }` 200 | 404, 409, 422 |
| DELETE | /:monthlyCapacityId | - | 204 No Content | 404 |

**Implementation Notes**
- index.ts に `app.route('/capacity-scenarios/:capacityScenarioId/monthly-capacities', monthlyCapacities)` でマウント
- capacityScenarioId は各ハンドラで `c.req.param('capacityScenarioId')` → `parseInt` で取得。NaN の場合は HTTPException(422)
- `PUT /bulk` は `PUT /:monthlyCapacityId` より前に定義してルーティング衝突を回避
- GET 一覧はページネーション不要のため query バリデーションなし

## Data Models

### Domain Model

```mermaid
erDiagram
    capacity_scenarios ||--o{ monthly_capacity : has
    business_units ||--o{ monthly_capacity : referenced_by
    monthly_capacity {
        int monthly_capacity_id PK
        int capacity_scenario_id FK
        varchar business_unit_code FK
        char year_month
        decimal capacity
        datetime2 created_at
        datetime2 updated_at
    }
```

- **Aggregate**: monthly_capacity は capacity_scenarios の子ファクトデータ
- **Business Rules**:
  - 同一 capacity_scenario_id + business_unit_code 内で year_month は一意
  - 物理削除（deleted_at なし）
  - 親テーブル削除時は ON DELETE CASCADE で自動削除
  - business_unit_code は business_units テーブルに存在し、論理削除されていないこと

### Physical Data Model

monthly_capacity テーブルの既存定義（`docs/database/table-spec.md` 参照）をそのまま利用する。スキーマ変更は不要。

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| monthly_capacity_id | INT IDENTITY(1,1) | NO | 主キー |
| capacity_scenario_id | INT | NO | FK → capacity_scenarios(ON DELETE CASCADE) |
| business_unit_code | VARCHAR(20) | NO | FK → business_units |
| year_month | CHAR(6) | NO | 年月 YYYYMM |
| capacity | DECIMAL(10,2) | NO | キャパシティ（人時） |
| created_at | DATETIME2 | NO | 作成日時 |
| updated_at | DATETIME2 | NO | 更新日時 |

**ユニークインデックス**: UQ_monthly_capacity_scenario_bu_ym (capacity_scenario_id, business_unit_code, year_month)

### Data Contracts & Integration

**API Data Transfer**

リクエスト: camelCase（Zod スキーマで定義）
レスポンス: camelCase（monthlyCapacityTransform で変換）
シリアライゼーション: JSON

## Error Handling

### Error Strategy

既存のグローバルエラーハンドラ（`index.ts` の `app.onError`）と validate ヘルパー（`utils/validate.ts`）を利用する。新規のエラーハンドリングコードは不要。

### Error Categories and Responses

| Category | Status | Trigger | Detail |
|----------|--------|---------|--------|
| バリデーション | 422 | Zod スキーマ不適合、パスパラメータ不正、バルク配列内 businessUnitCode+yearMonth 重複、businessUnitCode 不存在 | RFC 9457 + errors 配列 |
| リソース不存在 | 404 | capacityScenarioId 不存在/論理削除済み、monthlyCapacityId 不存在、capacityScenarioId 不一致 | RFC 9457 |
| 競合 | 409 | 3キー ユニーク制約違反（create/update 時） | RFC 9457 |
| 内部エラー | 500 | 予期しない例外 | RFC 9457（グローバルハンドラ） |

## Testing Strategy

### Unit Tests

テストファイル: `src/__tests__/routes/monthlyCapacities.test.ts`

パターン: Vitest + `app.request()` を使用した HTTP レベルテスト。service 層をモック。

| テスト区分 | テスト内容 |
|-----------|-----------|
| GET / 正常系 | 一覧取得、business_unit_code + year_month 昇順ソート、data 配列形式 |
| GET /:id 正常系 | 単一取得、data オブジェクト形式 |
| POST / 正常系 | 作成、201 + Location ヘッダ、レスポンスボディ |
| PUT /:id 正常系 | 更新、200 + 更新されたフィールド確認 |
| DELETE /:id 正常系 | 物理削除、204 No Content |
| PUT /bulk 正常系 | バルク Upsert、200 + data 配列形式 |
| GET / 異常系 | 不存在/削除済み capacityScenarioId → 404 |
| GET /:id 異常系 | 不存在 → 404、capacityScenarioId 不一致 → 404 |
| POST / 異常系 | バリデーション → 422、親シナリオ不存在 → 404、businessUnitCode 不存在 → 422、ユニーク制約重複 → 409 |
| PUT /:id 異常系 | 不存在 → 404、バリデーション → 422、ユニーク制約重複 → 409、businessUnitCode 不存在 → 422 |
| DELETE /:id 異常系 | 不存在 → 404 |
| PUT /bulk 異常系 | バリデーション → 422、親シナリオ不存在 → 404、配列内重複 → 422、businessUnitCode 不存在 → 422 |

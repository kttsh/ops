# 月次人員計画 CRUD API

> **元spec**: monthly-headcount-plan-crud-api

## 概要

人員計画ケース（headcount_plan_cases）に紐づく月次人員計画データ（monthly_headcount_plan）の CRUD API を提供し、ビジネスユニット別・月別の人員数計画の入力・管理を可能にする。

- **ユーザー**: 事業部リーダーがビジネスユニットごとの月次人員数の入力・修正・一括更新に利用。キャパシティ計画における人員供給側の基盤データ
- **テーブル分類**: ファクトテーブル（物理削除・deleted_at なし・ページネーションなし）
- **影響範囲**: CRUD + バルク Upsert エンドポイントを新設
- **ルーティング**: headcount_plan_cases の子リソースとして `/headcount-plan-cases/:headcountPlanCaseId/monthly-headcount-plans` にネストマウント

## 要件

### 一覧取得
- `GET /headcount-plan-cases/:headcountPlanCaseId/monthly-headcount-plans` で全件返却（ページネーションなし）
- `{ data: [...] }` 形式
- `business_unit_code` 昇順 → `year_month` 昇順でソート
- 親ケースが不存在 / 論理削除済み → 404
- クエリパラメータ `businessUnitCode` でフィルタリング可能

### 単一取得
- `GET .../monthly-headcount-plans/:monthlyHeadcountPlanId` で詳細取得
- headcountPlanCaseId 不一致 → 404

### 新規作成
- `POST .../monthly-headcount-plans` → 201 Created + Location ヘッダ
- バリデーション: businessUnitCode（必須・VARCHAR(20)）、yearMonth（必須・YYYYMM形式）、headcount（必須・INT・0以上）
- businessUnitCode 不存在/論理削除済み → 404
- 同一 (headcountPlanCaseId, businessUnitCode, yearMonth) の重複 → 409

### 更新
- `PUT .../monthly-headcount-plans/:monthlyHeadcountPlanId` → 200 OK
- 更新結果がユニーク制約に違反 → 409
- businessUnitCode 不存在/論理削除済み → 404

### 物理削除
- `DELETE .../monthly-headcount-plans/:monthlyHeadcountPlanId` → 204 No Content
- headcountPlanCaseId 不一致 → 404

### バルク Upsert
- `PUT .../monthly-headcount-plans/bulk` → 200 OK
- `{ items: [{ businessUnitCode, yearMonth, headcount }, ...] }` 形式
- 既存レコードは更新、新規レコードは作成（MERGE）
- 配列内の (businessUnitCode, yearMonth) 重複 → 422
- トランザクション内で実行、一部失敗時は全体ロールバック
- いずれかの businessUnitCode 不存在/論理削除済み → 404

### 共通仕様
- RFC 9457 Problem Details 形式
- camelCase レスポンス、ISO 8601 日時
- headcount は整数型
- yearMonth は YYYYMM（月は 01〜12）

## アーキテクチャ・設計

### レイヤード構成

```mermaid
graph TB
    subgraph Routes
        MHP_Route[monthlyHeadcountPlans Route]
    end

    subgraph Services
        MHP_Service[monthlyHeadcountPlanService]
    end

    subgraph Data
        MHP_Data[monthlyHeadcountPlanData]
    end

    subgraph Transform
        MHP_Transform[monthlyHeadcountPlanTransform]
    end

    subgraph Types
        MHP_Types[monthlyHeadcountPlan types and schemas]
    end

    subgraph ExistingDB[SQL Server]
        T_MHP[monthly_headcount_plan]
        T_HPC[headcount_plan_cases]
        T_BU[business_units]
    end

    MHP_Route -->|delegates| MHP_Service
    MHP_Service -->|queries| MHP_Data
    MHP_Service -->|converts| MHP_Transform
    MHP_Route -->|validates| MHP_Types
    MHP_Data -->|CRUD| T_MHP
    MHP_Data -->|existence check| T_HPC
    MHP_Data -->|existence check| T_BU
```

### バルク Upsert フロー

```mermaid
sequenceDiagram
    participant Client
    participant Route as monthlyHeadcountPlans Route
    participant Service as monthlyHeadcountPlanService
    participant Data as monthlyHeadcountPlanData
    participant DB as SQL Server

    Client->>Route: PUT /headcount-plan-cases/:id/monthly-headcount-plans/bulk
    Route->>Route: Zod validate request body
    Route->>Service: bulkUpsert(headcountPlanCaseId, items)
    Service->>Service: items 内 businessUnitCode+yearMonth 重複チェック
    Service->>Data: headcountPlanCaseExists(headcountPlanCaseId)
    Data->>DB: SELECT from headcount_plan_cases
    DB-->>Data: result
    alt case not found or deleted
        Data-->>Service: false
        Service-->>Route: HTTPException 404
    else case exists
        Data-->>Service: true
        Service->>Data: businessUnitsExist(businessUnitCodes)
        Data->>DB: SELECT from business_units
        DB-->>Data: result
        alt some BU not found or deleted
            Data-->>Service: false
            Service-->>Route: HTTPException 404
        else all BUs exist
            Data-->>Service: true
            Service->>Data: bulkUpsert(headcountPlanCaseId, items)
            Data->>DB: BEGIN TRANSACTION
            loop for each item
                Data->>DB: MERGE monthly_headcount_plan
            end
            Data->>DB: COMMIT
            Data->>DB: SELECT all for headcountPlanCaseId
            DB-->>Data: rows
            Data-->>Service: MonthlyHeadcountPlanRow[]
            Service->>Service: transform rows
            Service-->>Route: MonthlyHeadcountPlan[]
            Route-->>Client: 200 OK with data
        end
    end
```

### 技術スタック

| Layer | Choice | Role |
|-------|--------|------|
| Backend | Hono v4 | ルート定義・リクエスト処理 |
| Validation | Zod + validate ヘルパー | リクエストバリデーション |
| Data | mssql | SQL Server・MERGE 文によるバルク Upsert |
| Testing | Vitest | app.request() パターン |

## APIコントラクト

| Method | Endpoint | Request | Response | Errors |
|--------|----------|---------|----------|--------|
| GET | / | query: businessUnitCode (optional) | `{ data: MonthlyHeadcountPlan[] }` 200 | 404, 422 |
| GET | /:monthlyHeadcountPlanId | param: monthlyHeadcountPlanId (int) | `{ data: MonthlyHeadcountPlan }` 200 | 404, 422 |
| POST | / | json: createMonthlyHeadcountPlanSchema | `{ data: MonthlyHeadcountPlan }` 201 + Location | 404, 409, 422 |
| PUT | /bulk | json: bulkUpsertMonthlyHeadcountPlanSchema | `{ data: MonthlyHeadcountPlan[] }` 200 | 404, 422 |
| PUT | /:monthlyHeadcountPlanId | json: updateMonthlyHeadcountPlanSchema | `{ data: MonthlyHeadcountPlan }` 200 | 404, 409, 422 |
| DELETE | /:monthlyHeadcountPlanId | - | 204 No Content | 404 |

**マウント**: `app.route('/headcount-plan-cases/:headcountPlanCaseId/monthly-headcount-plans', monthlyHeadcountPlans)`

**注意**: `PUT /bulk` は `PUT /:monthlyHeadcountPlanId` より前に定義してルーティング衝突を回避

## データモデル

### ER図

```mermaid
erDiagram
    headcount_plan_cases ||--o{ monthly_headcount_plan : has
    business_units ||--o{ monthly_headcount_plan : referenced_by
    monthly_headcount_plan {
        int monthly_headcount_plan_id PK
        int headcount_plan_case_id FK
        varchar business_unit_code FK
        char year_month
        int headcount
        datetime2 created_at
        datetime2 updated_at
    }
```

### monthly_headcount_plan テーブル

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| monthly_headcount_plan_id | INT IDENTITY(1,1) | NO | 主キー |
| headcount_plan_case_id | INT | NO | FK → headcount_plan_cases(ON DELETE CASCADE) |
| business_unit_code | VARCHAR(20) | NO | FK → business_units |
| year_month | CHAR(6) | NO | 年月 YYYYMM |
| headcount | INT | NO | 人数 |
| created_at | DATETIME2 | NO | 作成日時 |
| updated_at | DATETIME2 | NO | 更新日時 |

**ユニークインデックス**: UQ_monthly_headcount_plan_case_bu_ym (headcount_plan_case_id, business_unit_code, year_month)

### ビジネスルール
- 同一 (headcount_plan_case_id, business_unit_code, year_month) は一意
- 物理削除（deleted_at なし）
- 親テーブル削除時は ON DELETE CASCADE で自動削除
- business_units の削除済みレコードは参照不可

### 型定義

```typescript
// Zod スキーマ
const createMonthlyHeadcountPlanSchema: z.ZodObject<{
  businessUnitCode: z.ZodString    // 必須・1〜20文字
  yearMonth: z.ZodString           // 必須・YYYYMM形式
  headcount: z.ZodNumber           // 必須・int().min(0)
}>

const bulkUpsertMonthlyHeadcountPlanSchema: z.ZodObject<{
  items: z.ZodArray<z.ZodObject<{
    businessUnitCode: z.ZodString
    yearMonth: z.ZodString
    headcount: z.ZodNumber
  }>>  // min(1)
}>

// DB行型（snake_case）
type MonthlyHeadcountPlanRow = {
  monthly_headcount_plan_id: number
  headcount_plan_case_id: number
  business_unit_code: string
  year_month: string
  headcount: number
  created_at: Date
  updated_at: Date
}

// APIレスポンス型（camelCase）
type MonthlyHeadcountPlan = {
  monthlyHeadcountPlanId: number
  headcountPlanCaseId: number
  businessUnitCode: string
  yearMonth: string
  headcount: number
  createdAt: string       // ISO 8601
  updatedAt: string       // ISO 8601
}
```

## エラーハンドリング

| Category | Status | Trigger |
|----------|--------|---------|
| バリデーション | 422 | Zod スキーマ不適合、パスパラメータ不正、バルク配列内重複 |
| リソース不存在 | 404 | headcountPlanCaseId 不存在/論理削除済み、businessUnitCode 不存在/論理削除済み、monthlyHeadcountPlanId 不存在、headcountPlanCaseId 不一致 |
| 競合 | 409 | (headcount_plan_case_id, business_unit_code, year_month) ユニーク制約違反 |
| 内部エラー | 500 | 予期しない例外（グローバルハンドラ） |

## ファイル構成

| ファイル | レイヤー | 役割 |
|---------|---------|------|
| `src/types/monthlyHeadcountPlan.ts` | Types | Zod スキーマ・型定義 |
| `src/data/monthlyHeadcountPlanData.ts` | Data | SQL クエリ実行・MERGE |
| `src/transform/monthlyHeadcountPlanTransform.ts` | Transform | Row → Response 変換 |
| `src/services/monthlyHeadcountPlanService.ts` | Service | ビジネスロジック・重複チェック |
| `src/routes/monthlyHeadcountPlans.ts` | Routes | エンドポイント定義 |
| `src/__tests__/routes/monthlyHeadcountPlans.test.ts` | Test | ユニットテスト |

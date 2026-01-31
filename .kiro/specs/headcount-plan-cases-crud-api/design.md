# Design Document: headcount-plan-cases-crud-api

## Overview

**Purpose**: 人員計画ケース（headcount_plan_cases）のCRUD APIを提供し、事業部リーダーが人員計画シナリオの登録・参照・更新・削除を行えるようにする。

**Users**: 事業部リーダー、フロントエンド開発者が、人員計画ケースの管理画面やAPI連携で利用する。

**Impact**: 既存のバックエンドにおける初のエンティティテーブル（INT IDENTITY主キー + 外部キーJOIN）CRUD実装となり、以降のエンティティ実装の参照パターンとなる。

### Goals
- headcount_plan_cases テーブルに対する完全なCRUD操作（一覧・単一取得・作成・更新・論理削除・復元）の提供
- 外部キー（business_unit_code）に対応するビジネスユニット名をJOINで取得しレスポンスに含める
- 既存のレイヤードアーキテクチャパターン（routes → services → data → transform → types）への準拠

### Non-Goals
- monthly_headcount_plan（子テーブル）のCRUD操作
- ビジネスユニットのフィルタリング・検索機能（将来的に追加可能）
- フロントエンド実装
- バッチ処理・非同期処理

## Architecture

### Existing Architecture Analysis

既存のバックエンドは、businessUnits / projectTypes / workTypes の3つのマスタテーブルに対するCRUD APIを実装済み。すべて以下のパターンに従う：

- **レイヤード構成**: routes → services → data + transform + types
- **文字列主キー**: business_unit_code 等の自然キー
- **外部キーなし**: マスタテーブルのため関連エンティティへのJOINなし
- **ソフトデリート**: deleted_at カラムによる論理削除
- **RFC 9457**: エラーレスポンスは Problem Details 形式

headcount_plan_cases の実装では以下が異なる：
- INT IDENTITY 主キー（文字列コードではなくID番号）
- 外部キー（business_unit_code → business_units）によるLEFT JOIN
- 作成時の重複チェック不要（IDENTITY主キーのため）

### Architecture Pattern & Boundary Map

```mermaid
graph TB
    subgraph Routes
        R[headcountPlanCases.ts]
    end
    subgraph Services
        S[headcountPlanCaseService.ts]
    end
    subgraph Data
        D[headcountPlanCaseData.ts]
        BUD[businessUnitData.ts]
    end
    subgraph Transform
        T[headcountPlanCaseTransform.ts]
    end
    subgraph Types
        TY[headcountPlanCase.ts]
    end
    subgraph Database
        DB[(SQL Server)]
    end

    R --> S
    S --> D
    S --> BUD
    S --> T
    R --> TY
    S --> TY
    D --> TY
    T --> TY
    D --> DB
    BUD --> DB
```

**Architecture Integration**:
- **Selected pattern**: 既存のレイヤードアーキテクチャを踏襲
- **Domain/feature boundaries**: headcountPlanCase の各層ファイルが責務を分離。外部キーチェックには既存の businessUnitData を再利用
- **Existing patterns preserved**: validate ミドルウェア、problemResponse ヘルパー、paginationQuerySchema
- **New components rationale**: 5ファイル（types, data, transform, service, routes）は既存パターンの直接的な拡張
- **Steering compliance**: レイヤー間の依存方向（routes → services → data）を厳守

### Technology Stack

| Layer | Choice / Version | Role in Feature | Notes |
|-------|------------------|-----------------|-------|
| Backend | Hono v4 | ルーティング・ミドルウェア | 既存と同一 |
| Validation | Zod + @hono/zod-validator | リクエストバリデーション | 既存と同一 |
| Data | mssql | SQL Server クエリ実行 | LEFT JOIN追加 |
| Test | Vitest | ユニットテスト | 既存と同一 |

## Requirements Traceability

| Requirement | Summary | Components | Interfaces | Notes |
|-------------|---------|------------|------------|-------|
| 1.1, 1.2, 1.3, 1.4, 1.5 | 一覧取得（ページネーション・JOIN・ソフトデリートフィルタ） | Data, Transform, Service, Routes | API: GET / | LEFT JOIN で businessUnitName 取得 |
| 2.1, 2.2, 2.3, 2.4 | 単一取得（JOIN・404処理） | Data, Transform, Service, Routes | API: GET /:id | |
| 3.1, 3.2, 3.3, 3.4, 3.5 | 新規作成（バリデーション・FK存在チェック） | Data, Service, Routes, Types | API: POST / | businessUnitCode 存在確認に businessUnitData 再利用 |
| 4.1, 4.2, 4.3, 4.4, 4.5 | 更新（部分更新・FK存在チェック） | Data, Service, Routes, Types | API: PUT /:id | |
| 5.1, 5.2, 5.3, 5.4 | 論理削除（参照チェック） | Data, Service, Routes | API: DELETE /:id | monthly_headcount_plan 参照チェック |
| 6.1, 6.2, 6.3 | 復元 | Data, Service, Routes | API: POST /:id/actions/restore | |
| 7.1, 7.2, 7.3, 7.4, 7.5 | レスポンス形式 | Transform, Routes | 全エンドポイント | RFC 9457、camelCase |
| 8.1, 8.2, 8.3, 8.4 | バリデーション | Types, Routes | Zod スキーマ | |
| 9.1, 9.2, 9.3, 9.4 | テスト | テストファイル | Vitest | |

## Components and Interfaces

| Component | Domain/Layer | Intent | Req Coverage | Key Dependencies | Contracts |
|-----------|-------------|--------|--------------|------------------|-----------|
| headcountPlanCase.ts | Types | Zodスキーマ・型定義 | 7, 8 | pagination.ts (P0) | — |
| headcountPlanCaseData.ts | Data | SQLクエリ実行 | 1, 2, 3, 4, 5, 6 | database/client (P0) | Service |
| headcountPlanCaseTransform.ts | Transform | Row→Response変換 | 7 | types (P0) | — |
| headcountPlanCaseService.ts | Service | ビジネスロジック | 1–6 | Data (P0), Transform (P0), businessUnitData (P1) | Service |
| headcountPlanCases.ts | Routes | HTTPエンドポイント | 1–8 | Service (P0), Types (P0), validate (P0) | API |

### Types Layer

#### headcountPlanCase.ts

| Field | Detail |
|-------|--------|
| Intent | Zodバリデーションスキーマとリクエスト・レスポンス・DB行のTypeScript型を定義 |
| Requirements | 7.4, 7.5, 8.1, 8.2, 8.3, 8.4 |

**Contracts**: State [x]

##### State Management

```typescript
// --- Zod スキーマ ---

/** 作成用スキーマ */
// createHeadcountPlanCaseSchema
// - caseName: string, min(1), max(100) — 必須
// - isPrimary: boolean, default(false) — 任意
// - description: string, max(500), optional, nullable — 任意
// - businessUnitCode: string, max(20), regex(/^[a-zA-Z0-9_-]+$/), optional, nullable — 任意

/** 更新用スキーマ */
// updateHeadcountPlanCaseSchema
// - caseName: string, min(1), max(100), optional — 任意
// - isPrimary: boolean, optional — 任意
// - description: string, max(500), optional, nullable — 任意
// - businessUnitCode: string, max(20), regex(/^[a-zA-Z0-9_-]+$/), optional, nullable — 任意

/** 一覧取得クエリスキーマ */
// headcountPlanCaseListQuerySchema = paginationQuerySchema.extend({
//   'filter[includeDisabled]': z.coerce.boolean().default(false)
// })

// --- TypeScript 型 ---

type CreateHeadcountPlanCase = z.infer<typeof createHeadcountPlanCaseSchema>
type UpdateHeadcountPlanCase = z.infer<typeof updateHeadcountPlanCaseSchema>
type HeadcountPlanCaseListQuery = z.infer<typeof headcountPlanCaseListQuerySchema>

/** DB行型（snake_case） */
type HeadcountPlanCaseRow = {
  headcount_plan_case_id: number
  case_name: string
  is_primary: boolean
  description: string | null
  business_unit_code: string | null
  business_unit_name: string | null  // LEFT JOIN で取得
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

/** APIレスポンス型（camelCase） */
type HeadcountPlanCase = {
  headcountPlanCaseId: number
  caseName: string
  isPrimary: boolean
  description: string | null
  businessUnitCode: string | null
  businessUnitName: string | null  // JOINで取得した名称
  createdAt: string   // ISO 8601
  updatedAt: string   // ISO 8601
}
```

**Implementation Notes**:
- `isPrimary` は SQL Server の BIT 型。mssql ドライバは boolean として返す
- `businessUnitName` は LEFT JOIN の結果であり、Row 型・Response 型の両方で null 許容

---

### Data Layer

#### headcountPlanCaseData.ts

| Field | Detail |
|-------|--------|
| Intent | headcount_plan_cases テーブルへのSQLクエリ実行。business_units とのLEFT JOINを含む |
| Requirements | 1.1, 1.2, 1.3, 1.4, 2.1, 2.3, 2.4, 3.1, 4.1, 5.1, 5.2, 5.4, 6.1, 6.2 |

**Dependencies**:
- Inbound: headcountPlanCaseService — CRUDオペレーション (P0)
- External: mssql / database/client — DB接続 (P0)

**Contracts**: Service [x]

##### Service Interface

```typescript
interface HeadcountPlanCaseDataInterface {
  findAll(params: {
    page: number
    pageSize: number
    includeDisabled: boolean
  }): Promise<{ items: HeadcountPlanCaseRow[]; totalCount: number }>

  findById(id: number): Promise<HeadcountPlanCaseRow | undefined>

  findByIdIncludingDeleted(id: number): Promise<HeadcountPlanCaseRow | undefined>

  create(data: {
    caseName: string
    isPrimary: boolean
    description: string | null
    businessUnitCode: string | null
  }): Promise<HeadcountPlanCaseRow>

  update(id: number, data: {
    caseName?: string
    isPrimary?: boolean
    description?: string | null
    businessUnitCode?: string | null
  }): Promise<HeadcountPlanCaseRow | undefined>

  softDelete(id: number): Promise<HeadcountPlanCaseRow | undefined>

  restore(id: number): Promise<HeadcountPlanCaseRow | undefined>

  hasReferences(id: number): Promise<boolean>
}
```

- **Preconditions**: DB接続が確立されていること
- **Postconditions**: 各メソッドは指定された条件に合致するレコードを返す。見つからない場合は undefined
- **Invariants**: すべてのクエリはパラメータ化されている（SQLインジェクション防止）

**Implementation Notes**:
- `findAll` / `findById`: `LEFT JOIN business_units bu ON hpc.business_unit_code = bu.business_unit_code AND bu.deleted_at IS NULL` でビジネスユニット名を取得
- `create`: INSERT の OUTPUT 句では JOIN 結果を含められないため、INSERT 後に `findById` を呼び出して完全な Row を返す
- `update`: 同様に UPDATE の OUTPUT 句では JOIN 結果を含められないため、UPDATE 後に `findById` を呼び出す
- `softDelete` / `restore`: OUTPUT 句で直接返し、JOIN結果は不要（サービス層で必要なら findById を呼ぶ）
- `hasReferences`: `monthly_headcount_plan` テーブルに対する EXISTS チェック

---

### Transform Layer

#### headcountPlanCaseTransform.ts

| Field | Detail |
|-------|--------|
| Intent | HeadcountPlanCaseRow（snake_case）→ HeadcountPlanCase（camelCase）の変換 |
| Requirements | 7.4, 7.5 |

**Implementation Notes**:
- snake_case → camelCase のフィールドマッピング
- `created_at` / `updated_at` を `.toISOString()` で ISO 8601 文字列に変換
- `business_unit_name` → `businessUnitName` のマッピング（null 許容）

---

### Service Layer

#### headcountPlanCaseService.ts

| Field | Detail |
|-------|--------|
| Intent | CRUD操作のビジネスロジック。外部キー存在チェック・参照整合性チェック・エラーハンドリングを担当 |
| Requirements | 1.1–1.5, 2.1–2.4, 3.1–3.5, 4.1–4.5, 5.1–5.4, 6.1–6.3 |

**Dependencies**:
- Inbound: headcountPlanCases route — HTTPハンドラ (P0)
- Outbound: headcountPlanCaseData — DB操作 (P0)
- Outbound: headcountPlanCaseTransform — レスポンス変換 (P0)
- Outbound: businessUnitData.findByCode — FK存在チェック (P1)

**Contracts**: Service [x]

##### Service Interface

```typescript
interface HeadcountPlanCaseServiceInterface {
  findAll(params: {
    page: number
    pageSize: number
    includeDisabled: boolean
  }): Promise<{ items: HeadcountPlanCase[]; totalCount: number }>

  findById(id: number): Promise<HeadcountPlanCase>
  // throws HTTPException(404) if not found

  create(data: CreateHeadcountPlanCase): Promise<HeadcountPlanCase>
  // throws HTTPException(422) if businessUnitCode invalid

  update(id: number, data: UpdateHeadcountPlanCase): Promise<HeadcountPlanCase>
  // throws HTTPException(404) if not found
  // throws HTTPException(422) if businessUnitCode invalid

  delete(id: number): Promise<void>
  // throws HTTPException(404) if not found
  // throws HTTPException(409) if has references

  restore(id: number): Promise<HeadcountPlanCase>
  // throws HTTPException(404) if not found or not deleted
}
```

- **Preconditions**: 各メソッドの引数がバリデーション済みであること（ルート層で実施）
- **Postconditions**: 成功時は変換済みレスポンスを返す。失敗時は適切な HTTPException をスロー
- **Invariants**: businessUnitCode が指定された場合、必ず business_units テーブルに存在確認を行う

**Implementation Notes**:
- `create` / `update`: businessUnitCode が指定されている場合、`businessUnitData.findByCode()` で存在チェック。存在しなければ HTTPException(422) をスロー
- `delete`: `headcountPlanCaseData.hasReferences()` で参照チェック後、`softDelete()` を実行
- `restore`: `findByIdIncludingDeleted()` で存在・削除状態を確認後、`restore()` を実行

---

### Routes Layer

#### headcountPlanCases.ts

| Field | Detail |
|-------|--------|
| Intent | HTTPエンドポイント定義。バリデーション・レスポンス整形を担当 |
| Requirements | 1.1–1.5, 2.1–2.4, 3.1–3.2, 4.1, 5.1, 6.1, 7.1–7.3, 8.1–8.4 |

**Contracts**: API [x]

##### API Contract

| Method | Endpoint | Request | Response | Status | Errors |
|--------|----------|---------|----------|--------|--------|
| GET | / | HeadcountPlanCaseListQuery (query) | `{ data: HeadcountPlanCase[], meta: { pagination } }` | 200 | 422 |
| GET | /:id | id: number (path) | `{ data: HeadcountPlanCase }` | 200 | 404 |
| POST | / | CreateHeadcountPlanCase (json) | `{ data: HeadcountPlanCase }` + Location header | 201 | 422 |
| PUT | /:id | id: number (path) + UpdateHeadcountPlanCase (json) | `{ data: HeadcountPlanCase }` | 200 | 404, 422 |
| DELETE | /:id | id: number (path) | (no body) | 204 | 404, 409 |
| POST | /:id/actions/restore | id: number (path) | `{ data: HeadcountPlanCase }` | 200 | 404 |

**Implementation Notes**:
- ルートを `app.route('/headcount-plan-cases', headcountPlanCases)` で index.ts にマウント
- メソッドチェーンでルートを定義し、`HeadcountPlanCasesRoute` 型をエクスポート
- パスパラメータ `:id` は各ハンドラ内で `Number(c.req.param('id'))` で取得

## Data Models

### Domain Model

```mermaid
erDiagram
    business_units ||--o{ headcount_plan_cases : "所属"
    headcount_plan_cases ||--o{ monthly_headcount_plan : "月次計画"

    headcount_plan_cases {
        int headcount_plan_case_id PK
        string case_name
        boolean is_primary
        string description
        string business_unit_code FK
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
```

**Business Rules & Invariants**:
- headcount_plan_case_id は自動採番（IDENTITY）、変更不可
- business_unit_code は NULLable — 特定BUに紐づかないケースも許容
- is_primary はデフォルト false
- 論理削除（deleted_at）のあるレコードは通常のクエリから除外
- 削除前に monthly_headcount_plan への参照がないことを確認

### Physical Data Model

対象テーブル `headcount_plan_cases` のスキーマは `docs/database/table-spec.md` に定義済み。新規テーブル作成やスキーマ変更は不要。

### Data Contracts & Integration

**API Data Transfer**:

レスポンス例（単一取得）:
```json
{
  "data": {
    "headcountPlanCaseId": 1,
    "caseName": "標準ケース",
    "isPrimary": true,
    "description": "標準的な人員計画",
    "businessUnitCode": "plant",
    "businessUnitName": "プラント事業",
    "createdAt": "2026-01-31T00:00:00.000Z",
    "updatedAt": "2026-01-31T00:00:00.000Z"
  }
}
```

レスポンス例（一覧取得）:
```json
{
  "data": [
    {
      "headcountPlanCaseId": 1,
      "caseName": "標準ケース",
      "isPrimary": true,
      "description": null,
      "businessUnitCode": "plant",
      "businessUnitName": "プラント事業",
      "createdAt": "2026-01-31T00:00:00.000Z",
      "updatedAt": "2026-01-31T00:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "pageSize": 20,
      "totalItems": 1,
      "totalPages": 1
    }
  }
}
```

## Error Handling

### Error Strategy

既存のグローバルエラーハンドラ（index.ts の `app.onError`）と RFC 9457 Problem Details 形式に従う。サービス層から HTTPException をスローし、グローバルハンドラが統一的に処理する。

### Error Categories and Responses

| Status | Type | Trigger | Detail |
|--------|------|---------|--------|
| 404 | resource-not-found | ID不存在、論理削除済み | `Headcount plan case with ID '{id}' not found` |
| 409 | conflict | 参照整合性違反（削除時） | `Headcount plan case with ID '{id}' is referenced by other resources and cannot be deleted` |
| 409 | conflict | 復元対象が削除されていない | `Headcount plan case with ID '{id}' is not soft-deleted` |
| 422 | validation-error | Zodバリデーション失敗 | errors 配列にフィールド別詳細 |
| 422 | validation-error | businessUnitCode 不存在 | `Business unit with code '{code}' not found` |

## Testing Strategy

### Unit Tests

テストファイルの配置は既存パターンに従い `src/__tests__/` にソース構造をミラーする。

#### routes/headcountPlanCases.test.ts
- GET / — 一覧取得（200、ページネーション検証、空リスト）
- GET /:id — 単一取得（200、404）
- POST / — 作成（201、Location ヘッダ、422 バリデーションエラー）
- PUT /:id — 更新（200、404、422）
- DELETE /:id — 削除（204、404、409 参照整合性）
- POST /:id/actions/restore — 復元（200、404）

#### services/headcountPlanCaseService.test.ts
- findAll — データ層呼び出しとTransform適用の検証
- findById — 正常系と404例外の検証
- create — FK存在チェックと422例外の検証
- update — 部分更新とFK存在チェックの検証
- delete — 参照チェックと409例外の検証
- restore — 削除状態チェックの検証

#### data/headcountPlanCaseData.test.ts
- findAll — LEFT JOIN 含むSQL実行とページネーション
- findById — パラメータ化クエリの検証
- create — INSERT + findById の連携
- update — 動的SET句の生成
- softDelete / restore — deleted_at の操作
- hasReferences — EXISTS チェック

**テストパターン**:
- `vi.mock()` でサービス層・データ層をモック
- `app.request()` でHTTPリクエストをシミュレート
- mssql の `getPool` / `request` / `input` / `query` をモック

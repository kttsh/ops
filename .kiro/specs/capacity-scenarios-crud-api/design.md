# Design Document: capacity-scenarios-crud-api

## Overview

**Purpose**: キャパシティシナリオ（capacity_scenarios）のCRUD APIを提供し、事業部リーダーがキャパシティ計画シナリオの登録・参照・更新・削除を行えるようにする。

**Users**: 事業部リーダー、フロントエンド開発者が、キャパシティシナリオの管理画面やAPI連携で利用する。

**Impact**: headcount_plan_cases に続くエンティティテーブルの CRUD 実装。外部キーを持たないシンプルなエンティティであり、既存パターンの簡略版となる。

### Goals
- capacity_scenarios テーブルに対する完全なCRUD操作（一覧・単一取得・作成・更新・論理削除・復元）の提供
- 既存のレイヤードアーキテクチャパターン（routes → services → data → transform → types）への準拠

### Non-Goals
- monthly_capacity（子テーブル）のCRUD操作
- フロントエンド実装
- バッチ処理・非同期処理

## Architecture

### Existing Architecture Analysis

既存のバックエンドは、マスタテーブル（businessUnits / projectTypes / workTypes）とエンティティテーブル（headcountPlanCases / projectCases）に対するCRUD APIを実装済み。すべて以下のパターンに従う：

- **レイヤード構成**: routes → services → data + transform + types
- **ソフトデリート**: deleted_at カラムによる論理削除
- **RFC 9457**: エラーレスポンスは Problem Details 形式

capacity_scenarios の実装では headcount_plan_cases との差異は以下のみ：
- 外部キーなし → LEFT JOIN 不要、FK存在チェック不要
- `scenario_name` フィールド（`case_name` ではない）

### Architecture Pattern & Boundary Map

```mermaid
graph TB
    subgraph Routes
        R[capacityScenarios.ts]
    end
    subgraph Services
        S[capacityScenarioService.ts]
    end
    subgraph Data
        D[capacityScenarioData.ts]
    end
    subgraph Transform
        T[capacityScenarioTransform.ts]
    end
    subgraph Types
        TY[capacityScenario.ts]
    end
    subgraph Database
        DB[(SQL Server)]
    end

    R --> S
    S --> D
    S --> T
    R --> TY
    S --> TY
    D --> TY
    T --> TY
    D --> DB
```

**Architecture Integration**:
- **Selected pattern**: 既存のレイヤードアーキテクチャを踏襲
- **Domain/feature boundaries**: capacityScenario の各層ファイルが責務を分離。外部キーがないため他エンティティのData層への依存なし
- **Existing patterns preserved**: validate ミドルウェア、problemResponse ヘルパー、paginationQuerySchema
- **New components rationale**: 5ファイル（types, data, transform, service, routes）は既存パターンの直接的な拡張
- **Steering compliance**: レイヤー間の依存方向（routes → services → data）を厳守

### Technology Stack

| Layer | Choice / Version | Role in Feature | Notes |
|-------|------------------|-----------------|-------|
| Backend | Hono v4 | ルーティング・ミドルウェア | 既存と同一 |
| Validation | Zod + @hono/zod-validator | リクエストバリデーション | 既存と同一 |
| Data | mssql | SQL Server クエリ実行 | JOINなし（単一テーブル操作） |
| Test | Vitest | ユニットテスト | 既存と同一 |

## Requirements Traceability

| Requirement | Summary | Components | Interfaces | Notes |
|-------------|---------|------------|------------|-------|
| 1.1, 1.2, 1.3, 1.4 | 一覧取得（ページネーション・ソフトデリートフィルタ） | Data, Transform, Service, Routes | API: GET / | JOINなし |
| 2.1, 2.2, 2.3 | 単一取得（404処理） | Data, Transform, Service, Routes | API: GET /:id | |
| 3.1, 3.2, 3.3, 3.4 | 新規作成（バリデーション） | Data, Service, Routes, Types | API: POST / | FK存在チェック不要 |
| 4.1, 4.2, 4.3, 4.4 | 更新（部分更新） | Data, Service, Routes, Types | API: PUT /:id | |
| 5.1, 5.2, 5.3, 5.4 | 論理削除（参照チェック） | Data, Service, Routes | API: DELETE /:id | monthly_capacity 参照チェック |
| 6.1, 6.2, 6.3 | 復元 | Data, Service, Routes | API: POST /:id/actions/restore | |
| 7.1, 7.2, 7.3, 7.4, 7.5 | レスポンス形式 | Transform, Routes | 全エンドポイント | RFC 9457、camelCase |
| 8.1, 8.2, 8.3, 8.4 | バリデーション | Types, Routes | Zod スキーマ | |
| 9.1, 9.2, 9.3, 9.4 | テスト | テストファイル | Vitest | |

## Components and Interfaces

| Component | Domain/Layer | Intent | Req Coverage | Key Dependencies | Contracts |
|-----------|-------------|--------|--------------|------------------|-----------|
| capacityScenario.ts | Types | Zodスキーマ・型定義 | 7, 8 | pagination.ts (P0) | State |
| capacityScenarioData.ts | Data | SQLクエリ実行 | 1, 2, 3, 4, 5, 6 | database/client (P0) | Service |
| capacityScenarioTransform.ts | Transform | Row→Response変換 | 7 | types (P0) | — |
| capacityScenarioService.ts | Service | ビジネスロジック | 1–6 | Data (P0), Transform (P0) | Service |
| capacityScenarios.ts | Routes | HTTPエンドポイント | 1–8 | Service (P0), Types (P0), validate (P0) | API |

### Types Layer

#### capacityScenario.ts

| Field | Detail |
|-------|--------|
| Intent | Zodバリデーションスキーマとリクエスト・レスポンス・DB行のTypeScript型を定義 |
| Requirements | 7.4, 7.5, 8.1, 8.2, 8.3, 8.4 |

**Contracts**: State [x]

##### State Management

```typescript
// --- Zod スキーマ ---

/** 作成用スキーマ */
// createCapacityScenarioSchema
// - scenarioName: string, min(1), max(100) — 必須
// - isPrimary: boolean, default(false) — 任意
// - description: string, max(500), optional, nullable — 任意

/** 更新用スキーマ */
// updateCapacityScenarioSchema
// - scenarioName: string, min(1), max(100), optional — 任意
// - isPrimary: boolean, optional — 任意
// - description: string, max(500), optional, nullable — 任意

/** 一覧取得クエリスキーマ */
// capacityScenarioListQuerySchema = paginationQuerySchema.extend({
//   'filter[includeDisabled]': z.coerce.boolean().default(false)
// })

// --- TypeScript 型 ---

type CreateCapacityScenario = z.infer<typeof createCapacityScenarioSchema>
type UpdateCapacityScenario = z.infer<typeof updateCapacityScenarioSchema>
type CapacityScenarioListQuery = z.infer<typeof capacityScenarioListQuerySchema>

/** DB行型（snake_case） */
type CapacityScenarioRow = {
  capacity_scenario_id: number
  scenario_name: string
  is_primary: boolean
  description: string | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

/** APIレスポンス型（camelCase） */
type CapacityScenario = {
  capacityScenarioId: number
  scenarioName: string
  isPrimary: boolean
  description: string | null
  createdAt: string   // ISO 8601
  updatedAt: string   // ISO 8601
}
```

**Implementation Notes**:
- `isPrimary` は SQL Server の BIT 型。mssql ドライバは boolean として返す
- headcount_plan_cases と異なり、外部キー関連のフィールド（businessUnitCode, businessUnitName）はない

---

### Data Layer

#### capacityScenarioData.ts

| Field | Detail |
|-------|--------|
| Intent | capacity_scenarios テーブルへのSQLクエリ実行（単一テーブル操作、JOINなし） |
| Requirements | 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 4.1, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3 |

**Dependencies**:
- Inbound: capacityScenarioService — CRUDオペレーション (P0)
- External: mssql / database/client — DB接続 (P0)

**Contracts**: Service [x]

##### Service Interface

```typescript
interface CapacityScenarioDataInterface {
  findAll(params: {
    page: number
    pageSize: number
    includeDisabled: boolean
  }): Promise<{ items: CapacityScenarioRow[]; totalCount: number }>

  findById(id: number): Promise<CapacityScenarioRow | undefined>

  findByIdIncludingDeleted(id: number): Promise<CapacityScenarioRow | undefined>

  create(data: {
    scenarioName: string
    isPrimary: boolean
    description: string | null
  }): Promise<CapacityScenarioRow>

  update(id: number, data: {
    scenarioName?: string
    isPrimary?: boolean
    description?: string | null
  }): Promise<CapacityScenarioRow | undefined>

  softDelete(id: number): Promise<CapacityScenarioRow | undefined>

  restore(id: number): Promise<CapacityScenarioRow | undefined>

  hasReferences(id: number): Promise<boolean>
}
```

- **Preconditions**: DB接続が確立されていること
- **Postconditions**: 各メソッドは指定された条件に合致するレコードを返す。見つからない場合は undefined
- **Invariants**: すべてのクエリはパラメータ化されている（SQLインジェクション防止）

**Implementation Notes**:
- `findAll` / `findById`: LEFT JOIN 不要。単一テーブルからの SELECT のみ
- `create`: INSERT の OUTPUT 句で直接 Row を返却可能（JOINが不要のため `findById` を呼ばなくても良いが、一貫性のため既存パターンに揃えて INSERT 後 `findById` で取得しても可）
- `update`: 動的 SET 句の構築で部分更新に対応。UPDATE 後 `findById` で完全な Row を返す
- `softDelete` / `restore`: OUTPUT 句で直接返却
- `hasReferences`: `monthly_capacity` テーブルに対する EXISTS チェック

---

### Transform Layer

#### capacityScenarioTransform.ts

| Field | Detail |
|-------|--------|
| Intent | CapacityScenarioRow（snake_case）→ CapacityScenario（camelCase）の変換 |
| Requirements | 7.4, 7.5 |

**Implementation Notes**:
- snake_case → camelCase のフィールドマッピング
- `created_at` / `updated_at` を `.toISOString()` で ISO 8601 文字列に変換
- headcount_plan_cases と異なり、外部キー関連フィールドのマッピングは不要

---

### Service Layer

#### capacityScenarioService.ts

| Field | Detail |
|-------|--------|
| Intent | CRUD操作のビジネスロジック。参照整合性チェック・エラーハンドリングを担当 |
| Requirements | 1.1–1.4, 2.1–2.3, 3.1–3.4, 4.1–4.4, 5.1–5.4, 6.1–6.3 |

**Dependencies**:
- Inbound: capacityScenarios route — HTTPハンドラ (P0)
- Outbound: capacityScenarioData — DB操作 (P0)
- Outbound: capacityScenarioTransform — レスポンス変換 (P0)

**Contracts**: Service [x]

##### Service Interface

```typescript
interface CapacityScenarioServiceInterface {
  findAll(params: {
    page: number
    pageSize: number
    includeDisabled: boolean
  }): Promise<{ items: CapacityScenario[]; totalCount: number }>

  findById(id: number): Promise<CapacityScenario>
  // throws HTTPException(404) if not found

  create(data: CreateCapacityScenario): Promise<CapacityScenario>

  update(id: number, data: UpdateCapacityScenario): Promise<CapacityScenario>
  // throws HTTPException(404) if not found

  delete(id: number): Promise<void>
  // throws HTTPException(404) if not found
  // throws HTTPException(409) if has references

  restore(id: number): Promise<CapacityScenario>
  // throws HTTPException(404) if not found or not deleted
}
```

- **Preconditions**: 各メソッドの引数がバリデーション済みであること（ルート層で実施）
- **Postconditions**: 成功時は変換済みレスポンスを返す。失敗時は適切な HTTPException をスロー
- **Invariants**: 外部キーを持たないため、FK存在チェックは不要

**Implementation Notes**:
- `create`: FK存在チェック不要。データ層に直接委譲
- `update`: FK存在チェック不要。存在チェックのみ
- `delete`: `capacityScenarioData.hasReferences()` で monthly_capacity の参照チェック後、`softDelete()` を実行
- `restore`: `findByIdIncludingDeleted()` で存在・削除状態を確認後、`restore()` を実行

---

### Routes Layer

#### capacityScenarios.ts

| Field | Detail |
|-------|--------|
| Intent | HTTPエンドポイント定義。バリデーション・レスポンス整形を担当 |
| Requirements | 1.1–1.4, 2.1–2.3, 3.1–3.2, 4.1, 5.1, 6.1, 7.1–7.3, 8.1–8.4 |

**Contracts**: API [x]

##### API Contract

| Method | Endpoint | Request | Response | Status | Errors |
|--------|----------|---------|----------|--------|--------|
| GET | / | CapacityScenarioListQuery (query) | `{ data: CapacityScenario[], meta: { pagination } }` | 200 | 422 |
| GET | /:id | id: number (path) | `{ data: CapacityScenario }` | 200 | 404 |
| POST | / | CreateCapacityScenario (json) | `{ data: CapacityScenario }` + Location header | 201 | 422 |
| PUT | /:id | id: number (path) + UpdateCapacityScenario (json) | `{ data: CapacityScenario }` | 200 | 404, 422 |
| DELETE | /:id | id: number (path) | (no body) | 204 | 404, 409 |
| POST | /:id/actions/restore | id: number (path) | `{ data: CapacityScenario }` | 200 | 404 |

**Implementation Notes**:
- ルートを `app.route('/capacity-scenarios', capacityScenarios)` で index.ts にマウント
- メソッドチェーンでルートを定義し、`CapacityScenariosRoute` 型をエクスポート
- パスパラメータ `:id` は各ハンドラ内で `Number(c.req.param('id'))` で取得

## Data Models

### Domain Model

```mermaid
erDiagram
    capacity_scenarios ||--o{ monthly_capacity : "月次キャパシティ"

    capacity_scenarios {
        int capacity_scenario_id PK
        string scenario_name
        boolean is_primary
        string description
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
```

**Business Rules & Invariants**:
- capacity_scenario_id は自動採番（IDENTITY）、変更不可
- is_primary はデフォルト false
- 論理削除（deleted_at）のあるレコードは通常のクエリから除外
- 削除前に monthly_capacity への参照がないことを確認

### Physical Data Model

対象テーブル `capacity_scenarios` のスキーマは `docs/database/table-spec.md` に定義済み。新規テーブル作成やスキーマ変更は不要。

### Data Contracts & Integration

**API Data Transfer**:

レスポンス例（単一取得）:
```json
{
  "data": {
    "capacityScenarioId": 1,
    "scenarioName": "標準シナリオ",
    "isPrimary": true,
    "description": "標準的なキャパシティ計画",
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
      "capacityScenarioId": 1,
      "scenarioName": "標準シナリオ",
      "isPrimary": true,
      "description": null,
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
| 404 | resource-not-found | ID不存在、論理削除済み | `Capacity scenario with ID '{id}' not found` |
| 409 | conflict | 参照整合性違反（削除時） | `Capacity scenario with ID '{id}' is referenced by other resources and cannot be deleted` |
| 409 | conflict | 復元対象が削除されていない | `Capacity scenario with ID '{id}' is not soft-deleted` |
| 422 | validation-error | Zodバリデーション失敗 | errors 配列にフィールド別詳細 |

## Testing Strategy

### Unit Tests

テストファイルの配置は既存パターンに従い `src/__tests__/` にソース構造をミラーする。

#### routes/capacityScenarios.test.ts
- GET / — 一覧取得（200、ページネーション検証、空リスト）
- GET /:id — 単一取得（200、404）
- POST / — 作成（201、Location ヘッダ、422 バリデーションエラー）
- PUT /:id — 更新（200、404、422）
- DELETE /:id — 削除（204、404、409 参照整合性）
- POST /:id/actions/restore — 復元（200、404）

#### services/capacityScenarioService.test.ts
- findAll — データ層呼び出しとTransform適用の検証
- findById — 正常系と404例外の検証
- create — 正常系の検証（FK存在チェックなし）
- update — 部分更新の検証
- delete — 参照チェックと409例外の検証
- restore — 削除状態チェックの検証

#### data/capacityScenarioData.test.ts
- findAll — SQL実行とページネーション
- findById — パラメータ化クエリの検証
- create — INSERT + findById の連携
- update — 動的SET句の生成
- softDelete / restore — deleted_at の操作
- hasReferences — EXISTS チェック

**テストパターン**:
- `vi.mock()` でサービス層・データ層をモック
- `app.request()` でHTTPリクエストをシミュレート
- mssql の `getPool` / `request` / `input` / `query` をモック

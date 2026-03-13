# API 仕様書

## 目次

1. [概要](#概要)
2. [実装状況サマリー](#実装状況サマリー)
3. [共通仕様](#共通仕様)
4. [マスタテーブル API](#マスタテーブル-api)
   - [Business Units API](#business-units-api)
   - [Project Types API](#project-types-api)
   - [Work Types API](#work-types-api)
5. [エンティティテーブル API](#エンティティテーブル-api)
   - [Projects API](#projects-api)
   - [Project Cases API](#project-cases-api)
   - [Headcount Plan Cases API](#headcount-plan-cases-api)
   - [Capacity Scenarios API](#capacity-scenarios-api)
   - [Indirect Work Cases API](#indirect-work-cases-api)
   - [Chart Views API](#chart-views-api)
   - [Standard Effort Masters API](#standard-effort-masters-api)
6. [ファクトテーブル API](#ファクトテーブル-api)
   - [Project Loads API](#project-loads-api)
   - [Monthly Headcount Plan API](#monthly-headcount-plan-api)
   - [Monthly Capacity API](#monthly-capacity-api)
   - [Monthly Indirect Work Load API](#monthly-indirect-work-load-api)
   - [Indirect Work Type Ratios API](#indirect-work-type-ratios-api)
   - [Standard Effort Weights API](#standard-effort-weights-api)（Masters に統合）
7. [関連テーブル API](#関連テーブル-api)
   - [Chart View Project Items API](#chart-view-project-items-api)
   - [Project Attachments API](#project-attachments-api)
   - [Project Change History API](#project-change-history-api)
8. [設定テーブル API](#設定テーブル-api)
   - [Chart Stack Order Settings API](#chart-stack-order-settings-api)
   - [Chart Color Settings API](#chart-color-settings-api)
   - [Chart Color Palettes API](#chart-color-palettes-api)

---

## 概要

- **フレームワーク**: Hono (Node.js)
- **バリデーション**: Zod + `@hono/zod-validator`
- **レスポンス形式**: 成功時 `application/json`、エラー時 `application/problem+json`（RFC 9457 準拠）
- **命名規則**: API レスポンスは camelCase、DB カラムは snake_case
- **論理削除**: マスタ・エンティティテーブルは `deleted_at` カラムによるソフトデリート
- **物理削除**: ファクト・関連・設定テーブルは物理削除（親テーブル削除時にカスケード）

---

## 実装状況サマリー

### テーブル別 CRUD API 実装状況

| # | テーブル名 | カテゴリ | 一覧 | 単一取得 | 作成 | 更新 | 削除 | 復元 | その他 | ステータス |
|---|----------|---------|:----:|:-------:|:----:|:----:|:----:|:----:|:-----:|:---------:|
| 1 | business_units | マスタ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | **実装済** |
| 2 | project_types | マスタ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | **実装済** |
| 3 | work_types | マスタ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | **実装済** |
| 4 | projects | エンティティ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | **実装済** |
| 5 | project_cases | エンティティ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | **実装済** |
| 6 | headcount_plan_cases | エンティティ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | **実装済** |
| 7 | capacity_scenarios | エンティティ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | **実装済** |
| 8 | indirect_work_cases | エンティティ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | **実装済** |
| 9 | chart_views | エンティティ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | **実装済** |
| 10 | standard_effort_masters | エンティティ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | フィルタ | **実装済** |
| 11 | project_load | ファクト | ✅ | ✅ | ✅ | ✅ | ✅ | - | Bulk Upsert | **実装済** |
| 12 | monthly_headcount_plan | ファクト | ✅ | ✅ | ✅ | ✅ | ✅ | - | Bulk Upsert | **実装済** |
| 13 | monthly_capacity | ファクト | ✅ | ✅ | ✅ | ✅ | ✅ | - | Bulk Upsert | **実装済** |
| 14 | monthly_indirect_work_load | ファクト | ✅ | ✅ | ✅ | ✅ | ✅ | - | Bulk Upsert | **実装済** |
| 15 | indirect_work_type_ratios | ファクト | ✅ | ✅ | ✅ | ✅ | ✅ | - | Bulk Upsert | **実装済** |
| 16 | standard_effort_weights | ファクト | - | - | - | - | - | - | Masters に統合 | **統合済** |
| 17 | chart_view_project_items | 関連 | ✅ | ✅ | ✅ | ✅ | ✅ | - | 一括表示順序更新 | **実装済** |
| 19 | project_attachments | 関連 | - | - | - | - | - | - | - | **未実装** |
| 20 | project_change_history | 関連 | ✅ | ✅ | ✅ | - | ✅ | - | - | **実装済** |
| 21 | chart_stack_order_settings | 設定 | - | - | - | - | - | - | - | **未実装** |
| 22 | chart_color_settings | 設定 | ✅ | ✅ | ✅ | ✅ | ✅ | - | Bulk Upsert | **実装済** |
| 23 | chart_color_palettes | 設定 | ✅ | ✅ | ✅ | ✅ | ✅ | - | - | **実装済** |

**実装済: 21/23 テーブル（91.3%）** ※ standard_effort_weights は standard_effort_masters に統合

### レイヤー構成

実装済みの各APIは以下の3層構成で実装されている:

| レイヤー | ディレクトリ | 役割 |
|---------|-----------|------|
| Route | `apps/backend/src/routes/` | エンドポイント定義・バリデーション |
| Service | `apps/backend/src/services/` | ビジネスロジック |
| Data | `apps/backend/src/data/` | DB アクセス・クエリ実行 |
| Transform | `apps/backend/src/transform/` | DB 行 → API レスポンスの変換 |

型定義は `apps/backend/src/types/` に配置（Zod スキーマ・DB 行型・API レスポンス型）。

---

## 共通仕様

### 成功時レスポンス構造

```json
{
  "data": { /* リソースオブジェクト or 配列 */ },
  "meta": {
    "pagination": {
      "currentPage": 1,
      "pageSize": 20,
      "totalItems": 100,
      "totalPages": 5
    }
  }
}
```

### ページネーションクエリ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `page[number]` | integer | 1 | ページ番号（1以上） |
| `page[size]` | integer | 20 | ページサイズ（1〜1000） |

### 論理削除フィルタ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `filter[includeDisabled]` | boolean | false | 論理削除済みレコードを含めるか |

### エラーレスポンス（RFC 9457 Problem Details）

```json
{
  "type": "https://example.com/problems/{problem-type}",
  "status": 422,
  "title": "Validation Error",
  "detail": "Request contains invalid parameters",
  "instance": "/business-units",
  "timestamp": "2025-01-22T10:30:00Z"
}
```

### 共通 HTTP ステータスコード

| ステータス | 用途 |
|-----------|------|
| 200 OK | 取得・更新成功 |
| 201 Created | 新規作成成功（`Location` ヘッダ付与） |
| 204 No Content | 削除成功 |
| 404 Not Found | リソース未存在 |
| 409 Conflict | 重複等の競合エラー |
| 422 Unprocessable Entity | バリデーションエラー |
| 500 Internal Server Error | サーバー内部エラー |

---

## マスタテーブル API

### Business Units API

ビジネスユニット（組織単位）の CRUD API

**ベースパス**: `/business-units`

#### エンドポイント一覧

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------|
| GET | `/business-units` | 一覧取得 | 200 |
| GET | `/business-units/:businessUnitCode` | 単一取得 | 200 |
| POST | `/business-units` | 新規作成 | 201 |
| PUT | `/business-units/:businessUnitCode` | 更新 | 200 |
| DELETE | `/business-units/:businessUnitCode` | 論理削除 | 204 |
| POST | `/business-units/:businessUnitCode/actions/restore` | 復元 | 200 |

#### GET /business-units - 一覧取得

**クエリパラメータ:**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|:----:|-----------|------|
| `page[number]` | integer | - | 1 | ページ番号 |
| `page[size]` | integer | - | 20 | ページサイズ（1〜1000） |
| `filter[includeDisabled]` | boolean | - | false | 論理削除済みを含むか |

**レスポンス（200）:**

```json
{
  "data": [
    {
      "businessUnitCode": "BU001",
      "name": "開発部",
      "displayOrder": 1,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "pageSize": 20,
      "totalItems": 5,
      "totalPages": 1
    }
  }
}
```

#### GET /business-units/:businessUnitCode - 単一取得

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `businessUnitCode` | string | ビジネスユニットコード |

**レスポンス（200）:**

```json
{
  "data": {
    "businessUnitCode": "BU001",
    "name": "開発部",
    "displayOrder": 1,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### POST /business-units - 新規作成

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `businessUnitCode` | string | ✅ | 1〜20文字, `/^[a-zA-Z0-9_-]+$/` | ビジネスユニットコード |
| `name` | string | ✅ | 1〜100文字 | ビジネスユニット名 |
| `displayOrder` | integer | - | 0以上, デフォルト0 | 表示順序 |

**レスポンス（201）:**

- `Location` ヘッダ: `/business-units/{businessUnitCode}`
- ボディ: `{ "data": { ... } }` （作成されたリソース）

#### PUT /business-units/:businessUnitCode - 更新

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `name` | string | ✅ | 1〜100文字 | ビジネスユニット名 |
| `displayOrder` | integer | - | 0以上 | 表示順序 |

**レスポンス（200）:** `{ "data": { ... } }` （更新されたリソース）

#### DELETE /business-units/:businessUnitCode - 論理削除

**レスポンス（204）:** ボディなし

#### POST /business-units/:businessUnitCode/actions/restore - 復元

**レスポンス（200）:** `{ "data": { ... } }` （復元されたリソース）

---

### Project Types API

案件タイプの CRUD API

**ベースパス**: `/project-types`

#### エンドポイント一覧

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------|
| GET | `/project-types` | 一覧取得 | 200 |
| GET | `/project-types/:projectTypeCode` | 単一取得 | 200 |
| POST | `/project-types` | 新規作成 | 201 |
| PUT | `/project-types/:projectTypeCode` | 更新 | 200 |
| DELETE | `/project-types/:projectTypeCode` | 論理削除 | 204 |
| POST | `/project-types/:projectTypeCode/actions/restore` | 復元 | 200 |

#### GET /project-types - 一覧取得

**クエリパラメータ:** [共通ページネーション](#ページネーションクエリ) + `filter[includeDisabled]`

**レスポンス（200）:**

```json
{
  "data": [
    {
      "projectTypeCode": "PT001",
      "name": "新規開発",
      "displayOrder": 1,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "pagination": { ... } }
}
```

#### POST /project-types - 新規作成

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `projectTypeCode` | string | ✅ | 1〜20文字, `/^[a-zA-Z0-9_-]+$/` | 案件タイプコード |
| `name` | string | ✅ | 1〜100文字 | 案件タイプ名 |
| `displayOrder` | integer | - | 0以上, デフォルト0 | 表示順序 |

#### PUT /project-types/:projectTypeCode - 更新

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `name` | string | ✅ | 1〜100文字 | 案件タイプ名 |
| `displayOrder` | integer | - | 0以上 | 表示順序 |

---

### Work Types API

作業種類（間接作業の分類）の CRUD API

**ベースパス**: `/work-types`

#### エンドポイント一覧

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------|
| GET | `/work-types` | 一覧取得 | 200 |
| GET | `/work-types/:workTypeCode` | 単一取得 | 200 |
| POST | `/work-types` | 新規作成 | 201 |
| PUT | `/work-types/:workTypeCode` | 更新 | 200 |
| DELETE | `/work-types/:workTypeCode` | 論理削除 | 204 |
| POST | `/work-types/:workTypeCode/actions/restore` | 復元 | 200 |

#### GET /work-types - 一覧取得

**クエリパラメータ:** [共通ページネーション](#ページネーションクエリ) + `filter[includeDisabled]`

**レスポンス（200）:**

```json
{
  "data": [
    {
      "workTypeCode": "WT001",
      "name": "教育・研修",
      "displayOrder": 1,
      "color": "#FF5733",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "pagination": { ... } }
}
```

#### POST /work-types - 新規作成

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `workTypeCode` | string | ✅ | 1〜20文字, `/^[a-zA-Z0-9_-]+$/` | 作業種類コード |
| `name` | string | ✅ | 1〜100文字 | 作業種類名 |
| `displayOrder` | integer | - | 0以上, デフォルト0 | 表示順序 |
| `color` | string \| null | - | `/^#[0-9a-fA-F]{6}$/` | カラーコード |

#### PUT /work-types/:workTypeCode - 更新

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `name` | string | ✅ | 1〜100文字 | 作業種類名 |
| `displayOrder` | integer | - | 0以上 | 表示順序 |
| `color` | string \| null | - | `/^#[0-9a-fA-F]{6}$/` | カラーコード |

---

## エンティティテーブル API

### Projects API

案件の CRUD API

**ベースパス**: `/projects`

#### エンドポイント一覧

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------|
| GET | `/projects` | 一覧取得 | 200 |
| GET | `/projects/:id` | 単一取得 | 200 |
| POST | `/projects` | 新規作成 | 201 |
| PUT | `/projects/:id` | 更新 | 200 |
| DELETE | `/projects/:id` | 論理削除 | 204 |
| POST | `/projects/:id/actions/restore` | 復元 | 200 |

#### GET /projects - 一覧取得

**クエリパラメータ:**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|:----:|-----------|------|
| `page[number]` | integer | - | 1 | ページ番号 |
| `page[size]` | integer | - | 20 | ページサイズ（1〜1000） |
| `filter[includeDisabled]` | boolean | - | false | 論理削除済みを含むか |
| `filter[businessUnitCodes]` | string | - | - | BUコードでフィルタ（カンマ区切りで複数指定可） |
| `filter[status]` | string | - | - | ステータスでフィルタ |

**レスポンス（200）:**

```json
{
  "data": [
    {
      "projectId": 1,
      "projectCode": "PRJ-001",
      "name": "システム刷新プロジェクト",
      "businessUnitCode": "BU001",
      "businessUnitName": "開発部",
      "projectTypeCode": "PT001",
      "projectTypeName": "新規開発",
      "startYearMonth": "202504",
      "totalManhour": 5000,
      "status": "active",
      "durationMonths": 12,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "pagination": { ... } }
}
```

#### POST /projects - 新規作成

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `projectCode` | string | ✅ | 1〜120文字 | 案件コード |
| `name` | string | ✅ | 1〜120文字 | 案件名 |
| `businessUnitCode` | string | ✅ | 1〜20文字, `/^[a-zA-Z0-9_-]+$/` | BUコード |
| `projectTypeCode` | string | - | 1〜20文字, `/^[a-zA-Z0-9_-]+$/` | 案件タイプコード |
| `startYearMonth` | string | ✅ | `/^\d{6}$/` | 開始年月（YYYYMM） |
| `totalManhour` | integer | ✅ | 正の整数 | 総工数（人時） |
| `status` | string | ✅ | 1〜20文字 | ステータス |
| `durationMonths` | integer | - | 正の整数 | 期間（月数） |

#### PUT /projects/:id - 更新

**リクエストボディ（部分更新、1つ以上のフィールドが必須）:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `projectCode` | string | - | 1〜120文字 | 案件コード |
| `name` | string | - | 1〜120文字 | 案件名 |
| `businessUnitCode` | string | - | 1〜20文字, `/^[a-zA-Z0-9_-]+$/` | BUコード |
| `projectTypeCode` | string \| null | - | 1〜20文字, `/^[a-zA-Z0-9_-]+$/` | 案件タイプコード |
| `startYearMonth` | string | - | `/^\d{6}$/` | 開始年月（YYYYMM） |
| `totalManhour` | integer | - | 正の整数 | 総工数（人時） |
| `status` | string | - | 1〜20文字 | ステータス |
| `durationMonths` | integer \| null | - | 正の整数 | 期間（月数） |

---

### Project Cases API

案件ケース（シナリオ）の CRUD API。Projects のサブリソース。

**ベースパス**: `/projects/:projectId/project-cases`

#### エンドポイント一覧

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------|
| GET | `/projects/:projectId/project-cases` | 一覧取得 | 200 |
| GET | `/projects/:projectId/project-cases/:projectCaseId` | 単一取得 | 200 |
| POST | `/projects/:projectId/project-cases` | 新規作成 | 201 |
| PUT | `/projects/:projectId/project-cases/:projectCaseId` | 更新 | 200 |
| DELETE | `/projects/:projectId/project-cases/:projectCaseId` | 論理削除 | 204 |
| POST | `/projects/:projectId/project-cases/:projectCaseId/actions/restore` | 復元 | 200 |

#### GET /projects/:projectId/project-cases - 一覧取得

**クエリパラメータ:** [共通ページネーション](#ページネーションクエリ) + `filter[includeDisabled]`

**レスポンス（200）:**

```json
{
  "data": [
    {
      "projectCaseId": 1,
      "projectId": 1,
      "caseName": "ベースケース",
      "isPrimary": true,
      "description": null,
      "calculationType": "MANUAL",
      "standardEffortId": null,
      "startYearMonth": "202504",
      "durationMonths": 12,
      "totalManhour": 5000,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "projectName": "システム刷新プロジェクト",
      "standardEffortName": null
    }
  ],
  "meta": { "pagination": { ... } }
}
```

#### POST /projects/:projectId/project-cases - 新規作成

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `caseName` | string | ✅ | 1〜100文字 | ケース名 |
| `isPrimary` | boolean | - | デフォルト false | プライマリケースフラグ |
| `description` | string | - | 最大500文字 | 説明 |
| `calculationType` | enum | - | `MANUAL` \| `STANDARD`, デフォルト `MANUAL` | 計算タイプ |
| `standardEffortId` | integer | - | 正の整数 | 標準工数マスタID |
| `startYearMonth` | string | - | `/^\d{6}$/` | 開始年月（YYYYMM） |
| `durationMonths` | integer | - | 正の整数 | 期間（月数） |
| `totalManhour` | integer | - | 0以上 | 総工数（人時） |

#### PUT /projects/:projectId/project-cases/:projectCaseId - 更新

**リクエストボディ（すべてオプション）:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `caseName` | string | - | 1〜100文字 | ケース名 |
| `isPrimary` | boolean | - | - | プライマリケースフラグ |
| `description` | string \| null | - | 最大500文字 | 説明 |
| `calculationType` | enum | - | `MANUAL` \| `STANDARD` | 計算タイプ |
| `standardEffortId` | integer \| null | - | 正の整数 | 標準工数マスタID |
| `startYearMonth` | string \| null | - | `/^\d{6}$/` | 開始年月（YYYYMM） |
| `durationMonths` | integer \| null | - | 正の整数 | 期間（月数） |
| `totalManhour` | integer \| null | - | 0以上 | 総工数（人時） |

---

### Headcount Plan Cases API

人員計画ケースの CRUD API

**ベースパス**: `/headcount-plan-cases`

#### エンドポイント一覧

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------|
| GET | `/headcount-plan-cases` | 一覧取得 | 200 |
| GET | `/headcount-plan-cases/:id` | 単一取得 | 200 |
| POST | `/headcount-plan-cases` | 新規作成 | 201 |
| PUT | `/headcount-plan-cases/:id` | 更新 | 200 |
| DELETE | `/headcount-plan-cases/:id` | 論理削除 | 204 |
| POST | `/headcount-plan-cases/:id/actions/restore` | 復元 | 200 |

#### GET /headcount-plan-cases - 一覧取得

**クエリパラメータ:** [共通ページネーション](#ページネーションクエリ) + `filter[includeDisabled]`

**レスポンス（200）:**

```json
{
  "data": [
    {
      "headcountPlanCaseId": 1,
      "caseName": "2025年度計画",
      "isPrimary": true,
      "description": null,
      "businessUnitCode": "BU001",
      "businessUnitName": "開発部",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "pagination": { ... } }
}
```

#### POST /headcount-plan-cases - 新規作成

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `caseName` | string | ✅ | 1〜100文字 | ケース名 |
| `isPrimary` | boolean | - | デフォルト false | プライマリケースフラグ |
| `description` | string \| null | - | 最大500文字 | 説明 |
| `businessUnitCode` | string \| null | - | 最大20文字, `/^[a-zA-Z0-9_-]+$/` | BUコード |

#### PUT /headcount-plan-cases/:id - 更新

**リクエストボディ（すべてオプション）:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `caseName` | string | - | 1〜100文字 | ケース名 |
| `isPrimary` | boolean | - | - | プライマリケースフラグ |
| `description` | string \| null | - | 最大500文字 | 説明 |
| `businessUnitCode` | string \| null | - | 最大20文字, `/^[a-zA-Z0-9_-]+$/` | BUコード |

---

### Capacity Scenarios API

キャパシティシナリオの CRUD API

**ベースパス**: `/capacity-scenarios`

#### エンドポイント一覧

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------|
| GET | `/capacity-scenarios` | 一覧取得 | 200 |
| GET | `/capacity-scenarios/:id` | 単一取得 | 200 |
| POST | `/capacity-scenarios` | 新規作成 | 201 |
| PUT | `/capacity-scenarios/:id` | 更新 | 200 |
| DELETE | `/capacity-scenarios/:id` | 論理削除 | 204 |
| POST | `/capacity-scenarios/:id/actions/restore` | 復元 | 200 |

#### GET /capacity-scenarios - 一覧取得

**クエリパラメータ:** [共通ページネーション](#ページネーションクエリ) + `filter[includeDisabled]`

**レスポンス（200）:**

```json
{
  "data": [
    {
      "capacityScenarioId": 1,
      "scenarioName": "ベースシナリオ",
      "isPrimary": true,
      "description": null,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "pagination": { ... } }
}
```

#### POST /capacity-scenarios - 新規作成

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `scenarioName` | string | ✅ | 1〜100文字 | シナリオ名 |
| `isPrimary` | boolean | - | デフォルト false | プライマリシナリオフラグ |
| `description` | string \| null | - | 最大500文字 | 説明 |

#### PUT /capacity-scenarios/:id - 更新

**リクエストボディ（すべてオプション）:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `scenarioName` | string | - | 1〜100文字 | シナリオ名 |
| `isPrimary` | boolean | - | - | プライマリシナリオフラグ |
| `description` | string \| null | - | 最大500文字 | 説明 |

---

### Indirect Work Cases API

間接作業計画ケースの CRUD API

**ベースパス**: `/indirect-work-cases`

#### エンドポイント一覧

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------|
| GET | `/indirect-work-cases` | 一覧取得 | 200 |
| GET | `/indirect-work-cases/:id` | 単一取得 | 200 |
| POST | `/indirect-work-cases` | 新規作成 | 201 |
| PUT | `/indirect-work-cases/:id` | 更新 | 200 |
| DELETE | `/indirect-work-cases/:id` | 論理削除 | 204 |
| POST | `/indirect-work-cases/:id/actions/restore` | 復元 | 200 |

#### GET /indirect-work-cases - 一覧取得

**クエリパラメータ:** [共通ページネーション](#ページネーションクエリ) + `filter[includeDisabled]`

**レスポンス（200）:**

```json
{
  "data": [
    {
      "indirectWorkCaseId": 1,
      "caseName": "2025年度間接作業",
      "isPrimary": true,
      "description": null,
      "businessUnitCode": "BU001",
      "businessUnitName": "開発部",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "pagination": { ... } }
}
```

#### POST /indirect-work-cases - 新規作成

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `caseName` | string | ✅ | 1〜100文字 | ケース名 |
| `isPrimary` | boolean | - | デフォルト false | プライマリケースフラグ |
| `description` | string \| null | - | 最大500文字 | 説明 |
| `businessUnitCode` | string | ✅ | 1〜20文字, `/^[a-zA-Z0-9_-]+$/` | BUコード |

#### PUT /indirect-work-cases/:id - 更新

**リクエストボディ（すべてオプション）:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `caseName` | string | - | 1〜100文字 | ケース名 |
| `isPrimary` | boolean | - | - | プライマリケースフラグ |
| `description` | string \| null | - | 最大500文字 | 説明 |
| `businessUnitCode` | string | - | 1〜20文字, `/^[a-zA-Z0-9_-]+$/` | BUコード |

---

### Chart Views API

チャート表示設定の CRUD API

**ベースパス**: `/chart-views`

#### エンドポイント一覧

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------|
| GET | `/chart-views` | 一覧取得 | 200 |
| GET | `/chart-views/:id` | 単一取得 | 200 |
| POST | `/chart-views` | 新規作成 | 201 |
| PUT | `/chart-views/:id` | 更新 | 200 |
| DELETE | `/chart-views/:id` | 論理削除 | 204 |
| POST | `/chart-views/:id/actions/restore` | 復元 | 200 |

#### GET /chart-views - 一覧取得

**クエリパラメータ:** [共通ページネーション](#ページネーションクエリ) + `filter[includeDisabled]`

**レスポンス（200）:**

```json
{
  "data": [
    {
      "chartViewId": 1,
      "viewName": "デフォルトビュー",
      "chartType": "stacked_bar",
      "startYearMonth": "202501",
      "endYearMonth": "202612",
      "isDefault": true,
      "description": null,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "pagination": { ... } }
}
```

#### POST /chart-views - 新規作成

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `viewName` | string | ✅ | 1〜100文字 | ビュー名 |
| `chartType` | string | ✅ | 1〜50文字 | チャートタイプ |
| `startYearMonth` | string | ✅ | YYYYMM形式（6桁数字） | 表示開始年月 |
| `endYearMonth` | string | ✅ | YYYYMM形式（6桁数字）, `>= startYearMonth` | 表示終了年月 |
| `isDefault` | boolean | - | デフォルト false | デフォルトビューフラグ |
| `description` | string \| null | - | 最大500文字 | 説明 |

#### PUT /chart-views/:id - 更新

**リクエストボディ（すべてオプション）:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `viewName` | string | - | 1〜100文字 | ビュー名 |
| `chartType` | string | - | 1〜50文字 | チャートタイプ |
| `startYearMonth` | string | - | YYYYMM形式 | 表示開始年月 |
| `endYearMonth` | string | - | YYYYMM形式 | 表示終了年月 |
| `isDefault` | boolean | - | - | デフォルトビューフラグ |
| `description` | string \| null | - | 最大500文字 | 説明 |

---

### Standard Effort Masters API

BU × 案件タイプごとの標準工数パターンを管理する API。`standard_effort_weights` は本 API にネスト管理される。

**ベースパス**: `/standard-effort-masters`

**特記事項:**
- エンティティテーブルのため論理削除/復元あり
- `standard_effort_weights`（進捗度別重み値）はマスタ詳細に含まれるネストリソース
- `filter[businessUnitCode]`、`filter[projectTypeCode]` によるフィルタリング対応

#### エンドポイント一覧

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------:|
| GET | `/standard-effort-masters` | 一覧取得 | 200 |
| GET | `/standard-effort-masters/:id` | 単一取得（weights 含む） | 200 |
| POST | `/standard-effort-masters` | 新規作成 | 201 |
| PUT | `/standard-effort-masters/:id` | 更新 | 200 |
| DELETE | `/standard-effort-masters/:id` | 論理削除 | 204 |
| POST | `/standard-effort-masters/:id/actions/restore` | 復元 | 200 |

#### GET /standard-effort-masters - 一覧取得

**クエリパラメータ:**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|:----:|-----------|------|
| `page[number]` | integer | - | 1 | ページ番号 |
| `page[size]` | integer | - | 20 | ページサイズ（1〜1000） |
| `filter[includeDisabled]` | boolean | - | false | 論理削除済みを含むか |
| `filter[businessUnitCode]` | string | - | - | BUコードでフィルタ |
| `filter[projectTypeCode]` | string | - | - | 案件タイプコードでフィルタ |

**レスポンス（200）:**

```json
{
  "data": [
    {
      "standardEffortId": 1,
      "businessUnitCode": "BU001",
      "projectTypeCode": "PT001",
      "name": "標準工数パターンA",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "pageSize": 20,
      "totalItems": 5,
      "totalPages": 1
    }
  }
}
```

#### GET /standard-effort-masters/:id - 単一取得

**レスポンス（200）:**

```json
{
  "data": {
    "standardEffortId": 1,
    "businessUnitCode": "BU001",
    "projectTypeCode": "PT001",
    "name": "標準工数パターンA",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "weights": [
      {
        "standardEffortWeightId": 1,
        "progressRate": 10,
        "weight": 5
      },
      {
        "standardEffortWeightId": 2,
        "progressRate": 50,
        "weight": 30
      }
    ]
  }
}
```

#### POST /standard-effort-masters - 新規作成

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `businessUnitCode` | string | ✅ | 1〜20文字, `/^[a-zA-Z0-9_-]+$/` | BUコード |
| `projectTypeCode` | string | ✅ | 1〜20文字, `/^[a-zA-Z0-9_-]+$/` | 案件タイプコード |
| `name` | string | ✅ | 1〜100文字 | パターン名 |
| `weights` | array | - | - | 進捗度別重み配列 |
| `weights[].progressRate` | integer | ✅ | 0〜100 | 進捗率（%） |
| `weights[].weight` | integer | ✅ | 0以上 | 重み値 |

**レスポンス（201）:**

- `Location` ヘッダ: `/standard-effort-masters/{standardEffortId}`
- ボディ: `{ "data": { ... } }` （作成されたリソース、weights 含む）

#### PUT /standard-effort-masters/:id - 更新

**リクエストボディ（すべてオプション）:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `name` | string | - | 1〜100文字 | パターン名 |
| `weights` | array | - | - | 進捗度別重み配列（上書き） |

#### DELETE /standard-effort-masters/:id - 論理削除

**レスポンス（204）:** ボディなし

#### POST /standard-effort-masters/:id/actions/restore - 復元

**レスポンス（200）:** `{ "data": { ... } }` （復元されたリソース）

---

## ファクトテーブル API

### Project Loads API

案件ケースの月次負荷データの CRUD API。Project Cases のサブリソース。

**ベースパス**: `/project-cases/:projectCaseId/project-loads`

**特記事項:**
- ファクトテーブルのため物理削除（論理削除/復元なし）
- ページネーションなし（全件取得）
- Bulk Upsert エンドポイントあり

#### エンドポイント一覧

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------|
| GET | `/project-cases/:projectCaseId/project-loads` | 一覧取得 | 200 |
| GET | `/project-cases/:projectCaseId/project-loads/:projectLoadId` | 単一取得 | 200 |
| POST | `/project-cases/:projectCaseId/project-loads` | 新規作成 | 201 |
| PUT | `/project-cases/:projectCaseId/project-loads/:projectLoadId` | 更新 | 200 |
| PUT | `/project-cases/:projectCaseId/project-loads/bulk` | バルク Upsert | 200 |
| DELETE | `/project-cases/:projectCaseId/project-loads/:projectLoadId` | 物理削除 | 204 |

#### GET /project-cases/:projectCaseId/project-loads - 一覧取得

**レスポンス（200）:**

```json
{
  "data": [
    {
      "projectLoadId": 1,
      "projectCaseId": 1,
      "yearMonth": "202504",
      "manhour": 100.50,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /project-cases/:projectCaseId/project-loads - 新規作成

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `yearMonth` | string | ✅ | YYYYMM形式（月は01〜12） | 年月 |
| `manhour` | number | ✅ | 0〜99999999.99 | 工数（人時） |

#### PUT /project-cases/:projectCaseId/project-loads/:projectLoadId - 更新

**リクエストボディ（すべてオプション）:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `yearMonth` | string | - | YYYYMM形式（月は01〜12） | 年月 |
| `manhour` | number | - | 0〜99999999.99 | 工数（人時） |

#### PUT /project-cases/:projectCaseId/project-loads/bulk - バルク Upsert

**リクエストボディ:**

```json
{
  "items": [
    { "yearMonth": "202504", "manhour": 100.50 },
    { "yearMonth": "202505", "manhour": 200.00 }
  ]
}
```

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `items` | array | ✅ | 1件以上 | Upsert対象のアイテム配列 |
| `items[].yearMonth` | string | ✅ | YYYYMM形式（月は01〜12） | 年月 |
| `items[].manhour` | number | ✅ | 0〜99999999.99 | 工数（人時） |

---

### Monthly Headcount Plan API

月次人員計画データを管理する API。Headcount Plan Cases のサブリソース。

**ベースパス**: `/headcount-plan-cases/:headcountPlanCaseId/monthly-headcount-plans`

**特記事項:**
- ファクトテーブルのため物理削除（論理削除/復元なし）
- ページネーションなし（全件取得）
- Bulk Upsert エンドポイントあり
- `businessUnitCode` クエリパラメータによるフィルタリング対応

#### エンドポイント一覧

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------:|
| GET | `…/monthly-headcount-plans` | 一覧取得 | 200 |
| GET | `…/monthly-headcount-plans/:monthlyHeadcountPlanId` | 単一取得 | 200 |
| POST | `…/monthly-headcount-plans` | 新規作成 | 201 |
| PUT | `…/monthly-headcount-plans/:monthlyHeadcountPlanId` | 更新 | 200 |
| PUT | `…/monthly-headcount-plans/bulk` | バルク Upsert | 200 |
| DELETE | `…/monthly-headcount-plans/:monthlyHeadcountPlanId` | 物理削除 | 204 |

#### GET - 一覧取得

**クエリパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|:----:|------|
| `businessUnitCode` | string | - | BUコードでフィルタ |

**レスポンス（200）:**

```json
{
  "data": [
    {
      "monthlyHeadcountPlanId": 1,
      "headcountPlanCaseId": 1,
      "businessUnitCode": "BU001",
      "yearMonth": "202504",
      "headcount": 10,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST - 新規作成

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `businessUnitCode` | string | ✅ | 1〜20文字 | BUコード |
| `yearMonth` | string | ✅ | YYYYMM形式（月は01〜12） | 年月 |
| `headcount` | integer | ✅ | 0以上の整数 | 人員数 |

#### PUT /:monthlyHeadcountPlanId - 更新

**リクエストボディ（すべてオプション）:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `businessUnitCode` | string | - | 1〜20文字 | BUコード |
| `yearMonth` | string | - | YYYYMM形式（月は01〜12） | 年月 |
| `headcount` | integer | - | 0以上の整数 | 人員数 |

#### PUT /bulk - バルク Upsert

**リクエストボディ:**

```json
{
  "items": [
    { "businessUnitCode": "BU001", "yearMonth": "202504", "headcount": 10 },
    { "businessUnitCode": "BU001", "yearMonth": "202505", "headcount": 12 }
  ]
}
```

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `items` | array | ✅ | 1件以上 | Upsert対象のアイテム配列 |
| `items[].businessUnitCode` | string | ✅ | 1〜20文字 | BUコード |
| `items[].yearMonth` | string | ✅ | YYYYMM形式（月は01〜12） | 年月 |
| `items[].headcount` | integer | ✅ | 0以上の整数 | 人員数 |

---

### Monthly Capacity API

月次キャパシティデータを管理する API。Capacity Scenarios のサブリソース。

**ベースパス**: `/capacity-scenarios/:capacityScenarioId/monthly-capacities`

**特記事項:**
- ファクトテーブルのため物理削除（論理削除/復元なし）
- ページネーションなし（全件取得）
- Bulk Upsert エンドポイントあり

#### エンドポイント一覧

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------:|
| GET | `…/monthly-capacities` | 一覧取得 | 200 |
| GET | `…/monthly-capacities/:monthlyCapacityId` | 単一取得 | 200 |
| POST | `…/monthly-capacities` | 新規作成 | 201 |
| PUT | `…/monthly-capacities/:monthlyCapacityId` | 更新 | 200 |
| PUT | `…/monthly-capacities/bulk` | バルク Upsert | 200 |
| DELETE | `…/monthly-capacities/:monthlyCapacityId` | 物理削除 | 204 |

#### GET - 一覧取得

**レスポンス（200）:**

```json
{
  "data": [
    {
      "monthlyCapacityId": 1,
      "capacityScenarioId": 1,
      "businessUnitCode": "BU001",
      "yearMonth": "202504",
      "capacity": 1600.00,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST - 新規作成

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `businessUnitCode` | string | ✅ | 1〜20文字 | BUコード |
| `yearMonth` | string | ✅ | YYYYMM形式（月は01〜12） | 年月 |
| `capacity` | number | ✅ | 0〜99999999.99 | キャパシティ（人時） |

#### PUT /:monthlyCapacityId - 更新

**リクエストボディ（すべてオプション）:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `businessUnitCode` | string | - | 1〜20文字 | BUコード |
| `yearMonth` | string | - | YYYYMM形式（月は01〜12） | 年月 |
| `capacity` | number | - | 0〜99999999.99 | キャパシティ（人時） |

#### PUT /bulk - バルク Upsert

**リクエストボディ:**

```json
{
  "items": [
    { "businessUnitCode": "BU001", "yearMonth": "202504", "capacity": 1600.00 },
    { "businessUnitCode": "BU001", "yearMonth": "202505", "capacity": 1600.00 }
  ]
}
```

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `items` | array | ✅ | 1件以上 | Upsert対象のアイテム配列 |
| `items[].businessUnitCode` | string | ✅ | 1〜20文字 | BUコード |
| `items[].yearMonth` | string | ✅ | YYYYMM形式（月は01〜12） | 年月 |
| `items[].capacity` | number | ✅ | 0〜99999999.99 | キャパシティ（人時） |

---

### Monthly Indirect Work Load API

月次間接作業負荷データを管理する API。Indirect Work Cases のサブリソース。

**ベースパス**: `/indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads`

**特記事項:**
- ファクトテーブルのため物理削除（論理削除/復元なし）
- ページネーションなし（全件取得）
- Bulk Upsert エンドポイントあり
- `source` フィールドで算出方法を区別（`calculated` / `manual`）

#### エンドポイント一覧

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------:|
| GET | `…/monthly-indirect-work-loads` | 一覧取得 | 200 |
| GET | `…/monthly-indirect-work-loads/:monthlyIndirectWorkLoadId` | 単一取得 | 200 |
| POST | `…/monthly-indirect-work-loads` | 新規作成 | 201 |
| PUT | `…/monthly-indirect-work-loads/:monthlyIndirectWorkLoadId` | 更新 | 200 |
| PUT | `…/monthly-indirect-work-loads/bulk` | バルク Upsert | 200 |
| DELETE | `…/monthly-indirect-work-loads/:monthlyIndirectWorkLoadId` | 物理削除 | 204 |

#### GET - 一覧取得

**レスポンス（200）:**

```json
{
  "data": [
    {
      "monthlyIndirectWorkLoadId": 1,
      "indirectWorkCaseId": 1,
      "businessUnitCode": "BU001",
      "yearMonth": "202504",
      "manhour": 200.00,
      "source": "manual",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST - 新規作成

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `businessUnitCode` | string | ✅ | 1〜20文字 | BUコード |
| `yearMonth` | string | ✅ | YYYYMM形式（月は01〜12） | 年月 |
| `manhour` | number | ✅ | 0〜99999999.99 | 工数（人時） |
| `source` | enum | ✅ | `calculated` \| `manual` | データソース区分 |

#### PUT /:monthlyIndirectWorkLoadId - 更新

**リクエストボディ（すべてオプション）:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `businessUnitCode` | string | - | 1〜20文字 | BUコード |
| `yearMonth` | string | - | YYYYMM形式（月は01〜12） | 年月 |
| `manhour` | number | - | 0〜99999999.99 | 工数（人時） |
| `source` | enum | - | `calculated` \| `manual` | データソース区分 |

#### PUT /bulk - バルク Upsert

**リクエストボディ:**

```json
{
  "items": [
    { "businessUnitCode": "BU001", "yearMonth": "202504", "manhour": 200.00, "source": "manual" },
    { "businessUnitCode": "BU001", "yearMonth": "202505", "manhour": 180.50, "source": "calculated" }
  ]
}
```

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `items` | array | ✅ | 1件以上 | Upsert対象のアイテム配列 |
| `items[].businessUnitCode` | string | ✅ | 1〜20文字 | BUコード |
| `items[].yearMonth` | string | ✅ | YYYYMM形式（月は01〜12） | 年月 |
| `items[].manhour` | number | ✅ | 0〜99999999.99 | 工数（人時） |
| `items[].source` | enum | ✅ | `calculated` \| `manual` | データソース区分 |

---

### Indirect Work Type Ratios API

間接作業の種別ごとの配分比率を管理する API。Indirect Work Cases のサブリソース。

**ベースパス**: `/indirect-work-cases/:indirectWorkCaseId/indirect-work-type-ratios`

**特記事項:**
- ファクトテーブルのため物理削除（論理削除/復元なし）
- ページネーションなし（全件取得）
- Bulk Upsert エンドポイントあり

#### エンドポイント一覧

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------:|
| GET | `…/indirect-work-type-ratios` | 一覧取得 | 200 |
| GET | `…/indirect-work-type-ratios/:indirectWorkTypeRatioId` | 単一取得 | 200 |
| POST | `…/indirect-work-type-ratios` | 新規作成 | 201 |
| PUT | `…/indirect-work-type-ratios/:indirectWorkTypeRatioId` | 更新 | 200 |
| PUT | `…/indirect-work-type-ratios/bulk` | バルク Upsert | 200 |
| DELETE | `…/indirect-work-type-ratios/:indirectWorkTypeRatioId` | 物理削除 | 204 |

#### GET - 一覧取得

**レスポンス（200）:**

```json
{
  "data": [
    {
      "indirectWorkTypeRatioId": 1,
      "indirectWorkCaseId": 1,
      "workTypeCode": "WT001",
      "fiscalYear": 2025,
      "ratio": 0.30,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST - 新規作成

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `workTypeCode` | string | ✅ | 最大20文字 | 作業種類コード |
| `fiscalYear` | integer | ✅ | 整数 | 年度 |
| `ratio` | number | ✅ | 0.0〜1.0 | 配分比率 |

#### PUT /:indirectWorkTypeRatioId - 更新

**リクエストボディ（すべてオプション）:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `workTypeCode` | string | - | 最大20文字 | 作業種類コード |
| `fiscalYear` | integer | - | 整数 | 年度 |
| `ratio` | number | - | 0.0〜1.0 | 配分比率 |

#### PUT /bulk - バルク Upsert

**リクエストボディ:**

```json
{
  "items": [
    { "workTypeCode": "WT001", "fiscalYear": 2025, "ratio": 0.30 },
    { "workTypeCode": "WT002", "fiscalYear": 2025, "ratio": 0.20 }
  ]
}
```

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `items` | array | ✅ | 1件以上 | Upsert対象のアイテム配列 |
| `items[].workTypeCode` | string | ✅ | 最大20文字 | 作業種類コード |
| `items[].fiscalYear` | integer | ✅ | 整数 | 年度 |
| `items[].ratio` | number | ✅ | 0.0〜1.0 | 配分比率 |

---

### Standard Effort Weights API

> **ステータス: Standard Effort Masters API に統合**

`standard_effort_weights` テーブルのデータは [Standard Effort Masters API](#standard-effort-masters-api) の `weights` フィールドとしてネスト管理される。
個別の CRUD エンドポイントは提供しない。

---

## 関連テーブル API

### Chart View Project Items API

チャートビューに含まれる案件項目を管理する API。Chart Views のサブリソース。

**ベースパス**: `/chart-views/:chartViewId/project-items`

**特記事項:**
- 関連テーブルのため物理削除（論理削除/復元なし）
- ページネーションなし（全件取得）
- 一括表示順序更新エンドポイントあり
- プロジェクト情報（projectCode, projectName）を JOIN して返却

#### エンドポイント一覧

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------:|
| GET | `…/project-items` | 一覧取得 | 200 |
| GET | `…/project-items/:id` | 単一取得 | 200 |
| POST | `…/project-items` | 新規作成 | 201 |
| PUT | `…/project-items/:id` | 更新 | 200 |
| PUT | `…/project-items/display-order` | 一括表示順序更新 | 200 |
| DELETE | `…/project-items/:id` | 物理削除 | 204 |

#### GET - 一覧取得

**レスポンス（200）:**

```json
{
  "data": [
    {
      "chartViewProjectItemId": 1,
      "chartViewId": 1,
      "projectId": 1,
      "projectCaseId": 1,
      "displayOrder": 0,
      "isVisible": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "project": {
        "projectCode": "PRJ-001",
        "projectName": "システム刷新プロジェクト"
      },
      "projectCase": {
        "caseName": "ベースケース"
      }
    }
  ]
}
```

#### POST - 新規作成

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `projectId` | integer | ✅ | 正の整数 | 案件ID |
| `projectCaseId` | integer \| null | - | 正の整数 | 案件ケースID |
| `displayOrder` | integer | - | 0以上, デフォルト0 | 表示順序 |
| `isVisible` | boolean | - | デフォルト true | 表示フラグ |

#### PUT /:id - 更新

**リクエストボディ（すべてオプション、projectId は変更不可）:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `projectCaseId` | integer \| null | - | 正の整数 | 案件ケースID |
| `displayOrder` | integer | - | 0以上 | 表示順序 |
| `isVisible` | boolean | - | - | 表示フラグ |

#### PUT /display-order - 一括表示順序更新

**リクエストボディ:**

```json
{
  "items": [
    { "chartViewProjectItemId": 1, "displayOrder": 0 },
    { "chartViewProjectItemId": 2, "displayOrder": 1 }
  ]
}
```

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `items` | array | ✅ | 1件以上 | 更新対象の配列 |
| `items[].chartViewProjectItemId` | integer | ✅ | 正の整数 | 項目ID |
| `items[].displayOrder` | integer | ✅ | 0以上 | 表示順序 |

---

### Chart View Indirect Work Items API

チャートビューに含まれる間接作業項目を管理する API。Chart Views のサブリソース。

**ベースパス**: `/chart-views/:chartViewId/indirect-work-items`

**特記事項:**
- 関連テーブルのため物理削除（論理削除/復元なし）
- ページネーションなし（全件取得）
- ケース名を JOIN して返却

#### エンドポイント一覧

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------:|
| GET | `…/indirect-work-items` | 一覧取得 | 200 |
| GET | `…/indirect-work-items/:chartViewIndirectWorkItemId` | 単一取得 | 200 |
| POST | `…/indirect-work-items` | 新規作成 | 201 |
| PUT | `…/indirect-work-items/:chartViewIndirectWorkItemId` | 更新 | 200 |
| DELETE | `…/indirect-work-items/:chartViewIndirectWorkItemId` | 物理削除 | 204 |

#### GET - 一覧取得

**レスポンス（200）:**

```json
{
  "data": [
    {
      "chartViewIndirectWorkItemId": 1,
      "chartViewId": 1,
      "indirectWorkCaseId": 1,
      "caseName": "2025年度間接作業",
      "displayOrder": 0,
      "isVisible": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST - 新規作成

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `indirectWorkCaseId` | integer | ✅ | 正の整数 | 間接作業ケースID |
| `displayOrder` | integer | - | 0以上, デフォルト0 | 表示順序 |
| `isVisible` | boolean | - | デフォルト true | 表示フラグ |

#### PUT /:chartViewIndirectWorkItemId - 更新

**リクエストボディ（すべてオプション）:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `displayOrder` | integer | - | 0以上 | 表示順序 |
| `isVisible` | boolean | - | - | 表示フラグ |

---

### Project Attachments API

> **ステータス: 未実装**

案件に添付されたファイル情報を管理する API。
対応テーブル: `project_attachments`

---

### Project Change History API

案件の変更履歴を記録する API。Projects のサブリソース。

**ベースパス**: `/projects/:projectId/change-history`

**特記事項:**
- 関連テーブルのため物理削除（論理削除/復元なし）
- ページネーションなし（全件取得）
- 更新（PUT）エンドポイントなし（履歴は書き換え不可）

#### エンドポイント一覧

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------:|
| GET | `…/change-history` | 一覧取得 | 200 |
| GET | `…/change-history/:projectChangeHistoryId` | 単一取得 | 200 |
| POST | `…/change-history` | 新規作成 | 201 |
| DELETE | `…/change-history/:projectChangeHistoryId` | 物理削除 | 204 |

#### GET - 一覧取得

**レスポンス（200）:**

```json
{
  "data": [
    {
      "projectChangeHistoryId": 1,
      "projectId": 1,
      "changeType": "update",
      "fieldName": "status",
      "oldValue": "draft",
      "newValue": "active",
      "changedBy": "user@example.com",
      "changedAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

#### POST - 新規作成

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `changeType` | string | ✅ | 1〜50文字 | 変更種別（create, update, delete 等） |
| `fieldName` | string | - | 最大100文字 | 変更フィールド名 |
| `oldValue` | string | - | 最大1000文字 | 変更前の値 |
| `newValue` | string | - | 最大1000文字 | 変更後の値 |
| `changedBy` | string | ✅ | 1〜100文字 | 変更者 |

---

## 設定テーブル API

### Chart Stack Order Settings API

> **ステータス: 未実装**

チャートの積み上げ表示順序を管理する API。
対応テーブル: `chart_stack_order_settings`

---

### Chart Color Settings API

チャートの各要素（案件/間接作業）に割り当てる色を管理する API。

**ベースパス**: `/chart-color-settings`

**特記事項:**
- 設定テーブルのため物理削除（論理削除/復元なし）
- `filter[targetType]` によるフィルタリング対応（`project` / `indirect_work`）
- ページネーション対応
- Bulk Upsert エンドポイントあり

#### エンドポイント一覧

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------:|
| GET | `/chart-color-settings` | 一覧取得 | 200 |
| GET | `/chart-color-settings/:id` | 単一取得 | 200 |
| POST | `/chart-color-settings` | 新規作成 | 201 |
| PUT | `/chart-color-settings/:id` | 更新 | 200 |
| PUT | `/chart-color-settings/bulk` | 一括 Upsert | 200 |
| DELETE | `/chart-color-settings/:id` | 物理削除 | 204 |

#### GET /chart-color-settings - 一覧取得

**クエリパラメータ:**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|:----:|-----------|------|
| `page[number]` | integer | - | 1 | ページ番号 |
| `page[size]` | integer | - | 20 | ページサイズ（1〜1000） |
| `filter[targetType]` | enum | - | - | 対象タイプ（`project` \| `indirect_work`） |

**レスポンス（200）:**

```json
{
  "data": [
    {
      "chartColorSettingId": 1,
      "targetType": "project",
      "targetId": 1,
      "colorCode": "#FF5733",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "pageSize": 20,
      "totalItems": 10,
      "totalPages": 1
    }
  }
}
```

#### POST /chart-color-settings - 新規作成

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `targetType` | enum | ✅ | `project` \| `indirect_work` | 対象タイプ |
| `targetId` | integer | ✅ | 正の整数 | 対象ID |
| `colorCode` | string | ✅ | `/^#[0-9A-Fa-f]{6}$/` | カラーコード |

#### PUT /chart-color-settings/:id - 更新

**リクエストボディ（すべてオプション）:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `targetType` | enum | - | `project` \| `indirect_work` | 対象タイプ |
| `targetId` | integer | - | 正の整数 | 対象ID |
| `colorCode` | string | - | `/^#[0-9A-Fa-f]{6}$/` | カラーコード |

#### PUT /chart-color-settings/bulk - 一括 Upsert

**リクエストボディ:**

```json
{
  "items": [
    { "targetType": "project", "targetId": 1, "colorCode": "#FF5733" },
    { "targetType": "indirect_work", "targetId": 2, "colorCode": "#3357FF" }
  ]
}
```

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `items` | array | ✅ | 1件以上 | Upsert対象のアイテム配列 |
| `items[].targetType` | enum | ✅ | `project` \| `indirect_work` | 対象タイプ |
| `items[].targetId` | integer | ✅ | 正の整数 | 対象ID |
| `items[].colorCode` | string | ✅ | `/^#[0-9A-Fa-f]{6}$/` | カラーコード |

---

### Chart Color Palettes API

チャート表示で使用する色の定義を管理する API。

**ベースパス**: `/chart-color-palettes`

**特記事項:**
- 設定テーブルのため物理削除（論理削除/復元なし）
- ページネーションなし（全件取得）

#### エンドポイント一覧

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------:|
| GET | `/chart-color-palettes` | 一覧取得 | 200 |
| GET | `/chart-color-palettes/:paletteId` | 単一取得 | 200 |
| POST | `/chart-color-palettes` | 新規作成 | 201 |
| PUT | `/chart-color-palettes/:paletteId` | 更新 | 200 |
| DELETE | `/chart-color-palettes/:paletteId` | 物理削除 | 204 |

#### GET /chart-color-palettes - 一覧取得

**レスポンス（200）:**

```json
{
  "data": [
    {
      "chartColorPaletteId": 1,
      "name": "ブルー",
      "colorCode": "#3357FF",
      "displayOrder": 0,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /chart-color-palettes - 新規作成

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `name` | string | ✅ | 1〜100文字 | パレット名 |
| `colorCode` | string | ✅ | `/^#[0-9A-Fa-f]{6}$/` | カラーコード |
| `displayOrder` | integer | - | 整数, デフォルト0 | 表示順序 |

#### PUT /chart-color-palettes/:paletteId - 更新

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `name` | string | ✅ | 1〜100文字 | パレット名 |
| `colorCode` | string | ✅ | `/^#[0-9A-Fa-f]{6}$/` | カラーコード |
| `displayOrder` | integer | - | 整数 | 表示順序 |

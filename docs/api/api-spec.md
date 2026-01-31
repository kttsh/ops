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
   - [Standard Effort Weights API](#standard-effort-weights-api)
7. [関連テーブル API](#関連テーブル-api)
   - [Chart View Project Items API](#chart-view-project-items-api)
   - [Chart View Indirect Work Items API](#chart-view-indirect-work-items-api)
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
| 10 | standard_effort_masters | エンティティ | - | - | - | - | - | - | - | **未実装** |
| 11 | project_load | ファクト | ✅ | ✅ | ✅ | ✅ | ✅ | - | Bulk Upsert | **実装済** |
| 12 | monthly_headcount_plan | ファクト | - | - | - | - | - | - | - | **未実装** |
| 13 | monthly_capacity | ファクト | - | - | - | - | - | - | - | **未実装** |
| 14 | monthly_indirect_work_load | ファクト | - | - | - | - | - | - | - | **未実装** |
| 15 | indirect_work_type_ratios | ファクト | - | - | - | - | - | - | - | **未実装** |
| 16 | standard_effort_weights | ファクト | - | - | - | - | - | - | - | **未実装** |
| 17 | chart_view_project_items | 関連 | - | - | - | - | - | - | - | **未実装** |
| 18 | chart_view_indirect_work_items | 関連 | - | - | - | - | - | - | - | **未実装** |
| 19 | project_attachments | 関連 | - | - | - | - | - | - | - | **未実装** |
| 20 | project_change_history | 関連 | - | - | - | - | - | - | - | **未実装** |
| 21 | chart_stack_order_settings | 設定 | - | - | - | - | - | - | - | **未実装** |
| 22 | chart_color_settings | 設定 | - | - | - | - | - | - | - | **未実装** |
| 23 | chart_color_palettes | 設定 | - | - | - | - | - | - | - | **未実装** |

**実装済: 11/23 テーブル（47.8%）**

### レイヤー構成

実装済みの各APIは以下の3層構成で実装されている:

| レイヤー | ディレクトリ | 役割 |
|---------|-----------|------|
| Route | `apps/backend/src/routes/` | エンドポイント定義・バリデーション |
| Service | `apps/backend/src/services/` | ビジネスロジック |
| Data | `apps/backend/src/data/` | DB アクセス・クエリ実行 |

型定義は `apps/backend/src/types/` に配置。

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
| `filter[businessUnitCode]` | string | - | - | BUコードでフィルタ |
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

> **ステータス: 未実装**

BU × 案件タイプごとの標準工数パターンを管理する API。
対応テーブル: `standard_effort_masters`

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

> **ステータス: 未実装**

月次人員計画データを管理する API。
対応テーブル: `monthly_headcount_plan`

---

### Monthly Capacity API

> **ステータス: 未実装**

月次キャパシティデータを管理する API。
対応テーブル: `monthly_capacity`

---

### Monthly Indirect Work Load API

> **ステータス: 未実装**

月次間接作業負荷データを管理する API。
対応テーブル: `monthly_indirect_work_load`

---

### Indirect Work Type Ratios API

> **ステータス: 未実装**

間接作業の種別ごとの配分比率を管理する API。
対応テーブル: `indirect_work_type_ratios`

---

### Standard Effort Weights API

> **ステータス: 未実装**

進捗度別の重み値を管理する API。
対応テーブル: `standard_effort_weights`

---

## 関連テーブル API

### Chart View Project Items API

> **ステータス: 未実装**

チャートビューに含まれる案件項目を管理する API。
対応テーブル: `chart_view_project_items`

---

### Chart View Indirect Work Items API

> **ステータス: 未実装**

チャートビューに含まれる間接作業項目を管理する API。
対応テーブル: `chart_view_indirect_work_items`

---

### Project Attachments API

> **ステータス: 未実装**

案件に添付されたファイル情報を管理する API。
対応テーブル: `project_attachments`

---

### Project Change History API

> **ステータス: 未実装**

案件の変更履歴を記録する API。
対応テーブル: `project_change_history`

---

## 設定テーブル API

### Chart Stack Order Settings API

> **ステータス: 未実装**

チャートの積み上げ表示順序を管理する API。
対応テーブル: `chart_stack_order_settings`

---

### Chart Color Settings API

> **ステータス: 未実装**

チャートの各要素に割り当てる色を管理する API。
対応テーブル: `chart_color_settings`

---

### Chart Color Palettes API

> **ステータス: 未実装**

チャート表示で使用する色の定義を管理する API。
対応テーブル: `chart_color_palettes`

# テーブル仕様書

## 目次

1. [概要](#概要)
2. [マスタテーブル](#マスタテーブル)
   - [business_units](#business_units)
   - [project_types](#project_types)
   - [work_types](#work_types)
3. [エンティティテーブル](#エンティティテーブル)
   - [projects](#projects)
   - [project_cases](#project_cases)
   - [headcount_plan_cases](#headcount_plan_cases)
   - [capacity_scenarios](#capacity_scenarios)
   - [indirect_work_cases](#indirect_work_cases)
   - [chart_views](#chart_views)
   - [standard_effort_masters](#standard_effort_masters)
4. [ファクトテーブル](#ファクトテーブル)
   - [project_load](#project_load)
   - [monthly_headcount_plan](#monthly_headcount_plan)
   - [monthly_capacity](#monthly_capacity)
   - [monthly_indirect_work_load](#monthly_indirect_work_load)
   - [indirect_work_type_ratios](#indirect_work_type_ratios)
   - [standard_effort_weights](#standard_effort_weights)
5. [関連テーブル](#関連テーブル)
   - [chart_view_project_items](#chart_view_project_items)
   - [chart_view_indirect_work_items](#chart_view_indirect_work_items)
   - [project_attachments](#project_attachments)
   - [project_change_history](#project_change_history)
6. [設定テーブル](#設定テーブル)
   - [chart_stack_order_settings](#chart_stack_order_settings)
   - [chart_color_settings](#chart_color_settings)
   - [chart_color_palettes](#chart_color_palettes)

---

## 概要

- データベース: Microsoft SQL Server
- 主キー: 自然キー（マスタテーブル）または連番（INT IDENTITY）
- 論理削除: マスタ・エンティティテーブルのみ `deleted_at` カラムを使用
- 物理削除: ファクト・関連・設定テーブルは物理削除（親テーブル削除時にカスケード）
- タイムスタンプ: `created_at`, `updated_at` は `datetime2` 型

---

## マスタテーブル

### business_units

ビジネスユニット（組織単位）を管理するマスタテーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| business_unit_code | VARCHAR(20) | NO | - | 主キー。ビジネスユニットコード |
| name | NVARCHAR(100) | NO | - | ビジネスユニット名 |
| display_order | INT | NO | 0 | 表示順序 |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |
| deleted_at | DATETIME2 | YES | NULL | 削除日時（論理削除） |

**インデックス:**
- PK_business_units (business_unit_code) - 主キー

---

### project_types

案件タイプを管理するマスタテーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| project_type_code | VARCHAR(20) | NO | - | 主キー。案件タイプコード |
| name | NVARCHAR(100) | NO | - | 案件タイプ名 |
| display_order | INT | NO | 0 | 表示順序 |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |
| deleted_at | DATETIME2 | YES | NULL | 削除日時（論理削除） |

**インデックス:**
- PK_project_types (project_type_code) - 主キー

---

### work_types

作業種類を管理するマスタテーブル（間接作業の分類）

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| work_type_code | VARCHAR(20) | NO | - | 主キー。作業種類コード |
| name | NVARCHAR(100) | NO | - | 作業種類名 |
| display_order | INT | NO | 0 | 表示順序 |
| color | VARCHAR(7) | YES | NULL | 表示カラーコード（例: #FF5733） |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |
| deleted_at | DATETIME2 | YES | NULL | 削除日時（論理削除） |

**インデックス:**
- PK_work_types (work_type_code) - 主キー

---

## エンティティテーブル

### projects

案件の基本情報を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| project_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| project_code | NVARCHAR(120) | NO | - | 案件コード |
| name | NVARCHAR(120) | NO | - | 案件名 |
| business_unit_code | VARCHAR(20) | NO | - | 外部キー → business_units |
| project_type_code | VARCHAR(20) | YES | NULL | 外部キー → project_types |
| start_year_month | CHAR(6) | NO | - | 開始年月（YYYYMM形式） |
| total_manhour | INT | NO | - | 総工数（人時） |
| status | VARCHAR(20) | NO | - | ステータス |
| duration_months | INT | YES | NULL | 期間（月数） |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |
| deleted_at | DATETIME2 | YES | NULL | 削除日時（論理削除） |

**インデックス:**
- PK_projects (project_id) - 主キー
- UQ_projects_code (project_code) - ユニーク（deleted_at IS NULL）
- IX_projects_business_unit (business_unit_code) - 外部キー
- IX_projects_project_type (project_type_code) - 外部キー

**外部キー:**
- FK_projects_business_unit → business_units(business_unit_code)
- FK_projects_project_type → project_types(project_type_code)

---

### project_cases

案件のシナリオ（ケース）を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| project_case_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| project_id | INT | NO | - | 外部キー → projects |
| case_name | NVARCHAR(100) | NO | - | ケース名 |
| is_primary | BIT | NO | 0 | プライマリケースフラグ |
| description | NVARCHAR(500) | YES | NULL | 説明 |
| calculation_type | VARCHAR(10) | NO | 'MANUAL' | 計算タイプ（MANUAL/STANDARD） |
| standard_effort_id | INT | YES | NULL | 外部キー → standard_effort_masters |
| start_year_month | CHAR(6) | YES | NULL | 開始年月（YYYYMM形式） |
| duration_months | INT | YES | NULL | 期間（月数） |
| total_manhour | INT | YES | NULL | 総工数（人時） |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |
| deleted_at | DATETIME2 | YES | NULL | 削除日時（論理削除） |

**インデックス:**
- PK_project_cases (project_case_id) - 主キー
- IX_project_cases_project (project_id) - 外部キー

**外部キー:**
- FK_project_cases_project → projects(project_id)
- FK_project_cases_standard_effort → standard_effort_masters(standard_effort_id)

---

### headcount_plan_cases

人員計画のシナリオ（ケース）を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| headcount_plan_case_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| case_name | NVARCHAR(100) | NO | - | ケース名 |
| is_primary | BIT | NO | 0 | プライマリケースフラグ |
| description | NVARCHAR(500) | YES | NULL | 説明 |
| business_unit_code | VARCHAR(20) | YES | NULL | 外部キー → business_units |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |
| deleted_at | DATETIME2 | YES | NULL | 削除日時（論理削除） |

**インデックス:**
- PK_headcount_plan_cases (headcount_plan_case_id) - 主キー
- IX_headcount_plan_cases_bu (business_unit_code) - 外部キー

**外部キー:**
- FK_headcount_plan_cases_bu → business_units(business_unit_code)

---

### capacity_scenarios

キャパシティ計画のシナリオを管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| capacity_scenario_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| scenario_name | NVARCHAR(100) | NO | - | シナリオ名 |
| is_primary | BIT | NO | 0 | プライマリシナリオフラグ |
| description | NVARCHAR(500) | YES | NULL | 説明 |
| hours_per_person | DECIMAL(10,2) | NO | 160.00 | 1人当たり月間労働時間（時間） |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |
| deleted_at | DATETIME2 | YES | NULL | 削除日時（論理削除） |

**制約:**
- CK_capacity_scenarios_hours_per_person - CHECK (hours_per_person > 0 AND hours_per_person <= 744)

**インデックス:**
- PK_capacity_scenarios (capacity_scenario_id) - 主キー

---

### indirect_work_cases

間接作業計画のシナリオ（ケース）を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| indirect_work_case_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| case_name | NVARCHAR(100) | NO | - | ケース名 |
| is_primary | BIT | NO | 0 | プライマリケースフラグ |
| description | NVARCHAR(500) | YES | NULL | 説明 |
| business_unit_code | VARCHAR(20) | NO | - | 外部キー → business_units |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |
| deleted_at | DATETIME2 | YES | NULL | 削除日時（論理削除） |

**インデックス:**
- PK_indirect_work_cases (indirect_work_case_id) - 主キー
- IX_indirect_work_cases_bu (business_unit_code) - 外部キー

**外部キー:**
- FK_indirect_work_cases_bu → business_units(business_unit_code)

---

### chart_views

チャート表示設定を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| chart_view_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| view_name | NVARCHAR(100) | NO | - | ビュー名 |
| chart_type | VARCHAR(50) | NO | - | チャートタイプ |
| start_year_month | CHAR(6) | NO | - | 表示開始年月（YYYYMM形式） |
| end_year_month | CHAR(6) | NO | - | 表示終了年月（YYYYMM形式） |
| is_default | BIT | NO | 0 | デフォルトビューフラグ |
| description | NVARCHAR(500) | YES | NULL | 説明 |
| business_unit_codes | NVARCHAR(MAX) | YES | NULL | 対象ビジネスユニットコード（JSON配列等） |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |
| deleted_at | DATETIME2 | YES | NULL | 削除日時（論理削除） |

**インデックス:**
- PK_chart_views (chart_view_id) - 主キー

---

### standard_effort_masters

BU×案件タイプごとの標準工数パターンを管理するマスタテーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| standard_effort_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| business_unit_code | VARCHAR(20) | NO | - | 外部キー → business_units |
| project_type_code | VARCHAR(20) | NO | - | 外部キー → project_types |
| name | NVARCHAR(100) | NO | - | パターン名 |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |
| deleted_at | DATETIME2 | YES | NULL | 削除日時（論理削除） |

**インデックス:**
- PK_standard_effort_masters (standard_effort_id) - 主キー
- IX_standard_effort_masters_bu_pt_name (business_unit_code, project_type_code, name) - ユニーク（deleted_at IS NULL）
- IX_standard_effort_masters_bu (business_unit_code) - 外部キー
- IX_standard_effort_masters_pt (project_type_code) - 外部キー

**外部キー:**
- FK_standard_effort_masters_bu → business_units(business_unit_code)
- FK_standard_effort_masters_pt → project_types(project_type_code)

---

## ファクトテーブル

### project_load

案件ケースの月次負荷データを管理するファクトテーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| project_load_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| project_case_id | INT | NO | - | 外部キー → project_cases |
| year_month | CHAR(6) | NO | - | 年月（YYYYMM形式） |
| manhour | DECIMAL(10,2) | NO | - | 工数（人時） |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

**インデックス:**
- PK_project_load (project_load_id) - 主キー
- UQ_project_load_case_ym (project_case_id, year_month) - ユニーク
- IX_project_load_case (project_case_id) - 外部キー

**外部キー:**
- FK_project_load_case → project_cases(project_case_id) ON DELETE CASCADE

---

### monthly_headcount_plan

月次人員計画データを管理するファクトテーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| monthly_headcount_plan_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| headcount_plan_case_id | INT | NO | - | 外部キー → headcount_plan_cases |
| business_unit_code | VARCHAR(20) | NO | - | 外部キー → business_units |
| year_month | CHAR(6) | NO | - | 年月（YYYYMM形式） |
| headcount | INT | NO | - | 人数 |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

**インデックス:**
- PK_monthly_headcount_plan (monthly_headcount_plan_id) - 主キー
- UQ_monthly_headcount_plan_case_bu_ym (headcount_plan_case_id, business_unit_code, year_month) - ユニーク
- IX_monthly_headcount_plan_case (headcount_plan_case_id) - 外部キー
- IX_monthly_headcount_plan_bu (business_unit_code) - 外部キー

**外部キー:**
- FK_monthly_headcount_plan_case → headcount_plan_cases(headcount_plan_case_id) ON DELETE CASCADE
- FK_monthly_headcount_plan_bu → business_units(business_unit_code)

---

### monthly_capacity

月次キャパシティデータを管理するファクトテーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| monthly_capacity_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| capacity_scenario_id | INT | NO | - | 外部キー → capacity_scenarios |
| business_unit_code | VARCHAR(20) | NO | - | 外部キー → business_units |
| year_month | CHAR(6) | NO | - | 年月（YYYYMM形式） |
| capacity | DECIMAL(10,2) | NO | - | キャパシティ（人時） |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

**インデックス:**
- PK_monthly_capacity (monthly_capacity_id) - 主キー
- UQ_monthly_capacity_scenario_bu_ym (capacity_scenario_id, business_unit_code, year_month) - ユニーク
- IX_monthly_capacity_scenario (capacity_scenario_id) - 外部キー
- IX_monthly_capacity_bu (business_unit_code) - 外部キー

**外部キー:**
- FK_monthly_capacity_scenario → capacity_scenarios(capacity_scenario_id) ON DELETE CASCADE
- FK_monthly_capacity_bu → business_units(business_unit_code)

---

### monthly_indirect_work_load

月次間接作業負荷データを管理するファクトテーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| monthly_indirect_work_load_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| indirect_work_case_id | INT | NO | - | 外部キー → indirect_work_cases |
| business_unit_code | VARCHAR(20) | NO | - | 外部キー → business_units |
| year_month | CHAR(6) | NO | - | 年月（YYYYMM形式） |
| manhour | DECIMAL(10,2) | NO | - | 工数（人時） |
| source | VARCHAR(20) | NO | - | データソース（calculated/manual） |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

**インデックス:**
- PK_monthly_indirect_work_load (monthly_indirect_work_load_id) - 主キー
- UQ_monthly_indirect_work_load_case_bu_ym (indirect_work_case_id, business_unit_code, year_month) - ユニーク
- IX_monthly_indirect_work_load_case (indirect_work_case_id) - 外部キー
- IX_monthly_indirect_work_load_bu (business_unit_code) - 外部キー

**外部キー:**
- FK_monthly_indirect_work_load_case → indirect_work_cases(indirect_work_case_id) ON DELETE CASCADE
- FK_monthly_indirect_work_load_bu → business_units(business_unit_code)

---

### indirect_work_type_ratios

間接作業の種別ごとの配分比率を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| indirect_work_type_ratio_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| indirect_work_case_id | INT | NO | - | 外部キー → indirect_work_cases |
| work_type_code | VARCHAR(20) | NO | - | 外部キー → work_types |
| fiscal_year | INT | NO | - | 年度 |
| ratio | DECIMAL(5,4) | NO | - | 比率（0.0000～1.0000） |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

**インデックス:**
- PK_indirect_work_type_ratios (indirect_work_type_ratio_id) - 主キー
- UQ_indirect_work_type_ratios_case_wt_fy (indirect_work_case_id, work_type_code, fiscal_year) - ユニーク
- IX_indirect_work_type_ratios_case (indirect_work_case_id) - 外部キー
- IX_indirect_work_type_ratios_wt (work_type_code) - 外部キー

**外部キー:**
- FK_indirect_work_type_ratios_case → indirect_work_cases(indirect_work_case_id) ON DELETE CASCADE
- FK_indirect_work_type_ratios_wt → work_types(work_type_code)

---

### standard_effort_weights

進捗度別の重み値を管理する子テーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| standard_effort_weight_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| standard_effort_id | INT | NO | - | 外部キー → standard_effort_masters |
| progress_rate | INT | NO | - | 進捗率（0, 5, 10, ... 100） |
| weight | INT | NO | - | 重み（非負整数） |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

**インデックス:**
- PK_standard_effort_weights (standard_effort_weight_id) - 主キー
- UQ_standard_effort_weights_master_rate (standard_effort_id, progress_rate) - ユニーク
- IX_standard_effort_weights_master (standard_effort_id) - 外部キー

**外部キー:**
- FK_standard_effort_weights_master → standard_effort_masters(standard_effort_id) ON DELETE CASCADE

---

## 関連テーブル

### chart_view_project_items

チャートビューに含まれる案件項目を管理する関連テーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| chart_view_project_item_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| chart_view_id | INT | NO | - | 外部キー → chart_views |
| project_id | INT | NO | - | 外部キー → projects |
| project_case_id | INT | YES | NULL | 外部キー → project_cases |
| display_order | INT | NO | 0 | 表示順序 |
| is_visible | BIT | NO | 1 | 表示フラグ |
| color_code | VARCHAR(7) | YES | NULL | CSS hex カラーコード（例: #FF5733） |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

**インデックス:**
- PK_chart_view_project_items (chart_view_project_item_id) - 主キー
- IX_chart_view_project_items_view (chart_view_id) - 外部キー
- IX_chart_view_project_items_project (project_id) - 外部キー

**外部キー:**
- FK_chart_view_project_items_view → chart_views(chart_view_id) ON DELETE CASCADE
- FK_chart_view_project_items_project → projects(project_id)
- FK_chart_view_project_items_case → project_cases(project_case_id)

---

### chart_view_indirect_work_items

チャートビューに含まれる間接作業項目を管理する関連テーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| chart_view_indirect_work_item_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| chart_view_id | INT | NO | - | 外部キー → chart_views |
| indirect_work_case_id | INT | NO | - | 外部キー → indirect_work_cases |
| display_order | INT | NO | 0 | 表示順序 |
| is_visible | BIT | NO | 1 | 表示フラグ |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

**インデックス:**
- PK_chart_view_indirect_work_items (chart_view_indirect_work_item_id) - 主キー
- IX_chart_view_indirect_work_items_view (chart_view_id) - 外部キー
- IX_chart_view_indirect_work_items_case (indirect_work_case_id) - 外部キー

**外部キー:**
- FK_chart_view_indirect_work_items_view → chart_views(chart_view_id) ON DELETE CASCADE
- FK_chart_view_indirect_work_items_case → indirect_work_cases(indirect_work_case_id)

---

### project_attachments

案件に添付されたファイル情報を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| project_attachment_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| project_id | INT | NO | - | 外部キー → projects |
| file_name | NVARCHAR(255) | NO | - | ファイル名 |
| file_path | NVARCHAR(500) | NO | - | ファイルパス |
| file_size | INT | NO | - | ファイルサイズ（バイト） |
| mime_type | VARCHAR(100) | NO | - | MIMEタイプ |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

**インデックス:**
- PK_project_attachments (project_attachment_id) - 主キー
- IX_project_attachments_project (project_id) - 外部キー

**外部キー:**
- FK_project_attachments_project → projects(project_id) ON DELETE CASCADE

---

### project_change_history

案件の変更履歴を記録するテーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| project_change_history_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| project_id | INT | NO | - | 外部キー → projects |
| change_type | VARCHAR(50) | NO | - | 変更タイプ |
| field_name | VARCHAR(100) | YES | NULL | 変更フィールド名 |
| old_value | NVARCHAR(1000) | YES | NULL | 変更前の値 |
| new_value | NVARCHAR(1000) | YES | NULL | 変更後の値 |
| changed_by | NVARCHAR(100) | NO | - | 変更者 |
| changed_at | DATETIME2 | NO | GETDATE() | 変更日時 |

**インデックス:**
- PK_project_change_history (project_change_history_id) - 主キー
- IX_project_change_history_project (project_id) - 外部キー
- IX_project_change_history_changed_at (changed_at) - 検索用

**外部キー:**
- FK_project_change_history_project → projects(project_id) ON DELETE CASCADE

---

## 設定テーブル

### chart_stack_order_settings

チャートの積み上げ表示順序を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| chart_stack_order_setting_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| target_type | VARCHAR(20) | NO | - | 対象タイプ |
| target_code | VARCHAR(50) | NO | - | 対象コード |
| stack_order | INT | NO | - | 積み上げ順序 |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

**インデックス:**
- PK_chart_stack_order_settings (chart_stack_order_setting_id) - 主キー
- UQ_chart_stack_order_settings_target (target_type, target_code) - ユニーク

---

### chart_color_settings

チャートの各要素に割り当てる色を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| chart_color_setting_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| target_type | VARCHAR(20) | NO | - | 対象タイプ |
| target_code | VARCHAR(50) | NO | - | 対象コード |
| color_code | VARCHAR(7) | NO | - | カラーコード（例: #FF5733） |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

**インデックス:**
- PK_chart_color_settings (chart_color_setting_id) - 主キー
- UQ_chart_color_settings_target (target_type, target_code) - ユニーク

---

### chart_color_palettes

チャート表示で使用する色の定義を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| chart_color_palette_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| name | NVARCHAR(100) | NO | - | パレット名 |
| color_code | VARCHAR(7) | NO | - | カラーコード（例: #FF5733） |
| display_order | INT | NO | 0 | 表示順序 |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

**インデックス:**
- PK_chart_color_palettes (chart_color_palette_id) - 主キー

---

## 付録: ER図

ER図については `docs/architecture/database.md` を参照してください。

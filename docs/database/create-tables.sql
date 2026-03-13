-- =============================================================================
-- OPS-NEXT データベース作成スクリプト
-- 対象: Microsoft SQL Server
-- =============================================================================

-- =============================================================================
-- 0. 全テーブル削除（外部キー制約を考慮した逆順）
-- =============================================================================

-- 設定テーブル
DROP TABLE IF EXISTS chart_color_palettes;
DROP TABLE IF EXISTS chart_color_settings;
DROP TABLE IF EXISTS chart_stack_order_settings;

-- 関連テーブル
DROP TABLE IF EXISTS project_change_history;
DROP TABLE IF EXISTS project_attachments;
DROP TABLE IF EXISTS chart_view_capacity_items;
DROP TABLE IF EXISTS chart_view_project_items;

-- ファクトテーブル
DROP TABLE IF EXISTS standard_effort_weights;
DROP TABLE IF EXISTS indirect_work_type_ratios;
DROP TABLE IF EXISTS monthly_indirect_work_load;
DROP TABLE IF EXISTS monthly_capacity;
DROP TABLE IF EXISTS monthly_headcount_plan;
DROP TABLE IF EXISTS project_load;

-- エンティティテーブル
DROP TABLE IF EXISTS chart_views;
DROP TABLE IF EXISTS indirect_work_cases;
DROP TABLE IF EXISTS capacity_scenarios;
DROP TABLE IF EXISTS headcount_plan_cases;
DROP TABLE IF EXISTS project_cases;
DROP TABLE IF EXISTS standard_effort_masters;
DROP TABLE IF EXISTS projects;

-- マスタテーブル
DROP TABLE IF EXISTS work_types;
DROP TABLE IF EXISTS project_types;
DROP TABLE IF EXISTS business_units;

PRINT 'All existing tables dropped.';
GO

-- =============================================================================
-- 1. マスタテーブル
-- =============================================================================

-- -----------------------------------------------------------------------------
-- business_units: ビジネスユニットマスタ
-- -----------------------------------------------------------------------------
CREATE TABLE business_units (
    business_unit_code VARCHAR(20) NOT NULL,
    name NVARCHAR(100) NOT NULL,
    display_order INT NOT NULL CONSTRAINT DF_business_units_display_order DEFAULT 0,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_business_units_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_business_units_updated_at DEFAULT GETDATE(),
    deleted_at DATETIME2 NULL,
    CONSTRAINT PK_business_units PRIMARY KEY (business_unit_code)
);

-- -----------------------------------------------------------------------------
-- project_types: 案件タイプマスタ
-- -----------------------------------------------------------------------------
CREATE TABLE project_types (
    project_type_code VARCHAR(20) NOT NULL,
    name NVARCHAR(100) NOT NULL,
    display_order INT NOT NULL CONSTRAINT DF_project_types_display_order DEFAULT 0,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_project_types_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_project_types_updated_at DEFAULT GETDATE(),
    deleted_at DATETIME2 NULL,
    CONSTRAINT PK_project_types PRIMARY KEY (project_type_code)
);

-- -----------------------------------------------------------------------------
-- work_types: 作業種類マスタ
-- -----------------------------------------------------------------------------
CREATE TABLE work_types (
    work_type_code VARCHAR(20) NOT NULL,
    name NVARCHAR(100) NOT NULL,
    display_order INT NOT NULL CONSTRAINT DF_work_types_display_order DEFAULT 0,
    color VARCHAR(7) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_work_types_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_work_types_updated_at DEFAULT GETDATE(),
    deleted_at DATETIME2 NULL,
    CONSTRAINT PK_work_types PRIMARY KEY (work_type_code)
);

-- =============================================================================
-- 2. エンティティテーブル
-- =============================================================================

-- -----------------------------------------------------------------------------
-- projects: 案件マスタ
-- -----------------------------------------------------------------------------
CREATE TABLE projects (
    project_id INT IDENTITY(1,1) NOT NULL,
    project_code NVARCHAR(120) NOT NULL,
    name NVARCHAR(120) NOT NULL,
    business_unit_code VARCHAR(20) NOT NULL,
    project_type_code VARCHAR(20) NULL,
    start_year_month CHAR(6) NOT NULL,
    total_manhour INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    duration_months INT NULL,
    fiscal_year INT NULL,
    nickname NVARCHAR(120) NULL,
    customer_name NVARCHAR(120) NULL,
    order_number NVARCHAR(120) NULL,
    calculation_basis NVARCHAR(500) NULL,
    remarks NVARCHAR(500) NULL,
    region NVARCHAR(100) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_projects_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_projects_updated_at DEFAULT GETDATE(),
    deleted_at DATETIME2 NULL,
    CONSTRAINT PK_projects PRIMARY KEY (project_id),
    CONSTRAINT FK_projects_business_unit FOREIGN KEY (business_unit_code)
        REFERENCES business_units (business_unit_code),
    CONSTRAINT FK_projects_project_type FOREIGN KEY (project_type_code)
        REFERENCES project_types (project_type_code)
);

CREATE UNIQUE INDEX UQ_projects_code ON projects (project_code) WHERE deleted_at IS NULL;
CREATE INDEX IX_projects_business_unit ON projects (business_unit_code);
CREATE INDEX IX_projects_project_type ON projects (project_type_code);

-- -----------------------------------------------------------------------------
-- standard_effort_masters: 標準工数マスタ
-- -----------------------------------------------------------------------------
CREATE TABLE standard_effort_masters (
    standard_effort_id INT IDENTITY(1,1) NOT NULL,
    business_unit_code VARCHAR(20) NOT NULL,
    project_type_code VARCHAR(20) NOT NULL,
    name NVARCHAR(100) NOT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_standard_effort_masters_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_standard_effort_masters_updated_at DEFAULT GETDATE(),
    deleted_at DATETIME2 NULL,
    CONSTRAINT PK_standard_effort_masters PRIMARY KEY (standard_effort_id),
    CONSTRAINT FK_standard_effort_masters_bu FOREIGN KEY (business_unit_code)
        REFERENCES business_units (business_unit_code),
    CONSTRAINT FK_standard_effort_masters_pt FOREIGN KEY (project_type_code)
        REFERENCES project_types (project_type_code)
);

CREATE INDEX IX_standard_effort_masters_bu ON standard_effort_masters (business_unit_code);
CREATE INDEX IX_standard_effort_masters_pt ON standard_effort_masters (project_type_code);
CREATE UNIQUE INDEX IX_standard_effort_masters_bu_pt_name ON standard_effort_masters (business_unit_code, project_type_code, name)
    WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- project_cases: 案件ケース
-- -----------------------------------------------------------------------------
CREATE TABLE project_cases (
    project_case_id INT IDENTITY(1,1) NOT NULL,
    project_id INT NOT NULL,
    case_name NVARCHAR(100) NOT NULL,
    is_primary BIT NOT NULL CONSTRAINT DF_project_cases_is_primary DEFAULT 0,
    description NVARCHAR(500) NULL,
    calculation_type VARCHAR(10) NOT NULL CONSTRAINT DF_project_cases_calculation_type DEFAULT 'MANUAL',
    standard_effort_id INT NULL,
    start_year_month CHAR(6) NULL,
    duration_months INT NULL,
    total_manhour INT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_project_cases_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_project_cases_updated_at DEFAULT GETDATE(),
    deleted_at DATETIME2 NULL,
    CONSTRAINT PK_project_cases PRIMARY KEY (project_case_id),
    CONSTRAINT FK_project_cases_project FOREIGN KEY (project_id)
        REFERENCES projects (project_id),
    CONSTRAINT FK_project_cases_standard_effort FOREIGN KEY (standard_effort_id)
        REFERENCES standard_effort_masters (standard_effort_id)
);

CREATE INDEX IX_project_cases_project ON project_cases (project_id);
CREATE INDEX IX_project_cases_standard_effort ON project_cases (standard_effort_id);

-- -----------------------------------------------------------------------------
-- headcount_plan_cases: 人員計画ケース
-- -----------------------------------------------------------------------------
CREATE TABLE headcount_plan_cases (
    headcount_plan_case_id INT IDENTITY(1,1) NOT NULL,
    case_name NVARCHAR(100) NOT NULL,
    is_primary BIT NOT NULL CONSTRAINT DF_headcount_plan_cases_is_primary DEFAULT 0,
    description NVARCHAR(500) NULL,
    business_unit_code VARCHAR(20) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_headcount_plan_cases_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_headcount_plan_cases_updated_at DEFAULT GETDATE(),
    deleted_at DATETIME2 NULL,
    CONSTRAINT PK_headcount_plan_cases PRIMARY KEY (headcount_plan_case_id),
    CONSTRAINT FK_headcount_plan_cases_bu FOREIGN KEY (business_unit_code)
        REFERENCES business_units (business_unit_code)
);

CREATE INDEX IX_headcount_plan_cases_bu ON headcount_plan_cases (business_unit_code);

-- -----------------------------------------------------------------------------
-- capacity_scenarios: キャパシティシナリオ
-- -----------------------------------------------------------------------------
CREATE TABLE capacity_scenarios (
    capacity_scenario_id INT IDENTITY(1,1) NOT NULL,
    scenario_name NVARCHAR(100) NOT NULL,
    is_primary BIT NOT NULL CONSTRAINT DF_capacity_scenarios_is_primary DEFAULT 0,
    description NVARCHAR(500) NULL,
    hours_per_person DECIMAL(10, 2) NOT NULL CONSTRAINT DF_capacity_scenarios_hours_per_person DEFAULT 160.00,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_capacity_scenarios_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_capacity_scenarios_updated_at DEFAULT GETDATE(),
    deleted_at DATETIME2 NULL,
    CONSTRAINT PK_capacity_scenarios PRIMARY KEY (capacity_scenario_id),
    CONSTRAINT CK_capacity_scenarios_hours_per_person CHECK (hours_per_person > 0 AND hours_per_person <= 744)
);

-- -----------------------------------------------------------------------------
-- indirect_work_cases: 間接工数ケース
-- -----------------------------------------------------------------------------
CREATE TABLE indirect_work_cases (
    indirect_work_case_id INT IDENTITY(1,1) NOT NULL,
    case_name NVARCHAR(100) NOT NULL,
    is_primary BIT NOT NULL CONSTRAINT DF_indirect_work_cases_is_primary DEFAULT 0,
    description NVARCHAR(500) NULL,
    business_unit_code VARCHAR(20) NOT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_indirect_work_cases_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_indirect_work_cases_updated_at DEFAULT GETDATE(),
    deleted_at DATETIME2 NULL,
    CONSTRAINT PK_indirect_work_cases PRIMARY KEY (indirect_work_case_id),
    CONSTRAINT FK_indirect_work_cases_bu FOREIGN KEY (business_unit_code)
        REFERENCES business_units (business_unit_code)
);

CREATE INDEX IX_indirect_work_cases_bu ON indirect_work_cases (business_unit_code);

-- -----------------------------------------------------------------------------
-- chart_views: チャートビュー設定
-- -----------------------------------------------------------------------------
CREATE TABLE chart_views (
    chart_view_id INT IDENTITY(1,1) NOT NULL,
    view_name NVARCHAR(100) NOT NULL,
    chart_type VARCHAR(50) NOT NULL,
    start_year_month CHAR(6) NOT NULL,
    end_year_month CHAR(6) NOT NULL,
    is_default BIT NOT NULL CONSTRAINT DF_chart_views_is_default DEFAULT 0,
    description NVARCHAR(500) NULL,
    business_unit_codes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_chart_views_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_chart_views_updated_at DEFAULT GETDATE(),
    deleted_at DATETIME2 NULL,
    CONSTRAINT PK_chart_views PRIMARY KEY (chart_view_id)
);

-- =============================================================================
-- 3. ファクトテーブル（物理削除・カスケード）
-- =============================================================================

-- -----------------------------------------------------------------------------
-- project_load: 月次案件負荷
-- -----------------------------------------------------------------------------
CREATE TABLE project_load (
    project_load_id INT IDENTITY(1,1) NOT NULL,
    project_case_id INT NOT NULL,
    year_month CHAR(6) NOT NULL,
    manhour DECIMAL(10, 2) NOT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_project_load_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_project_load_updated_at DEFAULT GETDATE(),
    CONSTRAINT PK_project_load PRIMARY KEY (project_load_id),
    CONSTRAINT FK_project_load_case FOREIGN KEY (project_case_id)
        REFERENCES project_cases (project_case_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX UQ_project_load_case_ym ON project_load (project_case_id, year_month);
CREATE INDEX IX_project_load_case ON project_load (project_case_id);

-- -----------------------------------------------------------------------------
-- monthly_headcount_plan: 月次人員計画
-- -----------------------------------------------------------------------------
CREATE TABLE monthly_headcount_plan (
    monthly_headcount_plan_id INT IDENTITY(1,1) NOT NULL,
    headcount_plan_case_id INT NOT NULL,
    business_unit_code VARCHAR(20) NOT NULL,
    year_month CHAR(6) NOT NULL,
    headcount INT NOT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_monthly_headcount_plan_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_monthly_headcount_plan_updated_at DEFAULT GETDATE(),
    CONSTRAINT PK_monthly_headcount_plan PRIMARY KEY (monthly_headcount_plan_id),
    CONSTRAINT FK_monthly_headcount_plan_case FOREIGN KEY (headcount_plan_case_id)
        REFERENCES headcount_plan_cases (headcount_plan_case_id) ON DELETE CASCADE,
    CONSTRAINT FK_monthly_headcount_plan_bu FOREIGN KEY (business_unit_code)
        REFERENCES business_units (business_unit_code)
);

CREATE UNIQUE INDEX UQ_monthly_headcount_plan_case_bu_ym ON monthly_headcount_plan (headcount_plan_case_id, business_unit_code, year_month);
CREATE INDEX IX_monthly_headcount_plan_case ON monthly_headcount_plan (headcount_plan_case_id);
CREATE INDEX IX_monthly_headcount_plan_bu ON monthly_headcount_plan (business_unit_code);

-- -----------------------------------------------------------------------------
-- monthly_capacity: 月次キャパシティ
-- -----------------------------------------------------------------------------
CREATE TABLE monthly_capacity (
    monthly_capacity_id INT IDENTITY(1,1) NOT NULL,
    capacity_scenario_id INT NOT NULL,
    business_unit_code VARCHAR(20) NOT NULL,
    year_month CHAR(6) NOT NULL,
    capacity DECIMAL(10, 2) NOT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_monthly_capacity_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_monthly_capacity_updated_at DEFAULT GETDATE(),
    CONSTRAINT PK_monthly_capacity PRIMARY KEY (monthly_capacity_id),
    CONSTRAINT FK_monthly_capacity_scenario FOREIGN KEY (capacity_scenario_id)
        REFERENCES capacity_scenarios (capacity_scenario_id) ON DELETE CASCADE,
    CONSTRAINT FK_monthly_capacity_bu FOREIGN KEY (business_unit_code)
        REFERENCES business_units (business_unit_code)
);

CREATE UNIQUE INDEX UQ_monthly_capacity_scenario_bu_ym ON monthly_capacity (capacity_scenario_id, business_unit_code, year_month);
CREATE INDEX IX_monthly_capacity_scenario ON monthly_capacity (capacity_scenario_id);
CREATE INDEX IX_monthly_capacity_bu ON monthly_capacity (business_unit_code);

-- -----------------------------------------------------------------------------
-- monthly_indirect_work_load: 月次間接工数
-- -----------------------------------------------------------------------------
CREATE TABLE monthly_indirect_work_load (
    monthly_indirect_work_load_id INT IDENTITY(1,1) NOT NULL,
    indirect_work_case_id INT NOT NULL,
    business_unit_code VARCHAR(20) NOT NULL,
    year_month CHAR(6) NOT NULL,
    manhour DECIMAL(10, 2) NOT NULL,
    source VARCHAR(20) NOT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_monthly_indirect_work_load_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_monthly_indirect_work_load_updated_at DEFAULT GETDATE(),
    CONSTRAINT PK_monthly_indirect_work_load PRIMARY KEY (monthly_indirect_work_load_id),
    CONSTRAINT FK_monthly_indirect_work_load_case FOREIGN KEY (indirect_work_case_id)
        REFERENCES indirect_work_cases (indirect_work_case_id) ON DELETE CASCADE,
    CONSTRAINT FK_monthly_indirect_work_load_bu FOREIGN KEY (business_unit_code)
        REFERENCES business_units (business_unit_code)
);

CREATE UNIQUE INDEX UQ_monthly_indirect_work_load_case_bu_ym ON monthly_indirect_work_load (indirect_work_case_id, business_unit_code, year_month);
CREATE INDEX IX_monthly_indirect_work_load_case ON monthly_indirect_work_load (indirect_work_case_id);
CREATE INDEX IX_monthly_indirect_work_load_bu ON monthly_indirect_work_load (business_unit_code);

-- -----------------------------------------------------------------------------
-- indirect_work_type_ratios: 間接工数作業種類比率
-- -----------------------------------------------------------------------------
CREATE TABLE indirect_work_type_ratios (
    indirect_work_type_ratio_id INT IDENTITY(1,1) NOT NULL,
    indirect_work_case_id INT NOT NULL,
    work_type_code VARCHAR(20) NOT NULL,
    fiscal_year INT NOT NULL,
    ratio DECIMAL(5, 4) NOT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_indirect_work_type_ratios_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_indirect_work_type_ratios_updated_at DEFAULT GETDATE(),
    CONSTRAINT PK_indirect_work_type_ratios PRIMARY KEY (indirect_work_type_ratio_id),
    CONSTRAINT FK_indirect_work_type_ratios_case FOREIGN KEY (indirect_work_case_id)
        REFERENCES indirect_work_cases (indirect_work_case_id) ON DELETE CASCADE,
    CONSTRAINT FK_indirect_work_type_ratios_wt FOREIGN KEY (work_type_code)
        REFERENCES work_types (work_type_code)
);

CREATE UNIQUE INDEX UQ_indirect_work_type_ratios_case_wt_fy ON indirect_work_type_ratios (indirect_work_case_id, work_type_code, fiscal_year);
CREATE INDEX IX_indirect_work_type_ratios_case ON indirect_work_type_ratios (indirect_work_case_id);
CREATE INDEX IX_indirect_work_type_ratios_wt ON indirect_work_type_ratios (work_type_code);

-- -----------------------------------------------------------------------------
-- standard_effort_weights: 標準工数重み
-- -----------------------------------------------------------------------------
CREATE TABLE standard_effort_weights (
    standard_effort_weight_id INT IDENTITY(1,1) NOT NULL,
    standard_effort_id INT NOT NULL,
    progress_rate INT NOT NULL,
    weight INT NOT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_standard_effort_weights_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_standard_effort_weights_updated_at DEFAULT GETDATE(),
    CONSTRAINT PK_standard_effort_weights PRIMARY KEY (standard_effort_weight_id),
    CONSTRAINT FK_standard_effort_weights_master FOREIGN KEY (standard_effort_id)
        REFERENCES standard_effort_masters (standard_effort_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX UQ_standard_effort_weights_master_rate ON standard_effort_weights (standard_effort_id, progress_rate);
CREATE INDEX IX_standard_effort_weights_master ON standard_effort_weights (standard_effort_id);

-- =============================================================================
-- 4. 関連テーブル（物理削除・カスケード）
-- =============================================================================

-- -----------------------------------------------------------------------------
-- chart_view_project_items: チャートビュー案件項目
-- -----------------------------------------------------------------------------
CREATE TABLE chart_view_project_items (
    chart_view_project_item_id INT IDENTITY(1,1) NOT NULL,
    chart_view_id INT NOT NULL,
    project_id INT NOT NULL,
    project_case_id INT NULL,
    display_order INT NOT NULL CONSTRAINT DF_chart_view_project_items_display_order DEFAULT 0,
    is_visible BIT NOT NULL CONSTRAINT DF_chart_view_project_items_is_visible DEFAULT 1,
    color_code VARCHAR(7) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_chart_view_project_items_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_chart_view_project_items_updated_at DEFAULT GETDATE(),
    CONSTRAINT PK_chart_view_project_items PRIMARY KEY (chart_view_project_item_id),
    CONSTRAINT FK_chart_view_project_items_view FOREIGN KEY (chart_view_id)
        REFERENCES chart_views (chart_view_id) ON DELETE CASCADE,
    CONSTRAINT FK_chart_view_project_items_project FOREIGN KEY (project_id)
        REFERENCES projects (project_id),
    CONSTRAINT FK_chart_view_project_items_case FOREIGN KEY (project_case_id)
        REFERENCES project_cases (project_case_id)
);

CREATE INDEX IX_chart_view_project_items_view ON chart_view_project_items (chart_view_id);
CREATE INDEX IX_chart_view_project_items_project ON chart_view_project_items (project_id);

-- -----------------------------------------------------------------------------
-- chart_view_capacity_items: チャートビューキャパシティ項目
-- -----------------------------------------------------------------------------
CREATE TABLE chart_view_capacity_items (
    chart_view_capacity_item_id INT IDENTITY(1,1) NOT NULL,
    chart_view_id INT NOT NULL,
    capacity_scenario_id INT NOT NULL,
    is_visible BIT NOT NULL CONSTRAINT DF_chart_view_capacity_items_is_visible DEFAULT 1,
    color_code VARCHAR(7) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_chart_view_capacity_items_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_chart_view_capacity_items_updated_at DEFAULT GETDATE(),
    CONSTRAINT PK_chart_view_capacity_items PRIMARY KEY (chart_view_capacity_item_id),
    CONSTRAINT FK_chart_view_capacity_items_view FOREIGN KEY (chart_view_id)
        REFERENCES chart_views (chart_view_id) ON DELETE CASCADE,
    CONSTRAINT FK_chart_view_capacity_items_scenario FOREIGN KEY (capacity_scenario_id)
        REFERENCES capacity_scenarios (capacity_scenario_id)
);

CREATE INDEX IX_chart_view_capacity_items_view ON chart_view_capacity_items (chart_view_id);
CREATE INDEX IX_chart_view_capacity_items_scenario ON chart_view_capacity_items (capacity_scenario_id);

-- -----------------------------------------------------------------------------
-- project_attachments: 案件添付ファイル
-- -----------------------------------------------------------------------------
CREATE TABLE project_attachments (
    project_attachment_id INT IDENTITY(1,1) NOT NULL,
    project_id INT NOT NULL,
    file_name NVARCHAR(255) NOT NULL,
    file_path NVARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_project_attachments_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_project_attachments_updated_at DEFAULT GETDATE(),
    CONSTRAINT PK_project_attachments PRIMARY KEY (project_attachment_id),
    CONSTRAINT FK_project_attachments_project FOREIGN KEY (project_id)
        REFERENCES projects (project_id) ON DELETE CASCADE
);

CREATE INDEX IX_project_attachments_project ON project_attachments (project_id);

-- -----------------------------------------------------------------------------
-- project_change_history: 案件変更履歴
-- -----------------------------------------------------------------------------
CREATE TABLE project_change_history (
    project_change_history_id INT IDENTITY(1,1) NOT NULL,
    project_id INT NOT NULL,
    change_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NULL,
    old_value NVARCHAR(1000) NULL,
    new_value NVARCHAR(1000) NULL,
    changed_by NVARCHAR(100) NOT NULL,
    changed_at DATETIME2 NOT NULL CONSTRAINT DF_project_change_history_changed_at DEFAULT GETDATE(),
    CONSTRAINT PK_project_change_history PRIMARY KEY (project_change_history_id),
    CONSTRAINT FK_project_change_history_project FOREIGN KEY (project_id)
        REFERENCES projects (project_id) ON DELETE CASCADE
);

CREATE INDEX IX_project_change_history_project ON project_change_history (project_id);
CREATE INDEX IX_project_change_history_changed_at ON project_change_history (changed_at);

-- =============================================================================
-- 5. 設定テーブル（物理削除）
-- =============================================================================

-- -----------------------------------------------------------------------------
-- chart_stack_order_settings: 山積順設定
-- -----------------------------------------------------------------------------
CREATE TABLE chart_stack_order_settings (
    chart_stack_order_setting_id INT IDENTITY(1,1) NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    target_code VARCHAR(50) NOT NULL,
    stack_order INT NOT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_chart_stack_order_settings_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_chart_stack_order_settings_updated_at DEFAULT GETDATE(),
    CONSTRAINT PK_chart_stack_order_settings PRIMARY KEY (chart_stack_order_setting_id)
);

CREATE UNIQUE INDEX UQ_chart_stack_order_settings_target ON chart_stack_order_settings (target_type, target_code);

-- -----------------------------------------------------------------------------
-- chart_color_settings: カラー設定
-- -----------------------------------------------------------------------------
CREATE TABLE chart_color_settings (
    chart_color_setting_id INT IDENTITY(1,1) NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    target_code VARCHAR(50) NOT NULL,
    color_code VARCHAR(7) NOT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_chart_color_settings_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_chart_color_settings_updated_at DEFAULT GETDATE(),
    CONSTRAINT PK_chart_color_settings PRIMARY KEY (chart_color_setting_id)
);

CREATE UNIQUE INDEX UQ_chart_color_settings_target ON chart_color_settings (target_type, target_code);

-- -----------------------------------------------------------------------------
-- chart_color_palettes: カラーパレット
-- -----------------------------------------------------------------------------
CREATE TABLE chart_color_palettes (
    chart_color_palette_id INT IDENTITY(1,1) NOT NULL,
    name NVARCHAR(100) NOT NULL,
    color_code VARCHAR(7) NOT NULL,
    display_order INT NOT NULL CONSTRAINT DF_chart_color_palettes_display_order DEFAULT 0,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_chart_color_palettes_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_chart_color_palettes_updated_at DEFAULT GETDATE(),
    CONSTRAINT PK_chart_color_palettes PRIMARY KEY (chart_color_palette_id)
);

-- =============================================================================
-- 完了メッセージ
-- =============================================================================
PRINT 'All tables created successfully.';
GO

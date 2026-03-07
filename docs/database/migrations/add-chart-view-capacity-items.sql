-- =============================================================================
-- Migration: chart_view_capacity_items テーブルの追加
-- キャパシティシナリオの表示設定をチャートビューに紐付けて保存する
-- =============================================================================

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

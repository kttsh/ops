-- chart_color_settings: target_id INT → target_code VARCHAR(50)
-- chart_stack_order_settings: target_id INT → target_code VARCHAR(50)
-- 既存データの整数値は文字列に変換される

-- 1. chart_color_settings
DROP INDEX IF EXISTS UQ_chart_color_settings_target ON chart_color_settings;

ALTER TABLE chart_color_settings ADD target_code VARCHAR(50) NULL;
UPDATE chart_color_settings SET target_code = CAST(target_id AS VARCHAR(50));
ALTER TABLE chart_color_settings ALTER COLUMN target_code VARCHAR(50) NOT NULL;
ALTER TABLE chart_color_settings DROP COLUMN target_id;

CREATE UNIQUE INDEX UQ_chart_color_settings_target ON chart_color_settings (target_type, target_code);

-- 2. chart_stack_order_settings
DROP INDEX IF EXISTS UQ_chart_stack_order_settings_target ON chart_stack_order_settings;

ALTER TABLE chart_stack_order_settings ADD target_code VARCHAR(50) NULL;
UPDATE chart_stack_order_settings SET target_code = CAST(target_id AS VARCHAR(50));
ALTER TABLE chart_stack_order_settings ALTER COLUMN target_code VARCHAR(50) NOT NULL;
ALTER TABLE chart_stack_order_settings DROP COLUMN target_id;

CREATE UNIQUE INDEX UQ_chart_stack_order_settings_target ON chart_stack_order_settings (target_type, target_code);

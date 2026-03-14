-- =============================================================================
-- Migration 006: チャートカラーを淡いトーンに変更
-- =============================================================================
-- 対象テーブル:
--   1. chart_color_palettes  - カラーパレットマスタ
--   2. chart_color_settings  - 案件・間接作業のカラー設定
--   3. chart_view_project_items - チャートビュー案件項目の色
--   4. chart_view_capacity_items - チャートビューキャパシティ項目の色
-- =============================================================================

BEGIN TRANSACTION;

-- =============================================================================
-- 1. chart_color_palettes: カラーパレットマスタを淡いトーンに更新
-- =============================================================================
-- 旧色 → 新色のマッピング
UPDATE chart_color_palettes SET color_code = '#B9DEFA', updated_at = GETDATE() WHERE color_code = '#3B82F6';  -- Blue → 淡い青
UPDATE chart_color_palettes SET color_code = '#B7FFB7', updated_at = GETDATE() WHERE color_code = '#22C55E';  -- Green → 淡い緑
UPDATE chart_color_palettes SET color_code = '#FFFF99', updated_at = GETDATE() WHERE color_code = '#EAB308';  -- Yellow → 淡い黄
UPDATE chart_color_palettes SET color_code = '#FFB3B3', updated_at = GETDATE() WHERE color_code = '#EF4444';  -- Red → 淡い赤
UPDATE chart_color_palettes SET color_code = '#D4B8FF', updated_at = GETDATE() WHERE color_code = '#A855F7';  -- Purple → 淡い紫
UPDATE chart_color_palettes SET color_code = '#FFB8D4', updated_at = GETDATE() WHERE color_code = '#EC4899';  -- Pink → 淡いピンク
UPDATE chart_color_palettes SET color_code = '#B8BBFF', updated_at = GETDATE() WHERE color_code = '#6366F1';  -- Indigo → 淡いインディゴ
UPDATE chart_color_palettes SET color_code = '#A8E8E0', updated_at = GETDATE() WHERE color_code = '#14B8A6';  -- Teal → 淡いティール
UPDATE chart_color_palettes SET color_code = '#FFD4A8', updated_at = GETDATE() WHERE color_code = '#F97316';  -- Orange → 淡いオレンジ
UPDATE chart_color_palettes SET color_code = '#93E5E5', updated_at = GETDATE() WHERE color_code = '#06B6D4';  -- Cyan → 淡いシアン
UPDATE chart_color_palettes SET color_code = '#C8D5E0', updated_at = GETDATE() WHERE color_code = '#64748B';  -- Slate → 淡いスレート
UPDATE chart_color_palettes SET color_code = '#A8E8D0', updated_at = GETDATE() WHERE color_code = '#10B981';  -- Emerald → 淡いエメラルド

-- パレット名も更新
UPDATE chart_color_palettes SET name = N'Pastel Blue'    WHERE color_code = '#B9DEFA';
UPDATE chart_color_palettes SET name = N'Pastel Green'   WHERE color_code = '#B7FFB7';
UPDATE chart_color_palettes SET name = N'Pastel Yellow'  WHERE color_code = '#FFFF99';
UPDATE chart_color_palettes SET name = N'Pastel Red'     WHERE color_code = '#FFB3B3';
UPDATE chart_color_palettes SET name = N'Pastel Purple'  WHERE color_code = '#D4B8FF';
UPDATE chart_color_palettes SET name = N'Pastel Pink'    WHERE color_code = '#FFB8D4';
UPDATE chart_color_palettes SET name = N'Pastel Indigo'  WHERE color_code = '#B8BBFF';
UPDATE chart_color_palettes SET name = N'Pastel Teal'    WHERE color_code = '#A8E8E0';
UPDATE chart_color_palettes SET name = N'Pastel Orange'  WHERE color_code = '#FFD4A8';
UPDATE chart_color_palettes SET name = N'Pastel Cyan'    WHERE color_code = '#93E5E5';
UPDATE chart_color_palettes SET name = N'Pastel Slate'   WHERE color_code = '#C8D5E0';
UPDATE chart_color_palettes SET name = N'Pastel Emerald' WHERE color_code = '#A8E8D0';

-- =============================================================================
-- 2. chart_color_settings: 案件カラー設定を淡いトーンに更新
-- =============================================================================
UPDATE chart_color_settings SET color_code = '#B9DEFA', updated_at = GETDATE() WHERE color_code = '#3B82F6';  -- Blue → 淡い青
UPDATE chart_color_settings SET color_code = '#B7FFB7', updated_at = GETDATE() WHERE color_code = '#22C55E';  -- Green → 淡い緑
UPDATE chart_color_settings SET color_code = '#FFFF99', updated_at = GETDATE() WHERE color_code = '#EAB308';  -- Yellow → 淡い黄
UPDATE chart_color_settings SET color_code = '#FFB3B3', updated_at = GETDATE() WHERE color_code = '#EF4444';  -- Red → 淡い赤
UPDATE chart_color_settings SET color_code = '#D4B8FF', updated_at = GETDATE() WHERE color_code = '#A855F7';  -- Purple → 淡い紫
UPDATE chart_color_settings SET color_code = '#FFB8D4', updated_at = GETDATE() WHERE color_code = '#EC4899';  -- Pink → 淡いピンク
UPDATE chart_color_settings SET color_code = '#B8BBFF', updated_at = GETDATE() WHERE color_code = '#6366F1';  -- Indigo → 淡いインディゴ
UPDATE chart_color_settings SET color_code = '#A8E8E0', updated_at = GETDATE() WHERE color_code = '#14B8A6';  -- Teal → 淡いティール
UPDATE chart_color_settings SET color_code = '#FFD4A8', updated_at = GETDATE() WHERE color_code = '#F97316';  -- Orange → 淡いオレンジ
UPDATE chart_color_settings SET color_code = '#93E5E5', updated_at = GETDATE() WHERE color_code = '#06B6D4';  -- Cyan → 淡いシアン

-- 間接作業のグレー系はそのまま維持（変更なし）

-- =============================================================================
-- 3. chart_view_project_items: チャートビュー案件項目の色を淡いトーンに更新
-- =============================================================================
UPDATE chart_view_project_items SET color_code = '#B9DEFA' WHERE color_code = '#3b82f6';  -- Blue → 淡い青
UPDATE chart_view_project_items SET color_code = '#B7FFB7' WHERE color_code = '#10b981';  -- Green → 淡い緑
UPDATE chart_view_project_items SET color_code = '#FFFF99' WHERE color_code = '#f59e0b';  -- Yellow → 淡い黄
UPDATE chart_view_project_items SET color_code = '#FFB3B3' WHERE color_code = '#ef4444';  -- Red → 淡い赤
UPDATE chart_view_project_items SET color_code = '#D4B8FF' WHERE color_code = '#8b5cf6';  -- Purple → 淡い紫

-- =============================================================================
-- 4. chart_view_capacity_items: キャパシティ項目の色を柔らかいトーンに更新
-- =============================================================================
UPDATE chart_view_capacity_items SET color_code = '#E88888' WHERE color_code = '#dc2626';  -- 赤 → 柔らかい赤
UPDATE chart_view_capacity_items SET color_code = '#F49E02' WHERE color_code = '#ea580c';  -- オレンジ → 暖かいオレンジ
UPDATE chart_view_capacity_items SET color_code = '#88C9A0' WHERE color_code = '#059669';  -- 緑 → 柔らかい緑

COMMIT TRANSACTION;

PRINT 'Migration 006: Chart colors updated to pastel tones successfully.';
GO

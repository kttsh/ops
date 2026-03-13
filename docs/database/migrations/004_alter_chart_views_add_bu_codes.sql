-- =============================================================================
-- chart_views テーブルに business_unit_codes カラムを追加
-- BU選択状態をJSON文字列として保存するためのカラム
-- =============================================================================

ALTER TABLE chart_views
ADD business_unit_codes NVARCHAR(MAX) NULL;

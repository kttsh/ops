-- =============================================================================
-- マイグレーション 001: projects テーブルに属性カラムを追加
-- 対象: Microsoft SQL Server
-- コミット: 54795c8 (feat: implement project effort import improvement)
-- =============================================================================

-- 7つの新規カラムを追加（すべて NULL 許容）
ALTER TABLE projects ADD fiscal_year INT NULL;
ALTER TABLE projects ADD nickname NVARCHAR(120) NULL;
ALTER TABLE projects ADD customer_name NVARCHAR(120) NULL;
ALTER TABLE projects ADD order_number NVARCHAR(120) NULL;
ALTER TABLE projects ADD calculation_basis NVARCHAR(500) NULL;
ALTER TABLE projects ADD remarks NVARCHAR(500) NULL;
ALTER TABLE projects ADD region NVARCHAR(100) NULL;

PRINT 'Migration 001 completed: Added 7 columns to projects table.';
GO

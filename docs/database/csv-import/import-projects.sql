-- =============================================================================
-- CSVインポート: 案件情報 + 月別工数
-- 対象: Microsoft SQL Server
-- 使用方法: docs/database/csv-import/README.md を参照
-- =============================================================================

-- =============================================================================
-- 1. 一時テーブル作成
-- =============================================================================

-- 案件情報CSVの一時テーブル
IF OBJECT_ID('tempdb..#tmp_projects') IS NOT NULL DROP TABLE #tmp_projects;
CREATE TABLE #tmp_projects (
    project_code       NVARCHAR(120) NOT NULL,
    name               NVARCHAR(120) NOT NULL,
    business_unit_code VARCHAR(20)   NOT NULL,
    project_type_code  VARCHAR(20)   NULL,
    start_year_month   CHAR(6)       NOT NULL,
    total_manhour      INT           NOT NULL,
    status             VARCHAR(20)   NOT NULL,
    duration_months    INT           NULL
);

-- 月別工数CSVの一時テーブル
IF OBJECT_ID('tempdb..#tmp_project_load') IS NOT NULL DROP TABLE #tmp_project_load;
CREATE TABLE #tmp_project_load (
    project_code NVARCHAR(120) NOT NULL,
    year_month   CHAR(6)       NOT NULL,
    manhour      DECIMAL(10,2) NOT NULL
);

-- =============================================================================
-- 2. CSVデータ取り込み（BULK INSERT）
-- =============================================================================
-- ※ファイルパスは実環境に合わせて変更してください

BULK INSERT #tmp_projects
FROM 'C:\import\projects.csv'  -- ★ ファイルパスを変更
WITH (
    FORMAT = 'CSV',
    FIRSTROW = 2,          -- ヘッダー行をスキップ
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    CODEPAGE = '65001',    -- UTF-8
    TABLOCK
);

BULK INSERT #tmp_project_load
FROM 'C:\import\project_load.csv'  -- ★ ファイルパスを変更
WITH (
    FORMAT = 'CSV',
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    CODEPAGE = '65001',
    TABLOCK
);

PRINT '✓ CSVデータを一時テーブルに取り込みました';
GO

-- =============================================================================
-- 3. バリデーション
-- =============================================================================

-- 3-1. business_unit_code の存在チェック
IF EXISTS (
    SELECT 1 FROM #tmp_projects tp
    WHERE NOT EXISTS (
        SELECT 1 FROM business_units bu
        WHERE bu.business_unit_code = tp.business_unit_code
          AND bu.deleted_at IS NULL
    )
)
BEGIN
    PRINT '✗ エラー: 存在しない business_unit_code が含まれています:';
    SELECT DISTINCT tp.business_unit_code
    FROM #tmp_projects tp
    WHERE NOT EXISTS (
        SELECT 1 FROM business_units bu
        WHERE bu.business_unit_code = tp.business_unit_code
          AND bu.deleted_at IS NULL
    );
    RAISERROR('バリデーションエラー: business_unit_code', 16, 1);
    RETURN;
END

-- 3-2. project_type_code の存在チェック（NULLは許可）
IF EXISTS (
    SELECT 1 FROM #tmp_projects tp
    WHERE tp.project_type_code IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM project_types pt
        WHERE pt.project_type_code = tp.project_type_code
          AND pt.deleted_at IS NULL
    )
)
BEGIN
    PRINT '✗ エラー: 存在しない project_type_code が含まれています:';
    SELECT DISTINCT tp.project_type_code
    FROM #tmp_projects tp
    WHERE tp.project_type_code IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM project_types pt
        WHERE pt.project_type_code = tp.project_type_code
          AND pt.deleted_at IS NULL
    );
    RAISERROR('バリデーションエラー: project_type_code', 16, 1);
    RETURN;
END

-- 3-3. project_code の重複チェック（既存データとの衝突）
IF EXISTS (
    SELECT 1 FROM #tmp_projects tp
    INNER JOIN projects p ON p.project_code = tp.project_code AND p.deleted_at IS NULL
)
BEGIN
    PRINT '✗ エラー: 既存の project_code と重複しています:';
    SELECT tp.project_code
    FROM #tmp_projects tp
    INNER JOIN projects p ON p.project_code = tp.project_code AND p.deleted_at IS NULL;
    RAISERROR('バリデーションエラー: project_code 重複', 16, 1);
    RETURN;
END

-- 3-4. 工数CSVの project_code がCSV内の案件に存在するかチェック
IF EXISTS (
    SELECT 1 FROM #tmp_project_load tl
    WHERE NOT EXISTS (
        SELECT 1 FROM #tmp_projects tp WHERE tp.project_code = tl.project_code
    )
    AND NOT EXISTS (
        SELECT 1 FROM projects p WHERE p.project_code = tl.project_code AND p.deleted_at IS NULL
    )
)
BEGIN
    PRINT '✗ エラー: 工数CSVに不明な project_code が含まれています:';
    SELECT DISTINCT tl.project_code
    FROM #tmp_project_load tl
    WHERE NOT EXISTS (
        SELECT 1 FROM #tmp_projects tp WHERE tp.project_code = tl.project_code
    )
    AND NOT EXISTS (
        SELECT 1 FROM projects p WHERE p.project_code = tl.project_code AND p.deleted_at IS NULL
    );
    RAISERROR('バリデーションエラー: 工数CSVの project_code', 16, 1);
    RETURN;
END

-- 3-5. status の値チェック
IF EXISTS (
    SELECT 1 FROM #tmp_projects
    WHERE status NOT IN ('ACTIVE', 'PLANNING', 'INQUIRY', 'COMPLETED', 'CANCELLED')
)
BEGIN
    PRINT '✗ エラー: 不正な status が含まれています:';
    SELECT DISTINCT status FROM #tmp_projects
    WHERE status NOT IN ('ACTIVE', 'PLANNING', 'INQUIRY', 'COMPLETED', 'CANCELLED');
    RAISERROR('バリデーションエラー: status', 16, 1);
    RETURN;
END

PRINT '✓ バリデーション完了';
GO

-- =============================================================================
-- 4. データ投入（トランザクション）
-- =============================================================================

BEGIN TRANSACTION;

BEGIN TRY
    -- 4-1. projects テーブルに INSERT
    INSERT INTO projects (
        project_code, name, business_unit_code, project_type_code,
        start_year_month, total_manhour, status, duration_months
    )
    SELECT
        project_code, name, business_unit_code, project_type_code,
        start_year_month, total_manhour, status, duration_months
    FROM #tmp_projects;

    PRINT '✓ projects: ' + CAST(@@ROWCOUNT AS VARCHAR) + ' 件挿入';

    -- 4-2. project_cases テーブルに「ベースケース」を自動作成
    INSERT INTO project_cases (
        project_id, case_name, is_primary, description,
        calculation_type, start_year_month, duration_months, total_manhour
    )
    SELECT
        p.project_id,
        N'ベースケース',
        1,                   -- is_primary = true
        N'CSVインポートにより自動作成',
        'MANUAL',
        p.start_year_month,
        p.duration_months,
        p.total_manhour
    FROM projects p
    INNER JOIN #tmp_projects tp ON tp.project_code = p.project_code
    WHERE p.deleted_at IS NULL;

    PRINT '✓ project_cases: ' + CAST(@@ROWCOUNT AS VARCHAR) + ' 件挿入';

    -- 4-3. project_load テーブルに月別工数を INSERT
    INSERT INTO project_load (project_case_id, year_month, manhour)
    SELECT
        pc.project_case_id,
        tl.year_month,
        tl.manhour
    FROM #tmp_project_load tl
    INNER JOIN projects p ON p.project_code = tl.project_code AND p.deleted_at IS NULL
    INNER JOIN project_cases pc ON pc.project_id = p.project_id
        AND pc.is_primary = 1 AND pc.deleted_at IS NULL;

    PRINT '✓ project_load: ' + CAST(@@ROWCOUNT AS VARCHAR) + ' 件挿入';

    COMMIT TRANSACTION;
    PRINT '✓ インポート完了';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT '✗ エラーが発生しました。ロールバックしました。';
    PRINT ERROR_MESSAGE();
    THROW;
END CATCH
GO

-- =============================================================================
-- 5. クリーンアップ
-- =============================================================================
DROP TABLE IF EXISTS #tmp_projects;
DROP TABLE IF EXISTS #tmp_project_load;

PRINT '✓ 一時テーブルを削除しました';
GO

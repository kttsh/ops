# CSV インポート手順書

CSVファイルから案件情報と月別工数を一括投入するためのガイド。

## 前提条件

- マスタデータ（`business_units`, `project_types`）が投入済みであること
- SQL Server に接続できる環境があること（SSMS 等）
- CSVファイルは UTF-8（BOM なし）で保存すること

## CSVフォーマット

### 1. 案件情報: `projects.csv`

| カラム | 型 | 必須 | 説明 | 例 |
|---|---|---|---|---|
| project_code | 文字列 | ○ | 案件コード（一意） | P-2025-001 |
| name | 文字列 | ○ | 案件名 | A社プラント建設案件 |
| business_unit_code | 文字列 | ○ | BUコード | PLANT |
| project_type_code | 文字列 | | 案件タイプコード | EPC |
| start_year_month | YYYYMM | ○ | 開始年月 | 202504 |
| total_manhour | 整数 | ○ | 総工数（人時） | 48000 |
| status | 文字列 | ○ | ステータス | ACTIVE |
| duration_months | 整数 | | 期間（月数） | 24 |

**status の有効値:** `ACTIVE`, `PLANNING`, `INQUIRY`, `COMPLETED`, `CANCELLED`

**business_unit_code の例:** `PLANT`, `TRANS`, `CO2`

**project_type_code の例:** `EPC`, `SERVICE`, `VICHLE`, `INQUIRY`, `FEED`, `FS`, `SUPPORT`, `OTHER`

#### サンプル

```csv
project_code,name,business_unit_code,project_type_code,start_year_month,total_manhour,status,duration_months
P-2027-001,X社プラント増設,PLANT,EPC,202704,36000,PLANNING,18
P-2027-002,Y社設備保守,PLANT,SERVICE,202704,8000,PLANNING,12
T-2027-001,Z市車両更新,TRANS,VICHLE,202707,20000,INQUIRY,15
```

### 2. 月別工数: `project_load.csv`

| カラム | 型 | 必須 | 説明 | 例 |
|---|---|---|---|---|
| project_code | 文字列 | ○ | 案件コード（projects.csv と対応） | P-2027-001 |
| year_month | YYYYMM | ○ | 対象年月 | 202704 |
| manhour | 小数 | ○ | 工数（人時） | 1500.00 |

#### サンプル

```csv
project_code,year_month,manhour
P-2027-001,202704,1200.00
P-2027-001,202705,1600.00
P-2027-001,202706,2000.00
P-2027-001,202707,2400.00
P-2027-001,202708,2800.00
P-2027-001,202709,2800.00
P-2027-002,202704,600.00
P-2027-002,202705,700.00
P-2027-002,202706,700.00
T-2027-001,202707,1000.00
T-2027-001,202708,1200.00
T-2027-001,202709,1400.00
```

## 実行手順

### Step 1: CSV ファイルの準備

上記フォーマットに従い、2つのCSVファイルを作成する。

- `projects.csv` — 案件情報
- `project_load.csv` — 月別工数

ファイルは SQL Server からアクセス可能なパスに配置する（例: `C:\import\`）。

### Step 2: SQL ファイルのパス修正

`import-projects.sql` 内の BULK INSERT パスを実環境に合わせて修正する。

```sql
-- ★ この2箇所を修正
BULK INSERT #tmp_projects
FROM 'C:\import\projects.csv'  -- ← 実際のパスに変更

BULK INSERT #tmp_project_load
FROM 'C:\import\project_load.csv'  -- ← 実際のパスに変更
```

### Step 3: SQL 実行

SSMS 等で `import-projects.sql` を実行する。

スクリプトは以下の順序で処理を行う:

1. 一時テーブル作成
2. CSV データを一時テーブルに BULK INSERT
3. バリデーション（マスタ存在チェック、重複チェック等）
4. トランザクション内でデータ投入
   - `projects` に案件を INSERT
   - `project_cases` に「ベースケース」を自動作成（is_primary=1）
   - `project_load` に月別工数を INSERT
5. 一時テーブルのクリーンアップ

### Step 4: 確認

```sql
-- 投入件数の確認
SELECT COUNT(*) AS project_count FROM projects WHERE deleted_at IS NULL;
SELECT COUNT(*) AS case_count FROM project_cases WHERE deleted_at IS NULL;
SELECT COUNT(*) AS load_count FROM project_load;

-- 投入データのサマリ
SELECT
    p.project_code,
    p.name,
    p.business_unit_code,
    p.total_manhour,
    COUNT(pl.project_load_id) AS load_months,
    SUM(pl.manhour) AS total_load
FROM projects p
INNER JOIN project_cases pc ON pc.project_id = p.project_id AND pc.is_primary = 1
LEFT JOIN project_load pl ON pl.project_case_id = pc.project_case_id
WHERE p.deleted_at IS NULL
GROUP BY p.project_code, p.name, p.business_unit_code, p.total_manhour
ORDER BY p.project_code;
```

## バリデーション内容

スクリプトは投入前に以下を自動チェックする:

| チェック項目 | 内容 |
|---|---|
| business_unit_code | マスタテーブルに存在するか |
| project_type_code | マスタテーブルに存在するか（NULL は許可） |
| project_code 重複 | 既存データとの重複がないか |
| 工数の project_code | 案件 CSV または既存データに存在するか |
| status | 有効な値か |

エラー時はメッセージとともに対象データが表示され、データは一切投入されない。

## 注意事項

- 各案件に対して「ベースケース」（is_primary=1）が1件自動作成される。複数ケースが必要な場合は別途追加すること。
- project_code は既存データとの一意性がチェックされるため、既存案件の工数を更新したい場合は別の手順が必要。
- 既存案件の工数のみ追加したい場合は、`project_load.csv` にのみデータを記載し、`projects.csv` は空（ヘッダー行のみ）にすることも可能。ただしその場合、該当案件のベースケース（is_primary=1）が存在している必要がある。

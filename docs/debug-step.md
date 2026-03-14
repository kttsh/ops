確認すべきSQL

  以下のSQLを順番に実行して原因を特定してください。

  SQL 1: インポートしたデータが project_load テーブルに存在するか

  -- 直近インポートされた工数データを確認（updated_at 降順で最新を表示）
  SELECT TOP 50
      pl.project_load_id,
      pl.project_case_id,
      pl.year_month,
      pl.manhour,
      pl.created_at,
      pl.updated_at
  FROM project_load pl
  ORDER BY pl.updated_at DESC;

  SQL 2: 該当案件のケースが is_primary かどうか

  -- 案件コードまたは案件名で検索（適宜変更してください）
  SELECT
      p.project_id,
      p.project_code,
      p.name AS project_name,
      p.business_unit_code,
      p.deleted_at AS project_deleted_at,
      pc.project_case_id,
      pc.case_name,
      pc.is_primary,
      pc.deleted_at AS case_deleted_at
  FROM projects p
  JOIN project_cases pc ON p.project_id = pc.project_id
  WHERE p.project_code IN ('ここにインポートした案件コードを入力')
     -- または: p.name LIKE '%案件名%'
  ORDER BY p.project_id, pc.project_case_id;

  SQL 3: チャートのSQLと同じ条件でデータを取得してみる

  -- workload画面のチャートが実行するSQLと同等のクエリ
  -- BUコードと期間を画面の選択値に合わせてください
  SELECT
      p.project_id AS projectId,
      p.name AS projectName,
      p.project_type_code AS projectTypeCode,
      pl.year_month AS yearMonth,
      SUM(pl.manhour) AS manhour
  FROM project_load pl
  JOIN project_cases pc ON pl.project_case_id = pc.project_case_id
  JOIN projects p ON pc.project_id = p.project_id
  WHERE p.business_unit_code IN ('ここにBUコードを入力')
    AND pl.year_month BETWEEN '202504' AND '202603'  -- 画面の期間に合わせる
    AND pc.is_primary = 1
    AND p.deleted_at IS NULL
    AND pc.deleted_at IS NULL
  GROUP BY p.project_id, p.name, p.project_type_code, pl.year_month
  ORDER BY p.project_type_code, p.name, pl.year_month;

  SQL 4: is_primary を外して全ケースのデータを確認

  -- is_primary の制約を外して、インポートしたデータが別ケースにないか確認
  SELECT
      p.project_id,
      p.name AS project_name,
      pc.project_case_id,
      pc.case_name,
      pc.is_primary,
      pl.year_month,
      pl.manhour
  FROM project_load pl
  JOIN project_cases pc ON pl.project_case_id = pc.project_case_id
  JOIN projects p ON pc.project_id = p.project_id
  WHERE p.business_unit_code IN ('ここにBUコードを入力')
    AND pl.year_month BETWEEN '202504' AND '202603'
    AND p.deleted_at IS NULL
    AND pc.deleted_at IS NULL
  ORDER BY p.project_id, pc.is_primary DESC, pl.year_month;

  SQL 5: ソフトデリート確認

  -- 直近更新された案件がソフトデリートされていないか
  SELECT
      p.project_id,
      p.project_code,
      p.name,
      p.deleted_at
  FROM projects p
  WHERE p.updated_at > DATEADD(HOUR, -1, GETDATE())
    AND p.deleted_at IS NOT NULL;

  ---
  推奨する調査手順

  1. まずブラウザをリロードしてチャートが表示されるか確認（キャッシュ問題の切り分け）
  2. リロードしても表示されない場合、SQL 1 でデータがDBに入っているか確認
  3. SQL 2 で is_primary フラグとBUコードを確認
  4. SQL 3 vs SQL 4 の結果を比較して、is_primary フィルタで除外されていないか特定

  もしキャッシュが原因の場合は、インポート後に workloadKeys も無効化するよう修正が必要です。修正する場合はお声がけください。
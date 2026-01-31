# Implementation Plan

- [x] 1. 型定義・Zodバリデーションスキーマの作成
- [x] 1.1 案件項目のZodスキーマとTypeScript型を定義する
  - 作成用スキーマ: projectId（必須・正の整数）、projectCaseId（任意・正の整数またはnull）、displayOrder（任意・非負整数・デフォルト0）、isVisible（任意・boolean・デフォルトtrue）
  - 更新用スキーマ: projectCaseId（任意・正の整数またはnull）、displayOrder（任意・非負整数）、isVisible（任意・boolean）。projectId は含めない（変更不可）
  - 一括表示順序更新用スキーマ: items 配列（各要素に chartViewProjectItemId と displayOrder を含む、最低1件）
  - DB行型: chart_view_project_items の全カラムに加え、JOINで取得する案件コード・案件名・ケース名を含む
  - APIレスポンス型: camelCase フィールドに加え、project と projectCase のネストオブジェクトを含む
  - Zodスキーマから TypeScript 型を導出する（z.infer）
  - _Requirements: 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.5_

- [x] 2. データアクセス層の実装
- [x] 2.1 基本的なCRUDクエリを実装する
  - 一覧取得: chart_view_project_items を projects（INNER JOIN）と project_cases（LEFT JOIN）で結合し、display_order 昇順で取得する
  - 単一取得: 同じ JOIN 構成で指定IDのレコードを取得する。見つからない場合は undefined を返す
  - 新規作成: INSERT で案件項目を登録し、OUTPUT 句で採番されたIDを取得後、JOIN 込みの完全なレコードを返す
  - 更新: 指定されたフィールドのみ動的に SET 句を構築し、updated_at も更新する。更新後に JOIN 込みのレコードを返す
  - 物理削除: DELETE FROM で該当レコードを削除する
  - すべてのクエリはパラメータ化し、SQLインジェクションを防止する
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [x] 2.2 (P) 外部キー存在検証メソッドを実装する
  - チャートビューの存在検証: chart_views テーブルで deleted_at IS NULL 条件付き EXISTS 句
  - 案件の存在検証: projects テーブルで deleted_at IS NULL 条件付き EXISTS 句
  - 案件ケースの所属検証: project_cases テーブルで指定の project_id に属し、deleted_at IS NULL である EXISTS 句
  - _Requirements: 1.2, 1.3, 3.5, 3.6, 3.7, 4.5, 8.6_

- [x] 2.3 一括表示順序更新のトランザクション処理を実装する
  - トランザクション内で複数レコードの display_order と updated_at を更新する
  - エラー発生時はロールバックする
  - _Requirements: 6.1_

- [x] 3. Transform層の実装
- [x] 3.1 (P) DB行からAPIレスポンスへの変換関数を実装する
  - snake_case の DB カラムを camelCase のレスポンスフィールドに変換する
  - 日時フィールド（created_at, updated_at）を ISO 8601 文字列に変換する
  - JOIN カラム（project_code, project_name）を project ネストオブジェクトに変換する
  - case_name を projectCase ネストオブジェクトに変換する（project_case_id が null の場合は null）
  - _Requirements: 7.3, 7.4, 7.5_

- [x] 4. サービス層の実装
- [x] 4.1 一覧取得・単一取得のビジネスロジックを実装する
  - 一覧取得: チャートビューの存在を検証し、不存在・論理削除済みなら 404 を返す。取得した行をレスポンス型に変換して返す
  - 単一取得: 案件項目の存在を確認し、chartViewId の所属が一致しなければ 404 を返す
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3_

- [x] 4.2 新規作成のビジネスロジックを実装する
  - チャートビューの存在を検証する（不存在・論理削除済みなら 404）
  - 指定された案件の存在を検証する（不存在なら 422）
  - projectCaseId が指定されている場合、案件ケースが指定の案件に所属するか検証する（不存在・所属不一致なら 422）
  - データ層の作成メソッドを呼び出し、レスポンス型に変換して返す
  - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 4.3 更新・削除のビジネスロジックを実装する
  - 更新: 案件項目の存在・chartViewId 所属を確認後、projectCaseId が指定されている場合は既存の projectId との整合性を検証する。projectId の変更は受け付けない
  - 削除: 案件項目の存在・chartViewId 所属を確認後、物理削除を実行する
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3_

- [x] 4.4 一括表示順序更新のビジネスロジックを実装する
  - チャートビューの存在を検証する
  - items 配列内の全IDが指定の chartViewId に所属するか検証する（所属しないIDがあれば 422）
  - データ層のトランザクション処理を呼び出し、更新後の一覧をレスポンス型に変換して返す
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 5. ルート層の実装とアプリケーション統合
- [x] 5.1 HTTPエンドポイントを定義する
  - GET / : 一覧取得。chartViewId をパスパラメータから取得し、サービス層を呼び出す
  - GET /:id : 単一取得。chartViewId と id をパスパラメータから取得する
  - POST / : 新規作成。作成用 Zod スキーマで JSON ボディをバリデーション。201 Created と Location ヘッダを返す
  - PUT /display-order : 一括表示順序更新。/:id より前に定義してルート競合を回避する
  - PUT /:id : 更新。更新用 Zod スキーマで JSON ボディをバリデーション
  - DELETE /:id : 物理削除。204 No Content を返す
  - パスパラメータ chartViewId と id を parseIntParam で正の整数としてバリデーションする
  - _Requirements: 1.1, 2.1, 3.1, 3.2, 3.4, 4.1, 4.4, 5.1, 6.1, 6.4, 7.1, 7.2, 8.4_

- [x] 5.2 ルートをアプリケーションにマウントする
  - `/chart-views/:chartViewId/project-items` パスでネストされたルートをマウントする
  - ルート型をエクスポートする
  - _Requirements: 1.1, 2.1_

- [x] 6. ユニットテストの実装
- [x] 6.1 ルート層のテストを実装する
  - 一覧取得: 正常系（200、項目リスト返却）、空リスト、親リソース不存在（404）
  - 単一取得: 正常系（200）、項目不存在（404）、所属不一致（404）
  - 新規作成: 正常系（201、Location ヘッダ）、バリデーションエラー（422）、案件不存在（422）、案件ケース所属不一致（422）、チャートビュー不存在（404）
  - 更新: 正常系（200）、項目不存在（404）、バリデーションエラー（422）、projectCaseId 検証エラー（422）
  - 削除: 正常系（204）、項目不存在（404）、所属不一致（404）
  - 一括表示順序更新: 正常系（200）、所属不一致ID（422）、バリデーションエラー（422）
  - サービス層をモックし、app.request() でHTTPリクエストをシミュレートする
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 6.2 (P) サービス層のテストを実装する
  - findAll: 親リソース検証とデータ層呼び出し・Transform適用の検証
  - findById: 正常系・404例外・所属チェックの検証
  - create: FK存在検証（chartView, project, projectCase）の正常系・エラー系
  - update: projectCaseId の整合性検証（既存 projectId との所属チェック）
  - delete: 正常系・404例外・所属チェックの検証
  - updateDisplayOrder: 所属チェック・更新後一覧返却の検証
  - データ層をモックし、各メソッドの呼び出しと戻り値を検証する
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 6.3 (P) データ層のテストを実装する
  - findAll: JOIN付きSQL実行と display_order ソートの検証
  - findById: JOIN付きパラメータ化クエリの検証
  - create: INSERT + OUTPUT + findById 連携の検証
  - update: 動的SET句の生成検証
  - deleteById: 物理削除（DELETE FROM）の検証
  - updateDisplayOrders: トランザクション内ループUPDATEの検証
  - chartViewExists / projectExists / projectCaseBelongsToProject: EXISTS句の検証
  - mssql の getPool / request / input / query をモックする
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

# 実装計画

- [x] 1. Git ブランチの作成と作業開始
  - main ブランチの最新を取得し、`spec/projects-crud-api` ブランチを作成する
  - specId（`projects-crud-api`）と `.kiro/specs/projects-crud-api/` のディレクトリ名を一致させる
  - リモートに push して追跡ブランチを設定する

- [x] 2. 型定義とスキーマの作成
- [x] 2.1 (P) 案件の Zod スキーマと TypeScript 型を定義する
  - 案件作成用スキーマを定義する: projectCode（1〜120文字）、name（1〜120文字）、businessUnitCode（1〜20文字、英数字・ハイフン・アンダースコア）、startYearMonth（YYYYMM形式の6桁数字）、totalManhour（正の整数）、status（1〜20文字）を必須フィールドとする
  - 任意フィールドとして projectTypeCode（1〜20文字、英数字・ハイフン・アンダースコア）と durationMonths（正の整数）を含める
  - 案件更新用スキーマを定義する: 全フィールドを optional とし、少なくとも1つのフィールドが存在することを `.refine()` で保証する。projectTypeCode と durationMonths は null 送信で値の解除を可能にする
  - 一覧取得用のクエリスキーマを既存のページネーションスキーマを拡張して定義する: `filter[includeDisabled]`（boolean、デフォルト false）、`filter[businessUnitCode]`（optional 文字列）、`filter[status]`（optional 文字列）
  - DB 行型（snake_case）を定義する: JOIN 結果の `business_unit_name` と `project_type_name` を含める。`project_type_code`、`project_type_name`、`duration_months`、`deleted_at` は null 許容とする
  - API レスポンス型（camelCase）を定義する: `projectId`、`projectCode`、`name`、`businessUnitCode`、`businessUnitName`、`projectTypeCode`、`projectTypeName`、`startYearMonth`、`totalManhour`、`status`、`durationMonths`、`createdAt`、`updatedAt`
  - _Requirements: 3.5, 3.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 8.3, 8.5, 8.6_

- [x] 2.2 (P) DB 行から API レスポンスへの変換処理を実装する
  - snake_case の DB 行型を camelCase の API レスポンス型に変換する関数を作成する
  - Date 型の created_at と updated_at を ISO 8601 文字列に変換する
  - null 許容フィールド（projectTypeCode、projectTypeName、durationMonths）をそのまま保持する
  - _Requirements: 1.5, 2.2, 4.6, 8.3, 8.4, 8.5_

- [x] 3. データアクセス層の実装
- [x] 3.1 案件一覧取得のデータアクセスを実装する
  - business_units テーブルとの INNER JOIN、project_types テーブルとの LEFT JOIN で名称を取得するクエリを組み立てる
  - ページネーション（OFFSET/FETCH）を適用する
  - `filter[includeDisabled]` が false の場合は `deleted_at IS NULL` 条件を追加する
  - `filter[businessUnitCode]` が指定された場合は該当条件を WHERE 句に追加する
  - `filter[status]` が指定された場合は該当条件を WHERE 句に追加する
  - 総件数カウントクエリも同じフィルタ条件を適用する
  - デフォルトソート順は `project_id ASC` とする
  - 全パラメータはパラメータバインディングで渡す
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 3.2 案件単一取得・検索のデータアクセスを実装する
  - ID による単一取得（JOIN 付き、`deleted_at IS NULL` 条件付き）を実装する
  - ID による取得（論理削除済みを含む、JOIN 付き）を実装する
  - projectCode による検索（有効な案件のみ）を実装する
  - _Requirements: 2.1, 2.2, 2.3, 3.3, 4.4, 6.4_

- [x] 3.3 案件の作成・更新・削除・復元のデータアクセスを実装する
  - 案件 INSERT クエリを実装する。OUTPUT 句では JOIN カラムを取得できないため、INSERT 後に findById で完全な行を返す
  - 案件 UPDATE クエリを実装する。指定されたフィールドのみ SET 句に含め、`updated_at = GETDATE()` を常に付与する。更新後に JOIN 付きの行を返す
  - 論理削除クエリを実装する: `deleted_at = GETDATE()` と `updated_at = GETDATE()` を設定する
  - 復元クエリを実装する: `deleted_at = NULL` と `updated_at = GETDATE()` を設定する
  - 参照チェックを実装する: project_cases テーブルに `deleted_at IS NULL` の有効なレコードが存在するか確認する
  - _Requirements: 3.1, 4.1, 4.5, 5.1, 5.2, 5.4, 6.1_

- [x] 4. サービス層の実装
- [x] 4.1 案件一覧取得・単一取得のビジネスロジックを実装する
  - 一覧取得: データアクセス層を呼び出し、取得結果を変換してページネーション情報とともに返す
  - 単一取得: ID でデータアクセス層を呼び出し、見つからない場合は 404 エラーを返す
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3_

- [x] 4.2 案件作成のビジネスロジックを実装する
  - 指定された businessUnitCode が business_units テーブルに存在するかチェックし、存在しなければ 422 エラーを返す
  - projectTypeCode が指定されている場合、project_types テーブルに存在するかチェックし、存在しなければ 422 エラーを返す
  - projectCode が既存の有効な案件と重複していないかチェックし、重複していれば 409 エラーを返す
  - 検証を通過したらデータアクセス層で作成し、変換したレスポンスを返す
  - _Requirements: 3.1, 3.3, 3.7, 3.8_

- [x] 4.3 案件更新のビジネスロジックを実装する
  - 対象案件が存在し、論理削除されていないことを確認する。見つからなければ 404 エラーを返す
  - businessUnitCode が指定されている場合は存在チェックを行う（422 エラー）
  - projectTypeCode が指定されている場合は存在チェックを行う（422 エラー）
  - projectCode が変更される場合、他の有効な案件（自身を除く）と重複していないかチェックする（409 エラー）
  - データアクセス層で更新し、JOIN 付きの変換レスポンスを返す
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 4.4 案件削除・復元のビジネスロジックを実装する
  - 削除: 他テーブル（project_cases）からの参照がある場合は 409 エラーを返す。参照がなければ論理削除を実行する。対象が見つからなければ 404 エラーを返す
  - 復元: 対象が存在しなければ 404 エラーを返す。論理削除されていなければ 409 エラーを返す。復元後に projectCode が他の有効な案件と重複する場合は 409 エラーを返す。検証を通過したら復元し、変換したレスポンスを返す
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4_

- [x] 5. ルート層の実装とシステム統合
- [x] 5.1 案件 CRUD の全エンドポイントを定義する
  - GET / : 一覧取得クエリスキーマでバリデーションし、サービス層を呼び出し、ページネーション付きレスポンス `{ data, meta: { pagination } }` を 200 で返す
  - GET /:id : パスパラメータを数値として取得し、サービス層を呼び出し、`{ data }` を 200 で返す
  - POST / : 作成スキーマでリクエストボディをバリデーションし、サービス層を呼び出し、Location ヘッダを設定して `{ data }` を 201 で返す
  - PUT /:id : 更新スキーマでリクエストボディをバリデーションし、サービス層を呼び出し、`{ data }` を 200 で返す
  - DELETE /:id : サービス層を呼び出し、204 No Content を返す
  - POST /:id/actions/restore : サービス層を呼び出し、`{ data }` を 200 で返す
  - メソッドチェーンで定義し、RPC 用の型をエクスポートする
  - _Requirements: 1.1, 2.1, 3.1, 3.2, 3.4, 4.1, 4.3, 5.1, 6.1, 8.1, 8.2_

- [x] 5.2 アプリケーションのエントリーポイントにルートを統合する
  - `/projects` パスで案件ルートをマウントする
  - 既存のルート定義（business-units、project-types、work-types）と並列に配置する
  - _Requirements: 10.2_

- [x] 6. テストの実装
- [x] 6.1 (P) 型定義と変換処理のテストを作成する
  - 作成スキーマの正常値・境界値・無効値（文字数超過、不正な startYearMonth 形式、負の totalManhour 等）のバリデーションテスト
  - 更新スキーマのバリデーションテスト（空ボディの拒否、null 値の許容、optional フィールド）
  - クエリスキーマのバリデーションテスト（デフォルト値、フィルタパラメータ）
  - DB 行から API レスポンスへの変換テスト（camelCase 変換、Date → ISO 文字列、null フィールドの保持）
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 9.1_

- [x] 6.2 (P) サービス層のテストを作成する
  - 一覧取得・単一取得の正常系テスト（データアクセス層をモック）
  - 作成の正常系テストと異常系テスト（projectCode 重複 409、BU 不存在 422、PT 不存在 422）
  - 更新の正常系テストと異常系テスト（404、409、422）
  - 削除の正常系テストと異常系テスト（404、参照あり 409）
  - 復元の正常系テストと異常系テスト（404、未削除 409、projectCode 重複 409）
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 6.3 ルート層の HTTP テストを作成する
  - `app.request()` を使用して各エンドポイントの正常系レスポンス（ステータスコード、レスポンス構造、Location ヘッダ）を検証する
  - バリデーションエラー時の 422 レスポンスが RFC 9457 形式であることを検証する
  - サービス層をモックし、404 / 409 エラーが正しくレスポンスされることを検証する
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 7. Pull Request の作成
  - 全タスクの実装とテストが完了していることを確認する
  - コミットメッセージは Conventional Commits 形式（`feat(projects-crud-api): ...`）で、scope に specId を使用する
  - PR タイトル: `[projects-crud-api] 案件 CRUD API の実装`
  - PR 本文は `docs/rules/git-workflow.md` の PR テンプレートに従い、概要・関連仕様・変更内容・完了タスク・テスト確認を記載する
  - `.kiro/specs/projects-crud-api/tasks.md` の完了タスクを PR 本文に反映する

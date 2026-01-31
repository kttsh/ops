# Implementation Plan

- [x] 1. バックエンドプロジェクトの初期セットアップ
- [x] 1.1 Node.js プロジェクトの初期化と依存関係の設定
  - Hono、mssql、Zod、@hono/zod-validator、dotenv などの必須パッケージをインストールする
  - TypeScript の設定（tsconfig.json）を作成し、パスエイリアスやビルド設定を整える
  - Vitest の設定ファイルを作成する
  - 開発用スクリプト（dev, build, test）を package.json に追加する
  - _Requirements: 7.1, 7.2_

- [x] 1.2 DB 接続基盤の構築
  - 環境変数（DB_SERVER, DB_PORT, DB_DATABASE, DB_USER, DB_PASSWORD）を読み込み、mssql のコネクションプールを初期化する
  - Azure SQL Database への接続に必要な暗号化設定（encrypt: true）を適用する
  - コネクションプールをシングルトンとしてエクスポートし、データ層から利用可能にする
  - 接続失敗時にプロセスを停止するエラーハンドリングを実装する
  - _Requirements: 7.1_

- [x] 1.3 Hono アプリケーションのエントリーポイントと共通ミドルウェアの構築
  - Hono アプリケーションを初期化し、logger / cors / prettyJSON ミドルウェアを設定する
  - @hono/node-server でサーバーを起動する構成を作成する
  - _Requirements: 7.1_

- [x] 2. 共通基盤（型定義・エラーハンドリング・バリデーション）
- [x] 2.1 (P) RFC 9457 エラーハンドリング基盤の構築
  - ステータスコードから RFC 9457 の問題タイプ URI とタイトルを返すヘルパー関数を実装する
  - ProblemDetail の型定義を作成する
  - グローバルエラーハンドラ（app.onError）を実装し、HTTPException を RFC 9457 形式に変換する
  - 予期しないエラーを 500 Internal Server Error として安全に返却する
  - 未定義ルートへのアクセスを 404 RFC 9457 形式で返す notFound ハンドラを実装する
  - _Requirements: 7.2_

- [x] 2.2 (P) Zod バリデーションの RFC 9457 統合
  - @hono/zod-validator のフック機能を使い、バリデーションエラーを RFC 9457 の errors 配列に変換するカスタムバリデータ関数を実装する
  - Zod の issue を pointer / keyword / message 形式にマッピングする
  - 複数のバリデーションエラーを一括で返却できるようにする
  - Content-Type に application/problem+json を設定する
  - _Requirements: 1.4, 3.4, 4.5, 8.4_

- [x] 2.3 (P) ビジネスユニットの Zod スキーマと型定義の作成
  - 作成用スキーマ：businessUnitCode（1〜20文字、英数字・ハイフン・アンダースコアのみ）、name（1〜100文字）、displayOrder（0以上の整数、デフォルト0）を定義する
  - 更新用スキーマ：name（必須）、displayOrder（任意）を定義する
  - DB 行型（snake_case）と API レスポンス型（camelCase）を分離して定義する
  - ページネーション共通スキーマ（page[number], page[size]）と論理削除フィルタ（filter[includeDisabled]）を含む一覧取得クエリスキーマを定義する
  - _Requirements: 3.2, 4.2, 8.1, 8.2, 8.3, 1.2, 1.3_

- [x] 3. データ層（生 SQL による DB アクセス）
- [x] 3.1 一覧取得と単一取得のクエリ実装
  - 論理削除されていないレコードを display_order 昇順で取得する一覧クエリを実装する（OFFSET FETCH によるページネーション対応）
  - 総件数を取得する COUNT クエリを実装する
  - filter[includeDisabled]=true 指定時に論理削除済みレコードも含める条件分岐を実装する
  - business_unit_code をキーとした単一取得クエリを実装する（deleted_at IS NULL 条件付き）
  - 論理削除済みを含む単一取得クエリを実装する（重複チェック・復元用）
  - すべてのクエリでパラメータ化クエリを使用し SQL インジェクションを防止する
  - _Requirements: 1.1, 1.2, 1.3, 2.1_

- [x] 3.2 作成・更新クエリの実装
  - INSERT INTO ... OUTPUT INSERTED.* で新規レコードを作成し、作成結果を返却するクエリを実装する
  - UPDATE ... SET ... OUTPUT INSERTED.* で既存レコードを更新し、更新結果を返却するクエリを実装する
  - 更新時に updated_at を現在日時に自動設定する
  - _Requirements: 3.1, 4.1, 4.3_

- [x] 3.3 論理削除・復元・参照整合性チェックのクエリ実装
  - deleted_at に現在日時を設定する論理削除クエリを実装する（OUTPUT INSERTED.* で結果返却）
  - deleted_at を NULL に戻す復元クエリを実装する（OUTPUT INSERTED.* で結果返却）
  - 4 つの依存テーブル（projects, headcount_plan_cases, indirect_work_cases, standard_effort_masters）に対して、アクティブレコード（deleted_at IS NULL）の EXISTS チェックを 1 クエリで実行する参照整合性チェックを実装する
  - _Requirements: 5.1, 5.3, 6.1_

- [x] 4. 変換層（DB 行 → API レスポンス変換）
  - DB の snake_case カラム名（business_unit_code, display_order, created_at, updated_at）を API の camelCase フィールド名（businessUnitCode, displayOrder, createdAt, updatedAt）に変換する関数を実装する
  - Date 型を ISO 8601 文字列に変換する
  - deleted_at フィールドをレスポンスから除外する
  - _Requirements: 7.3, 7.4_

- [x] 5. サービス層（ビジネスロジック）
- [x] 5.1 一覧取得・単一取得のビジネスロジック実装
  - 一覧取得：データ層から取得した結果を変換層でレスポンス形式に変換し、ページネーション情報とともに返却する
  - 単一取得：指定コードのビジネスユニットが存在しないか論理削除済みの場合に 404 エラーを投げる
  - _Requirements: 1.1, 2.1, 2.2_

- [x] 5.2 作成・更新のビジネスロジック実装
  - 作成：指定コードが既に存在する場合（論理削除済み含む）に 409 エラーを投げる。削除済みコードの場合は復元を案内するメッセージを含める
  - 更新：指定コードのビジネスユニットが存在しないか論理削除済みの場合に 404 エラーを投げる
  - _Requirements: 3.3, 4.4_

- [x] 5.3 削除・復元のビジネスロジック実装
  - 削除：指定コードのビジネスユニットが存在しないか既に論理削除済みの場合に 404 エラーを投げる。参照整合性チェックで依存レコードが存在する場合に 409 エラーを投げる
  - 復元：指定コードのビジネスユニットが存在しない場合に 404 エラーを投げる。まだ論理削除されていない場合に 409 エラーを投げる
  - _Requirements: 5.2, 5.3, 6.2, 6.3_

- [x] 6. ルート層（エンドポイント定義）
- [x] 6.1 一覧取得・単一取得エンドポイントの実装
  - GET /business-units：ページネーションと論理削除フィルタのクエリパラメータをバリデーションし、サービス層を呼び出して data 配列と meta.pagination を含むレスポンスを返却する
  - GET /business-units/:businessUnitCode：パスパラメータで指定されたコードのビジネスユニットを取得して data オブジェクトとして返却する
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 7.1_

- [x] 6.2 作成・更新エンドポイントの実装
  - POST /business-units：リクエストボディをバリデーションし、サービス層で作成して 201 ステータスと Location ヘッダ付きで返却する
  - PUT /business-units/:businessUnitCode：リクエストボディをバリデーションし、サービス層で更新して 200 ステータスで返却する
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.4, 4.5, 7.1_

- [x] 6.3 削除・復元エンドポイントの実装
  - DELETE /business-units/:businessUnitCode：サービス層で論理削除を実行し 204 No Content を返却する
  - POST /business-units/:businessUnitCode/actions/restore：サービス層で復元を実行し 200 ステータスで復元後のリソースを返却する
  - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 7.1_

- [x] 7. ルートマウントとシステム統合
  - エントリーポイントにビジネスユニットルートを /business-units パスでマウントする
  - グローバルエラーハンドラと notFound ハンドラが全エンドポイントに適用されることを確認する
  - 開発サーバーを起動して手動で基本動作を確認する
  - _Requirements: 7.1, 7.2_

- [x] 8. テスト
- [x] 8.1 サービス層のユニットテスト
  - データ層をモック化し、存在チェック（404）、重複チェック（409）、参照整合性チェック（409）、復元状態チェック（409）の各ビジネスルールが正しく動作することを検証する
  - _Requirements: 2.2, 3.3, 4.4, 5.2, 5.3, 6.2, 6.3_

- [x] 8.2 API 統合テスト（CRUD 全操作）
  - GET /business-units：一覧取得、ページネーション、filter[includeDisabled] の動作を検証する
  - GET /business-units/:code：正常取得と 404 エラーを検証する
  - POST /business-units：正常作成（201 + Location ヘッダ）、重複 409、バリデーション 422 を検証する
  - PUT /business-units/:code：正常更新（200）、404、バリデーション 422 を検証する
  - DELETE /business-units/:code：正常削除（204）、404、参照中 409 を検証する
  - POST .../actions/restore：正常復元（200）、404、未削除 409 を検証する
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 3.3, 3.4, 4.1, 4.4, 4.5, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 7.1, 7.2, 8.1, 8.2, 8.3, 8.4_

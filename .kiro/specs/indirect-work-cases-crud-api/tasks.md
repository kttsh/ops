# Implementation Plan

- [x] 1. 型定義とZodバリデーションスキーマの作成
- [x] 1.1 (P) 間接作業ケースのZodスキーマとTypeScript型を定義する
  - 作成用スキーマ: ケース名（必須、1〜100文字）、プライマリフラグ（任意、デフォルトfalse）、説明（任意、最大500文字、null許可）、ビジネスユニットコード（必須、1〜20文字、英数字とハイフン・アンダースコアのみ）
  - 更新用スキーマ: すべてのフィールドを任意とするが、ビジネスユニットコードは省略可能でもnull不可（DB側NOT NULL制約に準拠）
  - 一覧取得クエリスキーマ: 既存のページネーションスキーマを拡張し、論理削除済みを含めるフィルタを追加
  - DB行型（snake_case）: indirect_work_case_id, case_name, is_primary, description, business_unit_code（NOT NULL）, business_unit_name（JOINで取得、null許容）, created_at, updated_at, deleted_at
  - APIレスポンス型（camelCase）: indirectWorkCaseId, caseName, isPrimary, description, businessUnitCode, businessUnitName, createdAt, updatedAt
  - Zodスキーマから作成・更新・クエリのTypeScript型を導出する
  - _Requirements: 7.4, 7.5, 8.1, 8.2, 8.3_

- [x] 1.2 (P) DB行からAPIレスポンスへの変換関数を実装する
  - snake_caseのDB行をcamelCaseのAPIレスポンスに変換する関数を作成
  - 日時フィールド（created_at, updated_at）をISO 8601文字列に変換
  - business_unit_name → businessUnitName のマッピング（null許容）
  - _Requirements: 7.4, 7.5_

- [x] 2. データアクセス層の実装
- [x] 2.1 一覧取得と単一取得のデータアクセスを実装する
  - ページネーション付き一覧取得: business_unitsテーブルとのLEFT JOIN（bu.deleted_at IS NULL条件付き）でビジネスユニット名を取得し、ソフトデリートフィルタを適用、OFFSET/FETCHでページング
  - 単一取得（アクティブのみ）: IDを指定しLEFT JOINでビジネスユニット名を含めて返却、deleted_at IS NULLのレコードのみ対象
  - 単一取得（削除済み含む）: 復元処理や存在確認で使用するため、deleted_at条件なしで取得
  - 件数取得: ソフトデリートフィルタを考慮したCOUNTクエリ
  - すべてのクエリはパラメータ化し、SQLインジェクションを防止
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4_

- [x] 2.2 作成・更新のデータアクセスを実装する
  - 作成: ケース名、プライマリフラグ、説明、ビジネスユニットコード（必須）をINSERTし、OUTPUT句でIDを取得後、findByIdでJOIN結果を含む完全な行を返却
  - 更新: 指定されたフィールドのみ動的にSET句を構成し、updated_atを現在日時に更新。UPDATE後にfindByIdで完全な行を返却
  - INSERTとUPDATEのOUTPUT句ではJOIN結果を含められないため、後続のfindByIdで補完する設計
  - _Requirements: 3.1, 3.3, 4.1, 4.2_

- [x] 2.3 論理削除・復元・参照チェックのデータアクセスを実装する
  - 論理削除: deleted_atに現在日時を設定し、updated_atも更新
  - 復元: deleted_atをNULLに設定し、updated_atを現在日時に更新
  - 参照チェック: monthly_indirect_work_load、indirect_work_type_ratios、chart_view_indirect_work_itemsの3テーブルに対象IDを参照するレコードが存在するかEXISTSで確認（OR結合で1クエリに集約）
  - _Requirements: 5.1, 5.2, 5.4, 6.1, 6.2_

- [x] 3. サービス層の実装
- [x] 3.1 一覧取得・単一取得のビジネスロジックを実装する
  - 一覧取得: データ層から取得した結果を変換関数でAPIレスポンス形式にマッピングし、件数とともに返却
  - 単一取得: 指定IDのレコードが見つからない場合は404例外をスロー。見つかった場合は変換後に返却
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4_

- [x] 3.2 作成・更新のビジネスロジックを実装する
  - 作成: businessUnitCodeは必須のため、常に既存のビジネスユニットデータ層を使って存在確認を実施。存在しなければ422例外をスロー。データ層のcreateを呼び出し、変換後に返却
  - 更新: businessUnitCodeが指定されている場合のみ存在確認を実施。データ層のupdateを呼び出し、結果がなければ404例外をスロー
  - _Requirements: 3.1, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3.3 論理削除・復元のビジネスロジックを実装する
  - 削除: 参照チェックを実行し、参照がある場合は409例外をスロー。参照がなければ論理削除を実行し、結果がなければ404例外をスロー
  - 復元: 削除済み含むfindByIdで対象を確認。存在しなければ404例外。削除されていなければ404例外。削除済みの場合はrestoreを実行し変換後に返却
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3_

- [x] 4. ルート層の実装とシステム統合
- [x] 4.1 CRUDエンドポイントを定義する
  - GET / : 一覧取得クエリスキーマでバリデーション後、サービス層を呼び出し、ページネーション付きレスポンスを返却
  - GET /:id : パスパラメータからIDを取得し、サービス層の単一取得を呼び出す
  - POST / : 作成スキーマでバリデーション後、サービス層を呼び出し、Locationヘッダ付きで201を返却
  - PUT /:id : 更新スキーマでバリデーション後、サービス層を呼び出し、200で返却
  - DELETE /:id : サービス層の削除を呼び出し、204 No Contentを返却
  - POST /:id/actions/restore : サービス層の復元を呼び出し、200で返却
  - Honoのメソッドチェーンでルートを定義し、RPC用にルート型をエクスポート
  - _Requirements: 1.1, 2.1, 3.1, 3.2, 4.1, 5.1, 6.1, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4_

- [x] 4.2 アプリケーションにルートをマウントする
  - エントリーポイントにindirect-work-casesルートをインポートし、`/indirect-work-cases`パスでマウント
  - 既存のグローバルエラーハンドラとRFC 9457レスポンス形式がそのまま適用されることを確認
  - _Requirements: 7.3_

- [x] 5. テストの実装
- [x] 5.1 データ層のユニットテストを作成する
  - mssqlのgetPool/request/input/queryをモックし、各データアクセスメソッドのSQL実行を検証
  - findAll: LEFT JOINを含むSQLの実行、ページネーションオフセット計算、ソフトデリートフィルタの切り替え
  - findById: パラメータ化クエリの正しいID渡し
  - create: INSERT実行後のfindById連携
  - update: 動的SET句の生成（指定フィールドのみ更新される）
  - softDelete/restore: deleted_atの操作
  - hasReferences: 3テーブル（monthly_indirect_work_load, indirect_work_type_ratios, chart_view_indirect_work_items）に対するEXISTSチェック
  - _Requirements: 9.1, 9.4_

- [x] 5.2 サービス層のユニットテストを作成する
  - データ層と変換関数をモックし、ビジネスロジックを検証
  - findAll: データ層呼び出しと変換適用
  - findById: 正常系の返却と、存在しない場合の404例外
  - create: businessUnitCodeの存在チェック成功/失敗（必須フィールドのため常にチェックが実行される）、422例外の検証
  - update: 部分更新とFK存在チェック、404例外
  - delete: 参照ありの場合の409例外（3テーブル参照チェック）、参照なしの場合の正常削除
  - restore: 未削除の場合の404例外、削除済みの場合の正常復元
  - _Requirements: 9.1, 9.3_

- [x] 5.3 ルート層のユニットテストを作成する
  - サービス層をモックし、app.request()でHTTPリクエストをシミュレート
  - GET / : 200レスポンス、ページネーションメタデータ、空リスト
  - GET /:id : 200レスポンス、404エラー
  - POST / : 201レスポンスとLocationヘッダ、422バリデーションエラー（必須項目欠落：caseName, businessUnitCode、型不正、範囲外値）
  - PUT /:id : 200レスポンス、404エラー、422バリデーションエラー
  - DELETE /:id : 204レスポンス、404エラー、409参照整合性エラー
  - POST /:id/actions/restore : 200レスポンス、404エラー
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

# Implementation Plan

- [x] 1. 型定義とバリデーションスキーマの作成
- [x] 1.1 (P) 案件変更履歴の Zod スキーマと TypeScript 型を定義する
  - 作成リクエスト用スキーマを定義する（changeType: 必須・1〜50文字、fieldName: 任意・100文字以内、oldValue: 任意・1000文字以内、newValue: 任意・1000文字以内、changedBy: 必須・1〜100文字）
  - DB 行型（snake_case）を定義する（project_change_history_id, project_id, change_type, field_name, old_value, new_value, changed_by, changed_at）
  - API レスポンス型（camelCase）を定義する（projectChangeHistoryId, projectId, changeType, fieldName, oldValue, newValue, changedBy, changedAt）
  - null 許容フィールド（fieldName, oldValue, newValue）を正しく型定義する
  - _Requirements: 3.3, 6.3, 6.4_

- [x] 2. データアクセス層の実装
- [x] 2.1 (P) 案件変更履歴の DB クエリ関数群を実装する
  - 指定された案件 ID に紐づく変更履歴一覧を changed_at 降順で取得する関数を実装する
  - 変更履歴 ID を指定して単一レコードを取得する関数を実装する
  - 新しい変更履歴レコードを作成する関数を実装する（OUTPUT 句で IDENTITY 値取得後、作成したレコードを返却）
  - 変更履歴レコードを物理削除する関数を実装する
  - 案件 ID で projects テーブルを検索し、論理削除されていないレコードの存在を確認する関数を実装する
  - _Requirements: 1.1, 1.3, 2.1, 3.1, 4.1_

- [x] 3. レスポンス変換層の実装
- [x] 3.1 DB 行から API レスポンス形式への変換関数を実装する
  - snake_case フィールドを camelCase に変換する
  - changed_at を ISO 8601 文字列に変換する
  - null 許容フィールド（fieldName, oldValue, newValue）は null をそのまま維持する
  - _Requirements: 5.3, 5.4_

- [x] 4. ビジネスロジック層の実装
- [x] 4.1 案件変更履歴のサービス関数群を実装する
  - 一覧取得: 親案件の存在確認を行い、不存在または論理削除済みの場合は 404 エラーを送出する
  - 単一取得: レコードの存在確認と親案件 ID の整合性チェックを行い、不一致時は 404 エラーを送出する
  - 新規作成: 親案件の存在確認後、データ層でレコードを作成し、変換層でレスポンス形式に変換して返却する
  - 物理削除: レコードの存在確認と親案件 ID の整合性チェックを行い、存在する場合に物理削除を実行する
  - すべての操作でデータ層から取得した結果を変換層でレスポンス型に変換する
  - _Requirements: 1.4, 2.2, 2.3, 3.5, 4.2, 4.3_

- [x] 5. ルート定義とシステム統合
- [x] 5.1 案件変更履歴の HTTP エンドポイントを定義する
  - GET / でパスパラメータ projectId をバリデーション後、サービス層の一覧取得を呼び出し `{ data: [...] }` 形式で返却する
  - GET /:projectChangeHistoryId でパスパラメータをバリデーション後、サービス層の単一取得を呼び出し `{ data: {...} }` 形式で返却する
  - POST / でリクエストボディを Zod バリデーション後、サービス層の作成を呼び出し 201 + Location ヘッダで返却する
  - DELETE /:projectChangeHistoryId でパスパラメータをバリデーション後、サービス層の削除を呼び出し 204 で返却する
  - パスパラメータ（projectId, projectChangeHistoryId）は正の整数としてバリデーションし、不正値は 422 エラーで返却する
  - _Requirements: 1.1, 1.2, 2.1, 3.1, 3.2, 3.4, 4.1, 5.1, 5.2, 6.1, 6.2_

- [x] 5.2 アプリケーションのルートエントリポイントに変更履歴ルートをマウントする
  - `/projects/:projectId/change-history` パスでルートをマウントする
  - 既存のルートインポートと同じパターンでインポートを追加する
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 6. テストの実装
- [x] 6.1 案件変更履歴 API の正常系・異常系テストを実装する
  - GET / 正常系: 一覧取得、changed_at 降順ソート、data 配列形式の検証
  - GET /:id 正常系: 単一取得、data オブジェクト形式の検証
  - POST / 正常系: 作成、201 ステータス、Location ヘッダ、レスポンスボディの検証
  - DELETE /:id 正常系: 物理削除、204 No Content の検証
  - GET / 異常系: 不存在/削除済み projectId → 404 の検証
  - GET /:id 異常系: 不存在 → 404、projectId 不一致 → 404 の検証
  - POST / 異常系: バリデーション失敗 → 422、親案件不存在 → 404 の検証
  - DELETE /:id 異常系: 不存在 → 404 の検証
  - パスパラメータ不正値（非数値等）→ 422 の検証
  - Vitest + app.request() パターンで実装する
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

# Implementation Plan

- [x] 1. Zod スキーマと型定義の作成
- [x] 1.1 カラーパレットのリクエストスキーマと型を定義する
  - 作成用スキーマ: name（1〜100文字の文字列、必須）、colorCode（`#` + 6桁16進数の文字列、必須）、displayOrder（整数、任意、デフォルト0）を受け付ける
  - 更新用スキーマ: name（必須）、colorCode（必須）、displayOrder（任意）を受け付ける
  - colorCode は正規表現 `/^#[0-9A-Fa-f]{6}$/` で検証する
  - _Requirements: 3.2, 4.2, 7.2, 7.3_

- [x] 1.2 (P) DB 行型と API レスポンス型を定義する
  - DB 行型（snake_case）: テーブルカラムに対応する6フィールド（chart_color_palette_id, name, color_code, display_order, created_at, updated_at）
  - API レスポンス型（camelCase）: 同等フィールドで日時は文字列型
  - _Requirements: 6.4, 6.5_

- [x] 2. Transform 関数の作成
- [x] 2.1 DB 行から API レスポンスへの変換関数を実装する
  - snake_case フィールドを camelCase に変換する
  - Date 型を ISO 8601 文字列に変換する
  - _Requirements: 6.4, 6.5_

- [x] 3. Data 層の実装
- [x] 3.1 CRUD クエリ関数を実装する
  - 全レコードを display_order 昇順で取得する関数
  - ID 指定で単一レコードを取得する関数
  - 新規レコードを INSERT し、OUTPUT INSERTED で作成行を返却する関数
  - 指定フィールドを UPDATE し、updated_at を自動更新して OUTPUT INSERTED で返却する関数
  - ID 指定で物理削除（DELETE FROM）する関数
  - パラメータ化クエリで SQL インジェクションを防止する（name は NVarChar(100)、color_code は VarChar(7)、display_order は Int）
  - _Requirements: 1.1, 1.2, 2.1, 3.1, 4.1, 5.1_

- [x] 4. Service 層の実装
- [x] 4.1 一覧取得・個別取得のビジネスロジックを実装する
  - 一覧取得: 全レコードを取得して変換し返却する。0件の場合は空配列を返す
  - 個別取得: レコードの存在を確認し、存在しない場合は 404 を返す
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 4.2 作成のビジネスロジックを実装する
  - バリデーション通過後にレコードを作成し、変換して返却する
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4.3 (P) 更新のビジネスロジックを実装する
  - 対象レコードの存在確認（404）
  - チェック通過後にレコードを更新し、変換して返却する
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4.4 (P) 削除のビジネスロジックを実装する
  - 対象レコードの存在確認（404）
  - 物理削除を実行する
  - _Requirements: 5.1, 5.2_

- [x] 5. Route 層の実装とシステム統合
- [x] 5.1 HTTP エンドポイントを定義する
  - GET /（一覧取得）: Service の一覧取得を呼び出して 200 で返却。レスポンスは `{ data: [...] }` 形式
  - GET /:paletteId（個別取得）: パスパラメータを検証し、Service の個別取得を呼び出して 200 で返却
  - POST /（作成）: Zod バリデーションミドルウェアを適用し、Service の作成を呼び出して 201 + Location ヘッダで返却
  - PUT /:paletteId（更新）: Zod バリデーションミドルウェアを適用し、Service の更新を呼び出して 200 で返却
  - DELETE /:paletteId（削除）: Service の削除を呼び出して 204 で返却
  - パスパラメータ paletteId を正の整数として検証するヘルパーを使用する
  - _Requirements: 1.1, 2.1, 2.2, 3.1, 3.3, 3.4, 4.1, 4.3, 4.4, 5.1, 5.2, 6.1, 6.2, 6.3, 7.1_

- [x] 5.2 アプリケーションのルート登録に新規エンドポイントを追加する
  - `/chart-color-palettes` パスでルートをマウントする
  - 既存のルート登録パターンに従い、import と route 呼び出しを追加する
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [x] 6. テストの実装
- [x] 6.1 型定義とスキーマのテストを作成する
  - 各 Zod スキーマで正常値、境界値、不正値のバリデーション結果を検証する
  - colorCode の正規表現検証（`#FF5733` OK, `FF5733` NG, `#GG0000` NG, `#fff` NG）
  - name の長さ制限（空文字 NG, 1文字 OK, 100文字 OK, 101文字 NG）
  - displayOrder のデフォルト値（未指定時に 0）
  - _Requirements: 7.2, 7.3, 8.2_

- [x] 6.2 (P) Transform 関数のテストを作成する
  - snake_case から camelCase への変換が正しいことを検証する
  - Date 型が ISO 8601 文字列に変換されることを検証する
  - _Requirements: 6.4, 6.5_

- [x] 6.3 Route 層の結合テストを作成する
  - Hono の app.request() で各エンドポイントのステータスコードとレスポンス構造を検証する
  - GET / で一覧が `{ data: [...] }` 形式で返却されることを確認する
  - GET /:paletteId で存在しない ID に対して 404 が返却されることを確認する
  - POST / で 201 ステータスと Location ヘッダを確認する
  - PUT /:paletteId で 200 ステータスと更新後のデータを確認する
  - DELETE /:paletteId で 204 と空ボディを確認する
  - パスパラメータの不正値に対するバリデーションエラーを検証する
  - バリデーションエラー時の RFC 9457 形式レスポンスを検証する
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.3, 3.4, 4.1, 4.3, 4.4, 5.1, 5.2, 6.1, 6.2, 6.3, 7.1, 8.1, 8.2, 8.3, 8.4_

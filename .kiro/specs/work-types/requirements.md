# 要件定義書

## はじめに

本ドキュメントは、作業種類（work_types）マスタデータの CRUD API の要件を定義する。work_types は間接作業の分類を管理するマスタテーブルであり、`work_type_code`（VARCHAR(20)）を自然キーとして持つ。本 API は既存の business_units CRUD API と同一のアーキテクチャパターン（Routes → Service → Data → Transform の4層構成）に従い、RFC 9457 準拠のエラーレスポンスを提供する。

### 対象テーブル仕様

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| work_type_code | VARCHAR(20) | NO | - | 主キー。作業種類コード |
| name | NVARCHAR(100) | NO | - | 作業種類名 |
| display_order | INT | NO | 0 | 表示順序 |
| color | VARCHAR(7) | YES | NULL | 表示カラーコード（例: #FF5733） |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |
| deleted_at | DATETIME2 | YES | NULL | 削除日時（論理削除） |

---

## 要件

### 要件 1: 作業種類一覧取得

**目的:** 管理者として、作業種類の一覧をページネーション付きで取得したい。それにより、間接作業の分類を効率的に管理できる。

#### 受け入れ基準

1. When クライアントが `GET /work-types` にリクエストを送信した場合, the Work Types API shall 論理削除されていない作業種類の一覧を `data` 配列として返却し、ステータスコード 200 を返す。
2. When クライアントが `page[number]` および `page[size]` クエリパラメータを指定した場合, the Work Types API shall 指定されたページネーション条件に従って結果を返却し、`meta.pagination` にページ情報（currentPage, pageSize, totalItems, totalPages）を含める。
3. When クライアントが `filter[includeDisabled]=true` を指定した場合, the Work Types API shall 論理削除済みの作業種類を含むすべてのレコードを返却する。
4. The Work Types API shall 各作業種類レコードを camelCase 形式（workTypeCode, name, displayOrder, color, createdAt, updatedAt）で返却する。
5. If クエリパラメータのバリデーションに失敗した場合, the Work Types API shall RFC 9457 形式のエラーレスポンスをステータスコード 422 で返す。

---

### 要件 2: 作業種類の個別取得

**目的:** 管理者として、特定の作業種類の詳細情報を取得したい。それにより、個別の作業種類の設定内容を確認できる。

#### 受け入れ基準

1. When クライアントが `GET /work-types/:workTypeCode` にリクエストを送信した場合, the Work Types API shall 該当する作業種類を `data` オブジェクトとして返却し、ステータスコード 200 を返す。
2. If 指定された workTypeCode が存在しないか論理削除済みの場合, the Work Types API shall RFC 9457 形式のエラーレスポンスをステータスコード 404 で返す。

---

### 要件 3: 作業種類の新規作成

**目的:** 管理者として、新しい作業種類を登録したい。それにより、間接作業の分類を拡張できる。

#### 受け入れ基準

1. When クライアントが `POST /work-types` に有効なリクエストボディを送信した場合, the Work Types API shall 新しい作業種類を作成し、作成されたリソースを `data` オブジェクトとして返却し、ステータスコード 201 と `Location` ヘッダを返す。
2. The Work Types API shall リクエストボディの以下のフィールドを検証する: workTypeCode（必須、1-20文字、英数字・ハイフン・アンダースコアのみ）、name（必須、1-100文字）、displayOrder（任意、0以上の整数、デフォルト0）、color（任意、#RRGGBB 形式のカラーコード）。
3. If 指定された workTypeCode が既に存在する場合（論理削除済みを含む）, the Work Types API shall RFC 9457 形式のエラーレスポンスをステータスコード 409 で返す。論理削除済みの場合は復元を促すメッセージを含める。
4. If リクエストボディのバリデーションに失敗した場合, the Work Types API shall RFC 9457 形式のエラーレスポンスをステータスコード 422 で返す。

---

### 要件 4: 作業種類の更新

**目的:** 管理者として、既存の作業種類の情報を更新したい。それにより、名称や表示順序、カラーコードを変更できる。

#### 受け入れ基準

1. When クライアントが `PUT /work-types/:workTypeCode` に有効なリクエストボディを送信した場合, the Work Types API shall 該当する作業種類を更新し、更新されたリソースを `data` オブジェクトとして返却し、ステータスコード 200 を返す。
2. The Work Types API shall リクエストボディの以下のフィールドを検証する: name（必須、1-100文字）、displayOrder（任意、0以上の整数）、color（任意、null または #RRGGBB 形式のカラーコード）。
3. If 指定された workTypeCode が存在しないか論理削除済みの場合, the Work Types API shall RFC 9457 形式のエラーレスポンスをステータスコード 404 で返す。
4. If リクエストボディのバリデーションに失敗した場合, the Work Types API shall RFC 9457 形式のエラーレスポンスをステータスコード 422 で返す。

---

### 要件 5: 作業種類の論理削除

**目的:** 管理者として、不要な作業種類を論理削除したい。それにより、データの整合性を保ちながら使用停止にできる。

#### 受け入れ基準

1. When クライアントが `DELETE /work-types/:workTypeCode` にリクエストを送信した場合, the Work Types API shall 該当する作業種類を論理削除（deleted_at を設定）し、ステータスコード 204 を返す。
2. If 指定された workTypeCode が存在しないか既に論理削除済みの場合, the Work Types API shall RFC 9457 形式のエラーレスポンスをステータスコード 404 で返す。
3. If 該当する作業種類が他のリソース（indirect_work_type_ratios 等）から参照されている場合, the Work Types API shall RFC 9457 形式のエラーレスポンスをステータスコード 409 で返し、参照されているため削除できない旨を通知する。

---

### 要件 6: 作業種類の復元

**目的:** 管理者として、論理削除済みの作業種類を復元したい。それにより、誤って削除した作業種類を再利用できる。

#### 受け入れ基準

1. When クライアントが `POST /work-types/:workTypeCode/actions/restore` にリクエストを送信した場合, the Work Types API shall 該当する論理削除済みの作業種類を復元（deleted_at を NULL に設定）し、復元されたリソースを `data` オブジェクトとして返却し、ステータスコード 200 を返す。
2. If 指定された workTypeCode が存在しない場合, the Work Types API shall RFC 9457 形式のエラーレスポンスをステータスコード 404 で返す。
3. If 指定された workTypeCode が論理削除されていない（アクティブな）場合, the Work Types API shall RFC 9457 形式のエラーレスポンスをステータスコード 409 で返す。

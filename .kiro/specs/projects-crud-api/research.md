# リサーチ & 設計決定ログ

## サマリー
- **フィーチャー**: `projects-crud-api`
- **ディスカバリースコープ**: Simple Addition（既存パターンに従った CRUD 追加）
- **主な知見**:
  - 既存の 3 マスタ CRUD（business_units / project_types / work_types）の実装パターンがそのまま踏襲可能
  - projects テーブルは INT IDENTITY 主キーであり、既存マスタの VARCHAR 自然キーとは異なるため、パスパラメータのバリデーションとルーティング設計に差異がある
  - 外部キー先の名称を JOIN で取得するパターンは既存実装に存在しないため、Data 層と Transform 層に新しい型定義が必要

## リサーチログ

### INT IDENTITY 主キー vs VARCHAR 自然キー
- **コンテキスト**: 既存マスタテーブルは `VARCHAR(20)` の自然キー（例: `business_unit_code`）を主キーとしているが、projects は `INT IDENTITY(1,1)` の `project_id` を主キーとする
- **調査内容**: 既存ルートのパスパラメータ定義を確認
- **知見**:
  - 既存: `/:businessUnitCode` で文字列をそのまま使用
  - projects: `/:id` で数値パラメータを使用。`z.coerce.number().int().positive()` によるパラメータバリデーションが必要
  - ユニーク制約は `project_code` カラム（`deleted_at IS NULL` 条件付き）に存在
- **影響**: Data 層の各メソッドで `findById(id: number)` を使用。作成・更新・復元時には `projectCode` の一意性チェックが必要

### JOIN による外部キー名称取得
- **コンテキスト**: 要件 1.5, 2.2, 4.6 で `businessUnitName` と `projectTypeName` をレスポンスに含める必要がある
- **調査内容**: 既存 Data 層の SQL パターンを確認
- **知見**:
  - 既存マスタ CRUD は単一テーブルの SELECT のみで JOIN は使用していない
  - `project_type_code` は NULL 許容のため LEFT JOIN が必要
  - `business_unit_code` は NOT NULL のため INNER JOIN で問題ない
- **影響**: Data 層の SQL に JOIN を追加。DB 行型（`ProjectRow`）に `business_unit_name` と `project_type_name` フィールドを追加。Transform 層で camelCase に変換

### 動的フィルタリング
- **コンテキスト**: 要件 1.6, 1.7 で `filter[businessUnitCode]` と `filter[status]` によるフィルタリングが必要
- **調査内容**: 既存の一覧取得クエリのフィルタパターンを確認
- **知見**:
  - 既存は `filter[includeDisabled]` の boolean フィルタのみ（WHERE 句の有無で切り替え）
  - projects では複数の文字列フィルタを動的に WHERE 句に追加する必要がある
  - `mssql` パッケージのパラメータバインディングで安全に実装可能
- **影響**: Data 層の `findAll` メソッドで WHERE 句を動的に組み立てるパターンを採用

### 外部キー参照先の存在チェック
- **コンテキスト**: 要件 3.7, 3.8, 4.7, 4.8 で作成・更新時に `businessUnitCode` と `projectTypeCode` の存在チェックが必要
- **調査内容**: 既存のクロステーブルバリデーションパターンを確認
- **知見**:
  - 既存マスタ CRUD では外部キー参照先の存在チェックは行っていない（マスタ自身がルートエンティティのため）
  - projects は子エンティティとして business_units と project_types を参照するため、Service 層でチェックが必要
  - 既存の `businessUnitData.findByCode` と `projectTypeData` の同等メソッドを再利用可能
- **影響**: Service 層の `create` / `update` メソッドで既存 Data 層のメソッドを直接呼び出して存在確認

## アーキテクチャパターン評価

| オプション | 説明 | 強み | リスク / 制限 | 備考 |
|-----------|------|------|-------------|------|
| 既存パターン踏襲 | 5層（routes/services/data/transform/types）で新規ファイル群を作成 | 一貫性、低リスク、テンプレート確立済み | なし | 推奨 |

## 設計決定

### 決定: パスパラメータの設計
- **コンテキスト**: projects は INT IDENTITY 主キーだが、`projectCode` もユニークキーとして存在する
- **検討した代替案**:
  1. `/projects/:id`（数値 ID）— RESTful 標準に沿う
  2. `/projects/:projectCode`（文字列コード）— 人間が読みやすい
- **選択**: `/projects/:id`（数値 ID）
- **理由**: DB の主キーに一致し、パフォーマンス面で有利。テーブル仕様で `project_id` が主キーとして定義されている
- **トレードオフ**: URL が人間にとって分かりにくいが、API としての一貫性と効率を優先

### 決定: 外部キー存在チェックの実装場所
- **コンテキスト**: `businessUnitCode` と `projectTypeCode` の存在チェックをどの層で行うか
- **検討した代替案**:
  1. Data 層で SQL の FK 制約エラーをキャッチ
  2. Service 層で事前に存在チェック
- **選択**: Service 層で事前に存在チェック
- **理由**: エラーメッセージを制御しやすく、RFC 9457 形式のレスポンスを正確に生成できる。既存の Data 層メソッドを再利用可能
- **トレードオフ**: 追加のクエリが発生するが、作成・更新は頻度が低いため許容範囲

### 決定: デフォルトソート順
- **コンテキスト**: 一覧取得時のデフォルトソート順を決定する必要がある
- **選択**: `project_id ASC`
- **理由**: 既存マスタは `display_order ASC` だが、projects には `display_order` がない。`project_id` は作成順と一致し、安定したソート順を提供する

## リスク & 軽減策
- **リスク 1**: JOIN によるクエリパフォーマンス — projects テーブルのデータ量が増加した場合。軽減: 既存の FK インデックスで十分。将来的にはページネーションのデフォルトサイズを調整
- **リスク 2**: 動的フィルタの SQL インジェクション — 軽減: `mssql` のパラメータバインディングを使用し、WHERE 句はコード内で静的に組み立て

## 参考資料
- `docs/database/table-spec.md` — projects テーブル仕様
- `docs/rules/api-response.md` — API レスポンス規約
- `docs/rules/hono/crud-guide.md` — CRUD 実装ガイド
- 既存実装: `apps/backend/src/` 配下の businessUnit 関連ファイル群

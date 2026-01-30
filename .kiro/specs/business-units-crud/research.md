# Research & Design Decisions: business-units-crud

## Summary
- **Feature**: `business-units-crud`
- **Discovery Scope**: Simple Addition（初回 CRUD 実装だが、パターンがガイドで明確に定義済み）
- **Key Findings**:
  - ORM 禁止のため、mssql（node-mssql）パッケージで生 SQL を実行する方針を採用
  - mssql はコネクションプール内蔵、パラメータ化クエリで SQL インジェクション防止
  - snake_case → camelCase 変換は transform 層で明示的に行う

## Research Log

### DB クライアントライブラリの選定
- **Context**: ORM は使用禁止。生 SQL で SQL Server（Azure SQL）に接続する必要がある
- **Sources Consulted**:
  - [node-mssql (npm)](https://www.npmjs.com/package/mssql)
  - [node-mssql GitHub](https://github.com/tediousjs/node-mssql)
- **Findings**:
  - `mssql`（node-mssql）は SQL Server 用の Node.js クライアントで、内部的に `tedious` を使用
  - コネクションプール機能が組み込まれている（`sql.ConnectionPool`）
  - パラメータ化クエリ（`request.input()` + `request.query()`）で SQL インジェクションを防止
  - `OUTPUT INSERTED.*` 句で INSERT/UPDATE の結果を即座に取得可能（SQL Server 固有）
  - Azure SQL Database に対応（`encrypt: true` 設定）
- **Implications**: mssql を採用。ORM を使わず、生 SQL のパラメータ化クエリで CRUD を実装

### snake_case → camelCase 変換
- **Context**: DB カラムは snake_case（`business_unit_code`）、API レスポンスは camelCase（`businessUnitCode`）が要件
- **Findings**:
  - ORM の自動変換プラグインは使用不可
  - transform 層（`businessUnitTransform.ts`）で明示的にマッピング関数を実装
  - DB 行型（`BusinessUnitRow`）は snake_case、レスポンス型（`BusinessUnit`）は camelCase と型を分離
- **Implications**: transform 層の責務が明確になり、DB スキーマと API 契約の分離が強化される

### SQL Server ページネーション
- **Context**: SQL Server での OFFSET ページネーションの構文確認
- **Findings**:
  - SQL Server 2012+ で `OFFSET ... ROWS FETCH NEXT ... ROWS ONLY` 構文がサポート
  - `ORDER BY` 句が必須
  - Azure SQL Database はこの構文を完全サポート
- **Implications**: `ORDER BY display_order ASC OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY` で実装

### 参照整合性チェック
- **Context**: 削除時に FK 依存テーブルを確認する必要がある
- **Sources Consulted**: `docs/database/table-spec.md`
- **Findings**:
  - 4テーブルが `business_unit_code` を FK として参照
  - projects: `business_unit_code` (NOT NULL)
  - headcount_plan_cases: `business_unit_code` (NULLABLE)
  - indirect_work_cases: `business_unit_code` (NOT NULL)
  - standard_effort_masters: `business_unit_code` (NOT NULL)
- **Implications**: 削除前に各テーブルの `deleted_at IS NULL` かつ該当コードの存在を EXISTS チェックする。1つの SQL で OR 結合可能

## Design Decisions

### Decision: mssql（node-mssql）+ 生 SQL の採用
- **Context**: DB クライアントの選定（ORM 禁止）
- **Alternatives Considered**:
  1. Kysely（型安全クエリビルダー）— ORM に準ずるため不採用
  2. Drizzle ORM — ORM のため不採用
  3. tedious 直接使用 — 低レベルすぎる、コネクションプール管理が手動
- **Selected Approach**: mssql（node-mssql）パッケージ
- **Rationale**: コネクションプール内蔵、パラメータ化クエリ対応、Azure SQL 対応、tedious のラッパーで十分な抽象度
- **Trade-offs**: 型安全性は手動の型定義に依存するが、transform 層で明示的にマッピングすることでカバー
- **Follow-up**: Azure SQL Database との接続テストを実装初期段階で確認

### Decision: 参照整合性チェックを EXISTS クエリで実装
- **Context**: 論理削除時の FK 依存チェック
- **Alternatives Considered**:
  1. COUNT クエリ — 全件カウントは不要
  2. EXISTS サブクエリ — 効率的
- **Selected Approach**: 1 つの SQL で 4 テーブルの EXISTS を OR 結合
- **Rationale**: 1 クエリで完了し、効率的
- **Trade-offs**: SQL が長くなるが可読性は十分
- **Follow-up**: パフォーマンステストで問題がないか確認

### Decision: テスト時のデータ層モック方針
- **Context**: 生 SQL を使用するため、テスト時の DB 依存をどう扱うか
- **Selected Approach**: データ層（`businessUnitData`）を関数オブジェクトとしてエクスポートし、`vi.mock` で差し替え
- **Rationale**: データ層のインターフェースが明確であり、モック差し替えが容易
- **Trade-offs**: 統合テストでは実 DB が必要だが、ユニットテストレベルでは十分

## Risks & Mitigations
- mssql の Azure SQL 認証方式が `.env` のユーザー/パスワード認証で動作するか — 接続テストで早期確認
- 生 SQL の型安全性が低い — TypeScript の型定義（`BusinessUnitRow`）と transform 層で補完
- SQL インジェクションリスク — すべてのクエリでパラメータ化クエリを使用（文字列連結禁止）

## References
- [node-mssql (npm)](https://www.npmjs.com/package/mssql) — SQL Server 向け Node.js クライアント
- [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) — Problem Details for HTTP APIs

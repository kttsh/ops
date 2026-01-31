# Research & Design Decisions: standard-effort-masters-crud-api

## Summary
- **Feature**: `standard-effort-masters-crud-api`
- **Discovery Scope**: Extension（既存CRUDパターンの拡張 + 親子テーブル操作の新規パターン導入）
- **Key Findings**:
  - 既存6エンティティのCRUDパターンが直接適用可能（routes → services → data → transform → types）
  - 子テーブル（standard_effort_weights）の同時操作パターンは現在コードベースに存在しない
  - mssql の `pool.transaction()` が利用可能だが、現在どのdata層ファイルでも未使用

## Research Log

### 親子テーブル操作のパターン調査
- **Context**: standard_effort_masters と standard_effort_weights の親子関係で、作成・更新時に子レコードの同時操作が必要
- **Sources Consulted**: 既存の data 層ファイル全6ファイル、mssql ライブラリドキュメント
- **Findings**:
  - 現在の data 層は単一テーブル操作のみ。バッチ INSERT やトランザクションは未使用
  - mssql は `new sql.Transaction(pool)` でトランザクションをサポート
  - DB スキーマで `standard_effort_weights` に `ON DELETE CASCADE` が定義されており、親レコードの物理削除時は子レコードも自動削除される
  - ただし、論理削除では CASCADE は発動しないため、weights は残存する（期待通りの動作）
- **Implications**: data 層にトランザクション付きメソッドを導入する必要がある。weights の全置換（DELETE ALL + INSERT）をアトミックに実行

### 複合ユニーク制約の処理
- **Context**: `(business_unit_code, project_type_code, name)` の3カラムユニーク制約（deleted_at IS NULL 条件付き）
- **Sources Consulted**: 既存 projectData.ts の重複チェックパターン
- **Findings**:
  - 既存パターン: `findByCode()` で単一カラムの重複チェック
  - standard_effort_masters では3カラムの組み合わせでチェックが必要
  - DB レベルのフィルタ付きユニークインデックスが存在するため、DB エラーのハンドリングでも対応可能だが、サービス層での事前チェックが既存パターンに合致
- **Implications**: `findByCompositeKey(businessUnitCode, projectTypeCode, name)` のようなメソッドを data 層に追加

### weights 取得方法の検討
- **Context**: 単一取得時に weights を含める要件（Req 2.1）
- **Sources Consulted**: 既存の projectCaseData.ts（JOINパターン）
- **Findings**:
  - JOINで取得する場合: 1クエリで取得可能だが、マスタの各行に weights の行数分の重複が発生し、変換ロジックが複雑化
  - 別クエリで取得する場合: マスタ取得後に weights を別 SELECT で取得。シンプルだが2回のDBアクセス
  - 一覧取得では weights は不要（Req 1 に weights は含まれていない）
- **Implications**: 単一取得時のみ別クエリで weights を取得するアプローチが、既存パターンとの一貫性とシンプルさの両面で優れる

### project_cases からの参照チェック
- **Context**: 論理削除時の参照整合性チェック（Req 5.4）
- **Sources Consulted**: projectCaseData.ts の `standardEffortExists` メソッド
- **Findings**:
  - `project_cases.standard_effort_id` が FK として存在
  - 既存パターン: `hasReferences()` メソッドで `EXISTS` チェック
  - 削除済み project_cases（deleted_at IS NOT NULL）は参照カウントから除外すべき
- **Implications**: `hasReferences()` で `project_cases` テーブルの `standard_effort_id` を `deleted_at IS NULL` 条件付きでチェック

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A: フラットCRUD分離 | マスタと weights を独立API | 既存パターンと完全一致 | Req 3, 4 の同時操作に対応できない | 要件との乖離 |
| B: 親子同時操作（推奨） | data 層にトランザクション付き操作追加 | 要件忠実、データ整合性担保 | 新パターン導入 | 将来の拡張にも適用可能 |
| C: weights 別エンドポイント | PUT /standard-effort-masters/:id/weights | RESTful | 要件変更必要、複数リクエスト | クライアント負荷 |

## Design Decisions

### Decision: 子テーブル操作を data 層のトランザクションで実装
- **Context**: weights の作成・全置換をマスタ操作と同時に行う必要がある
- **Alternatives Considered**:
  1. Option A — 別エンドポイントで weights を管理（要件と不整合）
  2. Option B — data 層でトランザクションを使用（推奨）
  3. Option C — service 層でトランザクションを管理
- **Selected Approach**: Option B — data 層の `create` / `update` メソッド内で `sql.Transaction` を使用
- **Rationale**: 既存の責務分離（data 層 = DB操作）に合致。service 層はビジネスロジックに集中
- **Trade-offs**: data 層のメソッドが他エンティティより複雑になるが、トランザクション境界が明確
- **Follow-up**: トランザクションのエラーハンドリング（ロールバック）をテストで検証

### Decision: weights の取得は別クエリで実施
- **Context**: 単一取得時に weights 配列を含める
- **Alternatives Considered**:
  1. JOIN で1クエリ取得 → 行の重複展開 + グルーピング変換が必要
  2. 別クエリで取得 → 2回のDBアクセスだがシンプル
- **Selected Approach**: 別クエリで取得
- **Rationale**: マスタ取得は既存パターン踏襲。weights は `findWeightsByMasterId()` で取得し、service 層で結合
- **Trade-offs**: DBアクセス回数は増えるが、コードの可読性とメンテナンス性が向上
- **Follow-up**: パフォーマンスが問題になった場合はJOINに切り替え可能

### Decision: 複合ユニーク制約は service 層で事前チェック
- **Context**: (business_unit_code, project_type_code, name) のユニーク制約
- **Alternatives Considered**:
  1. DB エラーをキャッチして 409 に変換
  2. service 層で事前に data 層の `findByCompositeKey` を呼び出してチェック
- **Selected Approach**: service 層での事前チェック
- **Rationale**: 既存パターン（projects の `findByCode` チェック）との一貫性。ユーザーフレンドリーなエラーメッセージの提供
- **Trade-offs**: TOCTOU（チェック時と書き込み時の間にレコードが挿入される可能性）があるが、DB のユニークインデックスがセーフティネットとして機能
- **Follow-up**: なし

## Risks & Mitigations
- **トランザクション導入の影響範囲**: data 層のみに閉じるため影響は限定的。エラー時のロールバックをテストで検証
- **weights 全置換のパフォーマンス**: 通常 21 件（0〜100 の 5% 刻み）程度のため問題なし
- **複合ユニーク制約の TOCTOU**: DB のフィルタ付きユニークインデックスがセーフティネットとして機能

## References
- [mssql Transaction API](https://github.com/tediousjs/node-mssql#transaction) — Node.js mssql ライブラリのトランザクション機能
- 既存実装: `apps/backend/src/data/projectData.ts` — CRUD パターンのリファレンス
- 既存実装: `apps/backend/src/services/projectService.ts` — FK検証・参照チェックパターン
- テーブル定義: `docs/database/table-spec.md` — standard_effort_masters / standard_effort_weights

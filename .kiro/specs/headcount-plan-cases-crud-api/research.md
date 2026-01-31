# Research & Design Decisions

---
**Purpose**: headcount-plan-cases-crud-api の設計判断を裏付ける調査ログ
---

## Summary
- **Feature**: `headcount-plan-cases-crud-api`
- **Discovery Scope**: Simple Addition（既存CRUD パターンの拡張）
- **Key Findings**:
  - 既存の3エンティティ（businessUnits, projectTypes, workTypes）はすべてマスタテーブル（文字列主キー）であり、headcount_plan_cases は初のINT IDENTITY主キー + 外部キー（business_unit_code）を持つエンティティテーブルのCRUD実装となる
  - 外部キーに対応する名称のJOIN取得は既存実装に前例がなく、データ層のSQLクエリでLEFT JOINパターンを新規導入する必要がある
  - headcount_plan_cases の business_unit_code は NULLable であるため、LEFT JOIN を使用し、ビジネスユニット名が取得できない場合は null を返す設計が適切

## Research Log

### INT IDENTITY 主キーへのルーティング変更
- **Context**: 既存エンティティはすべて文字列コード（business_unit_code等）をパスパラメータとして使用しているが、headcount_plan_cases は INT IDENTITY 主キーを使用する
- **Findings**:
  - パスパラメータを `:id` とし、`z.coerce.number().int().positive()` でバリデーション可能
  - mssql の `.input()` で `sql.Int` 型を使用
  - Location ヘッダは `/headcount-plan-cases/{id}` 形式
- **Implications**: ルート定義のパスパラメータ型と data 層の SQL パラメータ型が変更される。既存パターンの軽微な変更で対応可能

### LEFT JOIN による外部キー名称取得
- **Context**: ユーザー要件として「外部キーに付随する名称もJOINで取得すること」が明示されている
- **Findings**:
  - business_unit_code は NULLable（YES）のため、INNER JOIN ではなく LEFT JOIN が必要
  - SELECT 句に `bu.name AS business_unit_name` を追加
  - Row 型に `business_unit_name: string | null` を追加
  - Transform 層で `businessUnitName: row.business_unit_name` としてマッピング
- **Implications**: データ層のSQL文にJOINが追加される。INSERT/UPDATE の OUTPUT 句ではJOIN結果を返せないため、作成・更新後に別途SELECT（findById）で取得する必要がある

### 参照整合性チェック（hasReferences）
- **Context**: 削除前に子テーブルからの参照を確認する必要がある
- **Findings**:
  - headcount_plan_cases を参照するテーブル: `monthly_headcount_plan`（FK: headcount_plan_case_id, ON DELETE CASCADE）
  - CASCADE設定があるがアプリケーション層で参照チェックを行い、意図しないカスケード削除を防止する方針は既存パターンと一致
- **Implications**: hasReferences() で monthly_headcount_plan の存在チェックを実装

### 重複チェックの方針
- **Context**: 既存マスタテーブルでは自然キー（code）の重複チェックを行うが、headcount_plan_cases は IDENTITY 主キーのため同一コードの重複概念がない
- **Findings**:
  - headcount_plan_cases にはユニーク制約のあるビジネスキーが存在しない
  - 作成時の重複チェック（findByCodeIncludingDeleted に相当するもの）は不要
  - Requirement 3.6 の「論理削除済みの同一IDのケースが存在する場合」は IDENTITY 主キーでは発生しないため、実質的に適用されない
- **Implications**: create 時の重複チェックロジックは省略可能。既存パターンとの差異として文書化

## Design Decisions

### Decision: LEFT JOIN による名称取得（findAll, findById）
- **Context**: 正規化されたテーブルで外部キーに対応する名称をクライアントに返す必要がある
- **Alternatives Considered**:
  1. データ層でLEFT JOIN — SQLレベルで結合
  2. サービス層で別途取得 — 2回のクエリ
  3. クライアント側で個別取得 — N+1問題のリスク
- **Selected Approach**: データ層でLEFT JOIN
- **Rationale**: 1回のクエリで完結し、パフォーマンスに優れる。ユーザー要件にも合致
- **Trade-offs**: SQL文がやや複雑化するが、可読性は十分
- **Follow-up**: INSERT/UPDATE の OUTPUT 句ではJOIN結果を含められないため、create/update 後に findById を呼び出して完全なレスポンスを取得する

### Decision: 外部キー存在チェック（businessUnitCode）
- **Context**: 作成・更新時に指定された businessUnitCode が business_units テーブルに存在するかを検証する必要がある
- **Selected Approach**: サービス層で businessUnitData.findByCode() を呼び出して存在確認
- **Rationale**: DB の外部キー制約に依存せず、アプリケーション層で明確なエラーメッセージを返せる
- **Trade-offs**: 追加のクエリが必要だが、ユーザー体験を優先

## Risks & Mitigations
- **Risk**: OUTPUT句でJOIN結果を返せないため、create/update後に追加クエリが必要 → **Mitigation**: findById を再利用して一貫性を確保
- **Risk**: business_unit_code が NULL の場合のJOIN結果 → **Mitigation**: LEFT JOINとNULL対応の型定義で対応

## References
- `docs/database/table-spec.md` — headcount_plan_cases テーブル定義
- `docs/rules/api-response.md` — APIレスポンス規約（RFC 9457）
- `docs/rules/hono/crud-guide.md` — CRUD API実装ガイド
- `apps/backend/src/data/businessUnitData.ts` — 既存データ層パターン
- `apps/backend/src/routes/businessUnits.ts` — 既存ルート層パターン

# Research & Design Decisions

---
**Purpose**: 技術設計を裏付ける調査結果と設計判断の記録
---

## Summary
- **Feature**: `indirect-work-type-ratios-crud-api`
- **Discovery Scope**: Simple Addition（既存ファクトテーブル CRUD パターンの踏襲）
- **Key Findings**:
  - 既存の `projectLoads` API がファクトテーブル CRUD の完全なリファレンス実装として存在
  - ネストリソースパターン（親エンティティID をパスパラメータに含む）が確立済み
  - ユニーク制約の複合キーが3カラム（case + workType + fiscalYear）であり、重複チェックロジックが projectLoads より複雑

## Research Log

### 既存ファクトテーブル CRUD パターン分析
- **Context**: indirect_work_type_ratios の API 設計にあたり、既存のファクトテーブル CRUD 実装パターンを確認
- **Sources Consulted**: `apps/backend/src/routes/projectLoads.ts`, `services/projectLoadService.ts`, `data/projectLoadData.ts`, `transform/projectLoadTransform.ts`, `types/projectLoad.ts`
- **Findings**:
  - 4層構成（routes → services → data → transform + types）が確立
  - ファクトテーブルは物理削除（deleted_at なし）
  - 親エンティティの存在確認が全操作で必須
  - バルク Upsert は SQL Server の MERGE 文を使用、トランザクション内で実行
  - バルクリクエスト内の重複チェック（Set で一意性検証）が service 層で実施
- **Implications**: 同一パターンをそのまま適用可能。ユニーク制約キーの構成のみ異なる

### ルーティング登録パターン
- **Context**: ネストリソースのルート登録方法を確認
- **Sources Consulted**: `apps/backend/src/index.ts`
- **Findings**:
  - `app.route('/project-cases/:projectCaseId/project-loads', projectLoads)` の形式で親リソースパスに子リソースをマウント
  - 親 ID はパスパラメータとして Hono の `c.req.param()` で取得
- **Implications**: `/indirect-work-cases/:indirectWorkCaseId/indirect-work-type-ratios` として同形式で登録

### ユニーク制約の複合キー
- **Context**: indirect_work_type_ratios は3カラムの複合ユニーク制約（indirect_work_case_id + work_type_code + fiscal_year）を持つ
- **Sources Consulted**: `docs/database/table-spec.md`
- **Findings**:
  - projectLoads は2カラム（project_case_id + year_month）の複合ユニーク制約
  - indirect_work_type_ratios は3カラムのため、重複チェック関数の引数が増える
  - バルク Upsert の MERGE 文の ON 条件も3カラムになる
- **Implications**: 重複チェック関数とバルク MERGE 文を3カラム対応に拡張

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 既存パターン踏襲 | projectLoads と同一の4層構成 | 一貫性、学習コスト最小 | なし | 推奨 |

## Design Decisions

### Decision: 既存ファクトテーブル CRUD パターンの完全踏襲
- **Context**: 新規ファクトテーブル API の設計方針
- **Alternatives Considered**:
  1. 既存パターンを踏襲 — routes/services/data/transform/types の5ファイル構成
  2. ジェネリック CRUD フレームワークを構築 — 共通化されたベースクラス
- **Selected Approach**: 既存パターンの完全踏襲
- **Rationale**: プロジェクト方針として ORM を使わず直接 SQL を記述する設計。ジェネリック化は過度な抽象化であり、現時点では不要
- **Trade-offs**: コードの重複はあるが、各エンティティの独立性と可読性を優先
- **Follow-up**: 将来的にファクトテーブル CRUD が大量に追加される場合、共通ユーティリティの検討余地あり

### Decision: workTypeCode の外部キー検証
- **Context**: 新規作成時に workTypeCode の存在を検証すべきか
- **Alternatives Considered**:
  1. DB の外部キー制約に任せる — エラーメッセージが SQL Server 固有
  2. Service 層で事前チェック — ユーザーフレンドリーなエラーメッセージ
- **Selected Approach**: Service 層で事前チェック
- **Rationale**: 要件 3.6 で明示的に 422 エラーを要求。ユーザー向けの明確なエラーメッセージが重要
- **Trade-offs**: DB アクセスが1回増えるが、UX を優先
- **Follow-up**: なし

## Risks & Mitigations
- 3カラム複合キーの MERGE 文が正しく動作するか — テストで検証
- workTypeCode の存在チェックで work_types テーブルの deleted_at を考慮する必要あり — 論理削除されたマスタは使用不可とする

## References
- `apps/backend/src/routes/projectLoads.ts` — ファクトテーブル CRUD のリファレンス実装
- `docs/database/table-spec.md` — indirect_work_type_ratios テーブル定義
- `docs/rules/api-response.md` — API レスポンス規約（RFC 9457 Problem Details）

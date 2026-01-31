# リサーチログ: project-types-crud

## サマリー

### ディスカバリースコープ
Simple Addition（既存パターン踏襲の CRUD API）として分類。正式なディスカバリーは不要と判断し、ギャップ分析の結果をそのまま活用。

### 主要な発見事項
1. `business_units` CRUD が完全なリファレンス実装として存在する
2. `project_types` テーブルは `business_units` と同一構造（code / name / display_order / timestamps / deleted_at）
3. 共通ユーティリティ（`validate`, `errorHelper`, `pagination`, `getPool`）はすべて再利用可能
4. 参照チェック対象テーブルは `projects`（`project_type_code` FK）と `standard_effort_masters`（`project_type_code` FK）の2つ

## リサーチログ

### トピック 1: 既存パターンの適合性確認

**調査内容**: business_units の3層アーキテクチャ（Routes → Services → Data + Transform）が project_types にそのまま適用可能か

**結論**: 完全に適用可能。テーブル構造が同一であり、差分はカラム名・テーブル名・参照チェック対象のみ。

**ソース**: `apps/backend/src/` 配下の business_units 実装ファイル一式

### トピック 2: 参照整合性チェック対象の特定

**調査内容**: `project_type_code` を外部キーとして参照しているテーブルの特定

**結論**: テーブル仕様書より以下の2テーブルが該当
- `projects.project_type_code` → `project_types(project_type_code)`
- `standard_effort_masters.project_type_code` → `project_types(project_type_code)`

**ソース**: `docs/database/table-spec.md`

## アーキテクチャパターン評価

既存の business_units パターン（Option A: 新規コンポーネント作成）を採用。抽象化（Option B）は YAGNI の観点から見送り。

## 設計判断

| 判断 | 選択 | 根拠 |
|------|------|------|
| 実装アプローチ | 新規コンポーネント作成 | 独立したドメインエンティティとして business_units パターンを踏襲 |
| 共通化 | しない | YAGNI。work_types 実装時に再検討 |
| 参照チェック | projects + standard_effort_masters | テーブル仕様書に基づく FK 関係 |

## リスク

リスクなし。確立されたパターンの踏襲であり、技術的不確定要素は存在しない。

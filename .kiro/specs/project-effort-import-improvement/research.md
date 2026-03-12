# Research & Design Decisions

## Summary
- **Feature**: project-effort-import-improvement
- **Discovery Scope**: Extension（既存 Bulk API の刷新・拡張）
- **Key Findings**:
  - 既存 Bulk API（routes/bulk.ts, importExportService, importExportData）を拡張する方針で統一
  - 案件コード自動生成はプレフィックス + 連番方式が最もシンプル
  - バリデーションはフロントエンド中心で維持（現行パターン踏襲）、バックエンドは最低限

## Research Log

### 案件コード自動生成方式

- **Context**: 要件 3 — 案件コード未入力時の新規案件自動登録に際し、一意な案件コードの自動付与が必要
- **Sources Consulted**: 既存 projectData.ts の create()、projectService.ts のバリデーション、DB スキーマ（project_code NVARCHAR(120) UNIQUE）
- **Findings**:
  - 現行システムに案件コード自動生成ロジックは存在しない（全てクライアント入力）
  - project_code は NVARCHAR(120) で、論理削除を除くユニーク制約あり
  - 候補方式:
    1. **プレフィックス + 連番**: `AUTO-{NNN}` — MAX+1 方式でDB問い合わせ、人間可読
    2. **BUプレフィックス + 連番**: `{BU}-AUTO-{NNN}` — BU毎に採番
    3. **タイムスタンプベース**: `AUTO-{YYYYMMDDHHmmss}-{NN}` — DB問い合わせ不要だが可読性低
- **Implications**: 方式 1 がシンプルかつ既存コードパターンとの整合性が高い。トランザクション内で `MAX(project_code) + 1` を取得し衝突を防止

### トランザクション境界設計

- **Context**: インポート処理が案件作成 + ケース作成 + 月次データ upsert の 3 段階で構成され、整合性の保証が必要
- **Findings**:
  - 現行 `bulkImportByCase()` は全アイテムを 1 トランザクションで処理
  - 新仕様では案件メタデータの INSERT/UPDATE が追加されるが、同一トランザクション内で処理可能
  - SQL Server の MERGE 文は既にトランザクション内で安全に動作している
- **Implications**: 全行 1 トランザクションを維持。バリデーションはトランザクション外（フロントエンド）で事前実行

### 工数ケースNo（P列）の解釈

- **Context**: ギャップ分析で P列の意味が不明確と指摘
- **Findings**:
  - 現行エクスポートでは `project_case_id`（DB 自動採番の内部 ID）を「キーコード」として出力
  - P列 = `project_case_id` として扱うのが自然
  - エクスポート時: 既存ケースの project_case_id を出力
  - インポート時:
    - P列に値あり → 既存ケースの識別子として使用（月次データ更新）
    - P列が空 → 新規ケース作成（Q列のケース名を使用）
- **Implications**: P列は内部 ID であり、ユーザーが任意に設定する値ではない

### バリデーション方針

- **Context**: ユーザーから「極力シンプルに」との指示
- **Findings**:
  - 現行パターン: フロントエンドで Excel パース時にバリデーション → プレビュー表示 → 確定時に API 呼出
  - バックエンドは Zod スキーマで型バリデーションのみ
  - BU/PT のマスタ存在チェックはバックエンドで実施（FK 制約エラー回避のため必須）
- **Implications**: フロントエンドでフォーマット・値範囲・必須チェック、バックエンドはスキーマ検証 + マスタ存在チェックのみ

### 旧 Bulk API の刷新方針

- **Context**: ユーザーから「旧 BulkAPI を拡張・刷新してこの機能を実装したい」との指示
- **Findings**:
  - 既存ファイル: `routes/bulk.ts`（26行）、`services/importExportService.ts`（85行）、`data/importExportData.ts`（148行）、`types/importExport.ts`（57行）
  - いずれも小規模で拡張余地あり
  - 既存エンドポイントの互換性: 旧フォーマットは廃止し新フォーマットに置き換え
- **Implications**: 既存ファイルを直接拡張。旧エンドポイント・型を新仕様で上書き

## Design Decisions

### Decision: 案件コード自動生成方式

- **Context**: 案件コード空欄行の新規登録時に一意コードを自動付与する必要がある
- **Alternatives Considered**:
  1. プレフィックス + 連番（`AUTO-{NNN}`）
  2. BUプレフィックス + 連番（`{BU}-AUTO-{NNN}`）
  3. タイムスタンプベース（`AUTO-{timestamp}`）
- **Selected Approach**: 方式 1 — `AUTO-{NNN}`（NNN は 0 埋め 6 桁）
- **Rationale**: 最もシンプル。トランザクション内で既存の AUTO- プレフィックス付きコードの MAX を取得し +1 する。衝突はトランザクション分離レベルで防止
- **Trade-offs**: BU 情報がコードに含まれないが、BU は別列で管理されるため問題なし
- **Follow-up**: 採番のシード値（AUTO-000001 開始）とパディング桁数の最終確認

### Decision: 既存 Bulk API の刷新

- **Context**: 新しい Excel フォーマット（17固定列 + 年月列）への対応
- **Selected Approach**: 既存の bulk.ts / importExportService.ts / importExportData.ts / importExport.ts を直接拡張
- **Rationale**: ユーザー指示。既存ファイルが小規模で拡張に適している
- **Trade-offs**: 旧フォーマットとの後方互換性は捨てる（既存の 3 列フォーマットは廃止）

### Decision: バリデーションのシンプル化

- **Context**: ユーザーから「極力シンプルに」との指示
- **Selected Approach**: フロントエンド中心のバリデーション + バックエンドは最低限（スキーマ + マスタ存在チェック）
- **Rationale**: 現行パターンの踏襲。フロントエンドで Excel パース時にエラーを検出しプレビューで表示

## Risks & Mitigations

- 大量データ（数千行）のインポート時にトランザクションが長時間化 — バッチサイズ制限（例: 5000行上限）で対応
- 案件コード連番の衝突（同時インポート） — トランザクション内での MAX 取得で排他制御
- 旧 Bulk API の後方互換性喪失 — フロントエンドも同時更新するため影響なし

## References

- 既存実装: `apps/backend/src/routes/bulk.ts`, `services/importExportService.ts`, `data/importExportData.ts`
- DB スキーマ: `docs/database/table-spec.md`
- 既存 spec: `.kiro/specs/excel-import-export/`, `.kiro/specs/bulk-import-export/`

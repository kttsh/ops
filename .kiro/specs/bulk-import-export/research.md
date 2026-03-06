# Research & Design Decisions

## Summary
- **Feature**: `bulk-import-export`
- **Discovery Scope**: Extension
- **Key Findings**:
  - フロントエンドに Excel ユーティリティ基盤（`excel-utils.ts`, `ExcelImportDialog.tsx`）が完備されており、再利用可能
  - バックエンドには Excel ライブラリ・ファイルアップロード機能が未導入。JSON API + トランザクション制御は確立済み
  - ハイブリッド方式（バックエンドは JSON API、フロントエンドで Excel 生成/パース）が既存パターンとの一貫性・実装コストのバランスで最適

## Research Log

### Excel フォーマットの拡張
- **Context**: 既存の `ExportSheetConfig` は固定列1列（rowHeaderLabel）のみ対応。一括エクスポートでは3固定列（キーコード、案件名、ケース名）が必要
- **Findings**:
  - `buildExportWorkbook()` は aoa (array of arrays) で xlsx ワークブックを構築するシンプルな実装
  - 複数固定列への拡張は、新しいインターフェース `BulkExportSheetConfig` を定義することで対応可能
  - 既存の `ExportSheetConfig` を破壊的変更せず、別インターフェースで並立させるのが安全
- **Implications**: `excel-utils.ts` に `buildBulkExportWorkbook()` 関数を追加。既存コードへの影響なし

### 一括データ取得クエリ
- **Context**: 既存 Data 層は個別テーブルごとの取得メソッドのみ（projects, project_cases, project_load を個別取得）
- **Findings**:
  - 一括エクスポート用には JOIN で横断取得するクエリが必要
  - 既存パターン: `projectCaseData` の `SELECT_COLUMNS` + `JOIN_CLAUSE` パターンに準拠
  - 年月列の動的範囲は、全レコードの MIN/MAX year_month から算出可能
- **Implications**: `importExportData.ts` に専用の横断取得メソッドを新設

### インポート時の一括更新戦略
- **Context**: 既存の `projectLoadData.bulkUpsert()` はケース単位の MERGE SQL
- **Findings**:
  - 複数ケースへの横断更新: projectCaseId でグループ化し、1トランザクション内で順次 MERGE を実行
  - 既存の bulkUpsert パターンを直接再利用可能（ケースごとに既存メソッドを呼ぶ）
  - 全ケースの更新を1トランザクションにまとめることで原子性を確保
- **Implications**: 新規の一括インポートサービスメソッドを作成。内部で既存 Data 層メソッドを呼び出す

### DataTableToolbar の拡張
- **Context**: 現在のツールバーは「検索 + 削除済み切替 + 新規登録ボタン」の固定構成
- **Findings**:
  - `DataTableToolbarProps` にエクスポート/インポートボタン用のスロットがない
  - 方針1: props に `actions` スロット（ReactNode）を追加 → 汎用的だが過剰
  - 方針2: ページコンポーネント内でツールバーと並行してボタンを配置 → シンプル
- **Implications**: ページコンポーネント内でツールバーの右側にボタンを直接配置。DataTableToolbar の変更は不要

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A: フロントエンド完結型 | Excel 生成/パースをフロントエンドで行い、バックエンドは既存 JSON API + 一括データ取得 API のみ | 既存インフラ最大活用、一貫性が高い | 大量データ時のブラウザメモリ制約 | データ量が数千行以内なら問題なし |
| B: バックエンド完結型 | Excel 生成/パースをバックエンドで行い、専用バイナリ API を新設 | サーバーサイド大量データ処理に有利 | 新規依存追加、既存パターンとの乖離 | exceljs + ファイルアップロードの導入コスト大 |
| C: ハイブリッド型 | バックエンドは JSON API（一括取得 + 一括更新）、フロントエンドで Excel 生成/パース | バランスが良い、既存パターン活用 | JSON 転送量が増える | **採用** |

## Design Decisions

### Decision: ハイブリッド方式の採用（Option C）
- **Context**: Issue #42 はバックエンド API を想定するが、既存インフラはフロントエンド完結型
- **Alternatives Considered**:
  1. Option A — フロントエンド完結型（バックエンドに一括データ取得 API を追加するのみ）
  2. Option B — バックエンド完結型（exceljs + ファイルアップロード新規導入）
  3. Option C — ハイブリッド型
- **Selected Approach**: Option C — バックエンドは JSON API で一括データ提供・一括更新を担当。Excel の生成・パースはフロントエンドの既存インフラで処理
- **Rationale**: 既存の `excel-utils.ts` と `ExcelImportDialog.tsx` を再利用し、バックエンドに新しい依存を追加しない。JSON API はバックエンドの既存パターン（Hono + Zod + mssql）に完全準拠
- **Trade-offs**: Issue #42 の「バックエンド Excel API」とは異なるが、実質的な機能は同等。大量データ時は JSON 転送量が増えるが、想定データ量（数百〜数千行）では問題なし
- **Follow-up**: データ量が将来的に大幅増加する場合はバックエンド完結型への移行を検討

### Decision: キーコードに projectCaseId を使用
- **Context**: インポート時にどの行がどのケースに対応するかを識別するキーが必要
- **Alternatives Considered**:
  1. projectCaseId（数値 ID）
  2. projectCode + caseName（複合キー）
- **Selected Approach**: projectCaseId を使用
- **Rationale**: 一意性が保証される DB の主キー。名前ベースの複合キーは重複リスクがある
- **Trade-offs**: ユーザーにとって ID は直感的でないが、Excel 上では案件名・ケース名が併記されるため実用上問題なし

### 重複 projectCaseId 行の処理方針
- **Context**: Excel 上で同一 projectCaseId が複数行に存在する場合の動作を定義する必要がある
- **Findings**:
  - MERGE SQL は最後の書き込みが勝つため、処理順序に依存する非決定的な動作になり得る
  - ユーザーの意図としては「編集途中で行をコピーした」等の人為的ミスが主な原因
- **Selected Approach**: あと勝ち（Excel 上で下にある行が優先）+ 警告表示
  - フロントエンドの `parseBulkImportSheet` で重複を検出し `warnings` として返却
  - プレビュー画面で警告アイコン + メッセージを表示してユーザーに気づかせる
  - インポート確定ボタンは無効化しない（保存は許可）
  - 重複行はマージ後の1行にまとめて API に送信
- **Rationale**: エラーとして拒否するとユーザーの手間が増える。あと勝ちは Excel の「下書き → 修正」という自然な操作に合致する

### API ルートプレフィックスの選定
- **Context**: 一括入出力エンドポイントの配置場所。既存の project-loads は `/project-cases/:id/project-loads` にネスト
- **Selected Approach**: `/bulk` プレフィックスで独立したルートグループを新設
  - `app.route("/bulk", bulkRoute)` として `index.ts` に登録
  - エンドポイント: `GET /bulk/export-project-loads`, `POST /bulk/import-project-loads`
- **Rationale**: 既存のリソースネスト規約を破壊しない。将来的に他の一括操作（間接工数等）も `/bulk` 配下に追加可能

## Risks & Mitigations
- **大量データ時のパフォーマンス**: フロントエンドでの Excel 生成/パースがボトルネックになる可能性 → 数千行規模の動作確認を実施。問題があればバックエンド完結型に移行
- **キーコード不一致**: エクスポート後にケースが削除された場合、インポート時にキーコードが無効になる → バリデーションで検出しエラー報告
- **年月列の増減**: エクスポート時とインポート時で年月範囲が変わる可能性 → インポートは Excel に含まれる年月列のみを処理。存在しない年月は無視
- **重複 projectCaseId**: あと勝ち + 警告表示で対応。ユーザーの意図しない上書きを警告で防止

## References
- 既存 Excel ユーティリティ: `apps/frontend/src/lib/excel-utils.ts`
- 既存インポートダイアログ: `apps/frontend/src/components/shared/ExcelImportDialog.tsx`
- 既存エクスポート hook: `apps/frontend/src/features/case-study/hooks/useProjectLoadExcelExport.ts`
- 既存インポート hook: `apps/frontend/src/features/case-study/hooks/useProjectLoadExcelImport.ts`
- 既存 bulk API: `apps/backend/src/routes/projectLoads.ts` (PUT /bulk)

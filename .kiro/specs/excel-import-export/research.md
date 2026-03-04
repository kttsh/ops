# Research & Design Decisions

## Summary
- **Feature**: `excel-import-export`
- **Discovery Scope**: Extension（既存システムの拡張）
- **Key Findings**:
  - `xlsx` パッケージ（v0.18.5）は導入済み。動的 import + `aoa_to_sheet` + `writeFileXLSX` パターンが確立済み
  - Bulk API（`PUT /bulk`）は両エンティティで実装済み。スキーマは `{ items: [...] }` 形式で yearMonth（YYYYMM）+ manhour（0–99999999）
  - フロントエンドの mutation パターン（`useMutation` + `queryClient.invalidateQueries` + `toast`）が統一的に使用されている

## Research Log

### 既存 Excel エクスポートパターン
- **Context**: 間接作業ケーススタディの計算結果エクスポート（`useExcelExport.ts`）が既に存在
- **Findings**:
  - 動的 import: `const XLSX = await import("xlsx")` でバンドルサイズ削減
  - シート生成: `XLSX.utils.aoa_to_sheet()` で Array of Arrays からシート生成
  - ダウンロード: `XLSX.writeFileXLSX(wb, filename)` で直接ダウンロード
  - カラム幅設定: `ws["!cols"]` で手動指定
  - 状態管理: `isExporting` boolean で UI フィードバック
- **Implications**: 新規エクスポート/インポートフックは同じパターンに従うべき

### Bulk API エンドポイント仕様
- **Context**: インポート時のデータ永続化に使用する既存 API
- **Findings**:
  - 案件工数: `PUT /project-cases/:projectCaseId/project-loads/bulk`
    - Body: `{ items: [{ yearMonth: string, manhour: number }] }`
    - yearMonth: YYYYMM（6桁文字列）
  - 間接工数: `PUT /indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads/bulk`
    - Body: `{ items: [{ businessUnitCode: string, yearMonth: string, manhour: number, source: "calculated" | "manual" }] }`
  - 両方とも `min(1)` バリデーション付き
  - レスポンス: `{ data: [...] }` 形式
- **Implications**: フロントエンドのバリデーションは Bulk API のスキーマと整合させる必要がある

### UI コンポーネントパターン
- **Context**: インポートダイアログの設計に影響する既存パターン
- **Findings**:
  - ダイアログ: `AlertDialog`（Radix UI）ベースの確認ダイアログが標準
  - アクションボタン: ヘッダー右側に `flex gap-2` で配置
  - ローディング: `isPending` / `isExporting` state でボタン無効化 + テキスト変更
  - トースト: `sonner` の `toast.success()` / `toast.error()` が統一パターン
- **Implications**: `ExcelImportDialog` は `AlertDialog` パターンを踏襲しつつ、ファイル選択・プレビュー・バリデーション表示を追加

### yearMonth フォーマット差異
- **Context**: バックエンド API は YYYYMM（6桁）、Excel 表示は YYYY-MM が望ましい
- **Findings**:
  - バックエンドスキーマ: `yearMonthSchema` = `/^\d{6}$/`（YYYYMM）
  - フロントエンド表示: `YYYY/MM` or `YYYY-MM`
  - 既存エクスポート: ヘッダーに月名を表示
- **Implications**: Excel ファイル上のヘッダーは YYYY-MM 形式で表示し、API 送信時に YYYYMM に変換する変換レイヤーが必要

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Feature Hook パターン | 各 feature 内にエクスポート/インポート hook を配置 | 既存パターンとの一貫性、feature 間依存なし | Excel パース/生成ロジックの重複 | 共通ユーティリティで重複を排除 |
| 共通ユーティリティ + Feature Hook | `lib/` に Excel パース/生成ユーティリティ、feature 内に hook | 重複排除、テスタビリティ向上 | ユーティリティ層の追加 | **採用** |

## Design Decisions

### Decision: Excel 処理の責務分離
- **Context**: エクスポート/インポートの Excel 操作ロジックをどこに配置するか
- **Alternatives Considered**:
  1. 各 feature hook 内にすべてのロジックを含める
  2. 共通ユーティリティ（`lib/excel-utils.ts`）に Excel 操作を集約し、feature hook からは API 変換のみ行う
- **Selected Approach**: Option 2 — 共通ユーティリティ + Feature Hook
- **Rationale**: Excel の読み書き操作は共通で、feature 固有のロジックはデータ変換（行↔API ペイロード）のみ。共通化でテスタビリティ向上
- **Trade-offs**: ユーティリティ層が増えるが、2つの feature で共有されるため正当化される

### Decision: インポートプレビューのアーキテクチャ
- **Context**: ファイル選択後、API 送信前にプレビューとバリデーションを表示する方法
- **Alternatives Considered**:
  1. ダイアログ内でステップ（ファイル選択 → プレビュー → 確定）を管理
  2. 別画面でプレビューを表示
- **Selected Approach**: Option 1 — ダイアログ内ステップ管理
- **Rationale**: 既存の AlertDialog パターンとの一貫性。画面遷移不要でユーザー体験がシンプル
- **Trade-offs**: ダイアログ内の状態管理がやや複雑になるが、コンポーネント分離で対応可能

### Decision: yearMonth フォーマット変換
- **Context**: Excel 上のヘッダー表記と API の YYYYMM 形式の変換
- **Selected Approach**: Excel ヘッダーは YYYY-MM 表記、パース時に YYYYMM に自動変換
- **Rationale**: ユーザーにとって YYYY-MM が可読性が高い。ラウンドトリップ対応のためエクスポート/インポートで同一フォーマットを使用

## Risks & Mitigations
- **大量データのパフォーマンス**: xlsx パッケージのパース処理はメインスレッドで実行される → 100行程度であれば問題ないが、将来的に Web Worker 移行の余地を残す
- **ファイル形式の互換性**: `.xls`（旧形式）のサポートは xlsx パッケージが対応済みだが、特殊なフォーマットは非対応の可能性 → エラーハンドリングで対応
- **既存エクスポート機能への影響**: 間接工数の計算結果エクスポート（`useExcelExport`）は別機能として独立しており、新規実装は影響を与えない

## References
- [SheetJS (xlsx) Documentation](https://docs.sheetjs.com/) — Excel 読み書きの公式ドキュメント
- 既存実装: `apps/frontend/src/features/indirect-case-study/hooks/useExcelExport.ts`
- Bulk API スキーマ: `apps/backend/src/types/projectLoad.ts`, `apps/backend/src/types/monthlyIndirectWorkLoad.ts`

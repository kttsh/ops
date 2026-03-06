# Gap Analysis: bulk-import-export

## 1. 要件と既存資産のマッピング

### Requirement 1 & 2: 一括エクスポート + エクスポート API

| 技術要素 | 既存資産 | ギャップ |
|----------|---------|---------|
| 全案件・全ケース・全工数の横断取得 | `projectData`, `projectCaseData`, `projectLoadData` に個別取得メソッドあり | **Missing**: 横断的な一括取得クエリ（JOIN で全データを一度に取得するメソッド）が未実装 |
| Excel ファイル生成（サーバーサイド） | バックエンドに Excel ライブラリなし | **Missing**: exceljs or xlsx パッケージの追加、Excel 生成ロジックの新規実装 |
| バイナリファイルレスポンス | Hono で JSON レスポンスのみ使用中 | **Missing**: Content-Type + Content-Disposition ヘッダー付きバイナリストリーム返却パターン |
| フロントエンド Excel ユーティリティ | `lib/excel-utils.ts` に `buildExportWorkbook()`, `downloadWorkbook()` 完備 | 既存資産で代替可能（フロントエンド方式の場合） |
| エクスポート用 hooks | `useProjectLoadExcelExport`, `useIndirectWorkLoadExcelExport` | 既存パターンを参考にできるが、全案件横断の新規 hook 必要 |

### Requirement 3 & 4: 一括インポート + インポート API

| 技術要素 | 既存資産 | ギャップ |
|----------|---------|---------|
| ファイルアップロード（サーバーサイド） | バックエンドに multipart/form-data 対応なし | **Missing**: Hono のファイルアップロードミドルウェア設定 |
| Excel パース（サーバーサイド） | バックエンドに Excel パースロジックなし | **Missing**: Excel 解析・データ抽出ロジック |
| Excel パース（フロントエンド） | `lib/excel-utils.ts` に `parseExcelFile()`, `parseImportSheet()` 完備 | 既存資産で代替可能（フロントエンド方式の場合） |
| Bulk Upsert | `projectLoadService.bulkUpsert()` がケース単位で実装済み | **Constraint**: 既存 API はケース単位。全案件横断の一括更新は複数ケースへの順次 bulkUpsert になる |
| トランザクション制御 | mssql の `sql.Transaction` パターン確立済み | 既存パターンを拡張して使用可能 |
| インポートダイアログ UI | `ExcelImportDialog.tsx` がドラッグ＆ドロップ・プレビュー・エラー表示に対応済み | 再利用可能 |

### Requirement 5: バリデーション

| 技術要素 | 既存資産 | ギャップ |
|----------|---------|---------|
| yearMonth/manhour バリデーション | `yearMonthSchema`, `validateManhour()`, `validateYearMonth()` が前後端双方に存在 | 既存で充足 |
| FK 制約チェック（キーコード） | サービス層で `projectCaseExists()` 等の存在チェックパターン確立 | 横断インポート用の一括存在チェックメソッドが未実装 |
| 行単位エラー報告 | フロントエンド `ValidationError` インターフェースあり | バックエンドからの行単位エラーレスポンス形式は新規定義が必要 |

### Requirement 6: Excel フォーマット

| 技術要素 | 既存資産 | ギャップ |
|----------|---------|---------|
| ラウンドトリップ互換性 | 既存の case-study エクスポート/インポートで同一パターン確立 | フォーマットの新規設計は必要だがパターンは確立済み |
| 動的年月列 | `excel-utils.ts` で年月列の動的生成に対応済み | 既存で充足 |

### Requirement 7: フロントエンド UI

| 技術要素 | 既存資産 | ギャップ |
|----------|---------|---------|
| エクスポートボタン | 案件一覧画面の `DataTableToolbar` にボタン追加可能 | ボタン追加のみ（パターン確立済み） |
| インポートボタン + ダイアログ | `ExcelImportDialog.tsx` 再利用可能 | hook の新規作成 + ボタン追加 |
| shadcn/ui コンポーネント | Dialog, Button, Table, Badge, Tooltip 等すべて揃っている | 既存で充足 |

---

## 2. 実装アプローチの選択肢

### Option A: フロントエンド完結型（既存パターン踏襲）

**概要:** Excel の生成・パースをすべてフロントエンドで行い、バックエンドには一括データ取得 API と既存の bulkUpsert API を利用する。

**拡張する既存ファイル:**
- `apps/backend/src/data/projectLoadData.ts` — 全案件横断の一括取得メソッド追加
- `apps/backend/src/routes/projectLoads.ts` or 新規ルート — 一括取得エンドポイント追加
- `apps/frontend/src/routes/master/projects/index.tsx` — ボタン追加

**新規作成:**
- `apps/frontend/src/features/projects/hooks/useProjectBulkExport.ts`
- `apps/frontend/src/features/projects/hooks/useProjectBulkImport.ts`
- `apps/frontend/src/features/projects/api/` に一括取得クエリ追加
- バックエンドに全案件横断データ取得用の service/data メソッド

**トレードオフ:**
- ✅ 既存インフラ（`excel-utils.ts`, `ExcelImportDialog.tsx`）をそのまま再利用
- ✅ バックエンドに新しい依存（Excel ライブラリ）を追加不要
- ✅ 実装コスト最小、既存パターンとの一貫性が高い
- ❌ 大量データ時にブラウザメモリに制約（数千行程度なら問題なし）
- ❌ Issue #42 の「バックエンド API」要件との乖離

### Option B: バックエンド完結型（Issue #42 の方針通り）

**概要:** Excel の生成・パースをバックエンドで行い、専用の `GET /api/projects/export` と `POST /api/projects/import` を新設する。

**新規作成:**
- `apps/backend/src/routes/importExport.ts` — エクスポート/インポートエンドポイント
- `apps/backend/src/services/importExportService.ts` — Excel 生成・パース・バリデーション
- `apps/backend/src/data/importExportData.ts` — 横断的データ取得クエリ
- `apps/backend/src/types/importExport.ts` — Zod スキーマ・型定義
- `apps/frontend/src/features/projects/hooks/useProjectBulkExport.ts`
- `apps/frontend/src/features/projects/hooks/useProjectBulkImport.ts`
- `apps/frontend/src/features/projects/api/` に import/export API クライアント追加

**依存追加:**
- バックエンド: `exceljs` パッケージ（xlsx より型安全で Node.js 向け）

**トレードオフ:**
- ✅ Issue #42 の要件に忠実
- ✅ サーバーサイドでの大量データ処理に有利
- ✅ フロントエンドの負荷が軽い（バイナリ受信/送信のみ）
- ❌ バックエンドに新しい依存と新パターンを導入
- ❌ 既存のフロントエンド Excel インフラとの一貫性が低い
- ❌ ファイルアップロードミドルウェアの新規導入が必要
- ❌ 実装コストが Option A より高い

### Option C: ハイブリッド型（推奨）

**概要:** エクスポートはフロントエンド（既存パターン踏襲）、バックエンドには一括データ取得 API のみ新設。インポートもフロントエンドで Excel パース後、既存パターンに近い形でバックエンドへ送信。

**バックエンド拡張:**
- 一括データ取得 API: `GET /api/project-loads/export-data`（JSON で全データを返却）
- 一括更新 API: `POST /api/project-loads/bulk-import`（JSON で受信、複数ケースへの横断更新）

**フロントエンド新規:**
- `useProjectBulkExport.ts` — API からデータ取得 → `excel-utils.ts` で Excel 生成
- `useProjectBulkImport.ts` — `excel-utils.ts` で Excel パース → API へ JSON 送信

**トレードオフ:**
- ✅ 既存のフロントエンド Excel インフラを最大限活用
- ✅ バックエンドは JSON API のみ（Excel ライブラリ不要）
- ✅ データ取得・更新ロジックはバックエンドで安全に処理
- ✅ 実装コストと一貫性のバランスが良い
- ❌ Issue #42 の「バックエンド Excel API」要件とは若干異なる
- ❌ 大量データ時は JSON 転送量が増える

---

## 3. 工数・リスク評価

| 指標 | 評価 | 根拠 |
|------|------|------|
| **工数** | **M（3-7日）** | 既存パターン（Excel ユーティリティ、インポートダイアログ、bulk API）が確立済み。主な新規作業は横断データ取得 API + フロントエンド hooks + UI 統合 |
| **リスク** | **Medium** | 既存パターンの拡張だが、全案件横断の一括操作は新しいスコープ。データ量次第でパフォーマンス考慮が必要。アーキテクチャ方針の決定（フロントエンド/バックエンド/ハイブリッド）が設計に大きく影響 |

---

## 4. 設計フェーズへの推奨事項

### 決定が必要な事項

1. **アーキテクチャ方針**: Option A / B / C のいずれを採用するか
   - Issue #42 はバックエンド API を想定しているが、既存インフラはフロントエンド完結型
   - データ量の見込み（数百行か数千行か）で判断が分かれる

2. **エクスポートの対象範囲**:
   - 全案件・全ケースか、BU や期間でフィルタリングするか
   - 削除済み案件を含めるか

3. **インポート時の更新戦略**:
   - 既存データの上書きか、差分更新か
   - 新規ケースの自動作成を許可するか、既存キーコードのみ更新か

### Research Needed（設計フェーズで調査）

1. **Hono でのバイナリレスポンス**: Option B 採用時、Hono で Excel ファイルをストリーム返却するパターン
2. **Hono でのファイルアップロード**: Option B 採用時、multipart/form-data の受信方法
3. **exceljs vs xlsx**: バックエンド Excel ライブラリの選定（Option B 採用時）
4. **パフォーマンス見積もり**: 想定データ量での Excel 生成・パース時間

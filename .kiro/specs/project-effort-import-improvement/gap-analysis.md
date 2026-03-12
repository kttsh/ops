# ギャップ分析: 案件工数インポート・エクスポート機能改善

## 1. 現状の実装概要

### バックエンド

| レイヤー | ファイル | 責務 |
|---------|---------|------|
| Routes | `routes/bulk.ts` | `GET /bulk/export-project-loads`, `POST /bulk/import-project-loads` |
| Service | `services/importExportService.ts` | エクスポートデータ集約、インポートバリデーション・委譲 |
| Data | `data/importExportData.ts` | 3テーブルJOIN SELECT、MERGE upsert（トランザクション） |
| Types | `types/importExport.ts` | Zod スキーマ（`bulkImportItemSchema`）、ExportRow 型 |

**現行エクスポートAPI レスポンス:**
```
ExportRow = { projectCaseId, projectName, caseName, loads: [{ yearMonth, manhour }] }
```

**現行インポートAPI リクエスト:**
```
BulkImportItem = { projectCaseId, yearMonth, manhour }
```

### フロントエンド

| ファイル | 責務 |
|---------|------|
| `lib/excel-utils.ts` | Excel パース・ビルドユーティリティ（491行） |
| `features/projects/hooks/useProjectBulkExport.ts` | 一括エクスポート hook |
| `features/projects/hooks/useProjectBulkImport.ts` | 一括インポート hook |
| `features/projects/api/bulk-client.ts` | Bulk API クライアント |
| `components/shared/ExcelImportDialog.tsx` | 共通インポートダイアログ（476行） |

**現行 Excel 固定列:** キーコード（projectCaseId）、案件名、ケース名 → **3列のみ**

**現行年月列フォーマット:** YYYY-MM

---

## 2. 要件対比マップ

### Req 1: Excel 列構成の拡張（3列 → 17列 + 年月列）

| 要件列 | DB カラム | 現状 | ギャップ |
|--------|----------|------|---------|
| A: 案件コード | `projects.project_code` | ✅ 存在 | — |
| B: BU | `projects.business_unit_code` | ✅ 存在 | エクスポートに未含 |
| C: 年度 | `projects.fiscal_year` | ❌ **Missing** | カラム追加必要 |
| D: 工事種別 | `projects.project_type_code` | ✅ 存在 | エクスポートに未含 |
| E: 案件名 | `projects.name` | ✅ 存在 | — |
| F: 通称・略称 | `projects.nickname` | ❌ **Missing** | カラム追加必要 |
| G: 客先名 | `projects.customer_name` | ❌ **Missing** | カラム追加必要 |
| H: オーダ | `projects.order_number` | ❌ **Missing** | カラム追加必要 |
| I: 開始時期 | `projects.start_year_month` | ✅ 存在 | — |
| J: 全体工数 | `projects.total_manhour` | ✅ 存在 | エクスポートに未含 |
| K: 月数 | `projects.duration_months` | ✅ 存在 | エクスポートに未含 |
| L: 算出根拠 | `projects.calculation_basis` | ❌ **Missing** | カラム追加必要 |
| M: 備考 | `projects.remarks` | ❌ **Missing** | カラム追加必要 |
| N: 地域 | `projects.region` | ❌ **Missing** | カラム追加必要 |
| O: 削除 | `projects.deleted_at` | ✅ 仕組みあり | インポート経由の操作なし |
| P: 工数ケースNo | `project_cases.project_case_id` | ✅ 存在 | — |
| Q: 工数ケース名 | `project_cases.case_name` | ✅ 存在 | — |
| R+: YY-MM | `project_load.year_month` | ✅ 存在 | ヘッダー形式変更（YYYY-MM → YY-MM） |

**DB 追加カラム（7列、全て NULL 許容）:** fiscal_year, nickname, customer_name, order_number, calculation_basis, remarks, region

### Req 2: 全BU横断インポート

| 機能 | 現状 | ギャップ |
|------|------|---------|
| BU コード指定 | エクスポートに BU 情報なし | **Missing** — エクスポートデータに BU/PT 含めるよう拡張 |
| BU マスタ検証 | `projectService.create()` で個別検証あり | 一括インポート API では未実装 |
| PT マスタ検証 | `projectService.create()` で個別検証あり | 一括インポート API では未実装 |
| 複数BU混在 | 非対応（画面がBU単位） | **Missing** — API・フロントエンド両方で対応必要 |

### Req 3: 新規案件の自動登録

| 機能 | 現状 | ギャップ |
|------|------|---------|
| 案件コード自動生成 | なし（クライアント指定のみ） | **Missing** — 自動採番ロジック新規実装 |
| 既存案件の更新 | `projectService.update()` あり | 一括インポート API に未統合 |
| 案件新規作成 | `projectService.create()` あり | 一括インポート API に未統合 |
| 必須項目検証 | 個別 API では Zod で検証済み | 一括インポート用の拡張スキーマ必要 |

### Req 4: 工数ケースの自動登録

| 機能 | 現状 | ギャップ |
|------|------|---------|
| ケース存在チェック | `validateProjectCaseIds()` で ID 検証 | ケース名ベースの検索なし |
| 新規ケース作成 | `projectCaseService.create()` あり | 一括インポート API に未統合 |
| ケース更新 | project_load の MERGE あり | ケースメタデータの更新なし |

### Req 5: 全案件エクスポート

| 機能 | 現状 | ギャップ |
|------|------|---------|
| 全BUエクスポート | `getExportData()` は全件取得 | **Partial** — 案件メタデータ列の追加が必要 |
| ソート順 | 案件名 ASC, ケース名 ASC | 案件コード・ケース順に変更 |
| 年月ヘッダー | YYYY-MM | YY-MM に変更 |

### Req 6: 動的年月列の取り込み

| 機能 | 現状 | ギャップ |
|------|------|---------|
| ヘッダー解析 | `convertYearMonthHeader()` (YYYY-MM → YYYYMM) | YY-MM → YYYYMM への変換が必要 |
| 最終列検出 | `parseBulkImportSheet()` で実装済み | ロジック再利用可 |
| 空セル = 0 | 実装済み | — |

### Req 7: 削除フラグによるソフトデリート

| 機能 | 現状 | ギャップ |
|------|------|---------|
| ソフトデリート | `projectData.softDelete()` あり | **Missing** — インポート経由のソフトデリートトリガー |
| エクスポート除外 | `WHERE deleted_at IS NULL` あり | — |

### Req 8: ラウンドトリップ互換性

| 機能 | 現状 | ギャップ |
|------|------|---------|
| フォーマット一致 | 現行3列では一致 | 17列フォーマットで再設計必要 |
| 全期間網羅 | `getYearMonthRange()` あり | — |

### Req 9: バリデーション

| 機能 | 現状 | ギャップ |
|------|------|---------|
| manhour 範囲 | `validateManhour()` あり | — |
| yearMonth 形式 | `validateYearMonth()` あり | YY-MM 解析の追加 |
| BU/PT マスタ検証 | 個別 API にあり | **Missing** — 一括バリデーション API 必要 |
| プレビュー表示 | `ExcelImportDialog` あり | 17列プレビュー対応必要 |
| エラー行ハイライト | 実装済み | — |

---

## 3. 実装アプローチの選択肢

### Option A: 既存コンポーネントの拡張

**対象:**
- `routes/bulk.ts` — エンドポイント拡張
- `services/importExportService.ts` — ビジネスロジック拡張
- `data/importExportData.ts` — SQL クエリ拡張
- `types/importExport.ts` — スキーマ拡張
- `lib/excel-utils.ts` — パースロジック拡張
- `useProjectBulkExport.ts` / `useProjectBulkImport.ts` — hook 拡張

**トレードオフ:**
- ✅ ファイル数最小、既存パターンの延長
- ✅ 既存テストの活用
- ❌ 既存ファイルが大幅に肥大化（特に importExportService、excel-utils）
- ❌ 既存のシンプルなインポート（projectCaseId + yearMonth + manhour）との共存が複雑

### Option B: 新規コンポーネント作成

**新規ファイル:**
- Backend: `routes/projectImportExport.ts`, `services/projectImportExportService.ts`, `data/projectImportExportData.ts`, `types/projectImportExport.ts`
- Frontend: `features/projects/hooks/useProjectFullExport.ts`, `features/projects/hooks/useProjectFullImport.ts`

**トレードオフ:**
- ✅ 既存機能への影響ゼロ
- ✅ 責務の明確な分離（シンプルな bulk vs フル機能 import/export）
- ✅ テストの独立
- ❌ コード重複のリスク（特に MERGE パターン、Excel ユーティリティ）
- ❌ ファイル数増加

### Option C: ハイブリッド（推奨）

**方針:**
- **DB スキーマ・型定義:** 既存を拡張（projects テーブルにカラム追加、型定義更新）
- **バックエンド API:** 新規エンドポイント（`GET/POST /projects/import-export`）を新ファイルで実装
- **フロントエンド hook:** 新規 hook（useProjectFullExport/Import）を作成
- **共通ユーティリティ:** `excel-utils.ts` に汎用的な YY-MM 変換を追加、残りは hook 内で処理
- **共通 UI:** `ExcelImportDialog` は再利用（17列プレビュー対応の拡張あり）

**トレードオフ:**
- ✅ 既存シンプル bulk 機能を壊さない
- ✅ 新機能は独立してテスト可能
- ✅ DB スキーマ・型は統一管理
- ✅ 共通 UI・ユーティリティの再利用
- ❌ 旧 bulk API との機能重複（将来的に統合・廃止の検討必要）

---

## 4. 複雑性とリスク

### 工数見積: **L（1〜2週間）**

**根拠:**
- DB マイグレーション（7カラム追加）+ 型定義・Transform 更新
- バックエンドに新規エンドポイント・サービス・データ層（案件/ケースの CRUD 統合型インポート）
- 案件コード自動生成ロジック
- フロントエンドの 17列フォーマット対応（エクスポート・インポート・プレビュー）
- YY-MM ⇔ YYYYMM 変換
- バリデーション（マスタ参照整合性の一括検証）

### リスク: **Medium**

**根拠:**
- 既存パターン（レイヤードアーキテクチャ、MERGE、Excel ユーティリティ）が確立済み
- 新技術の導入なし
- ただしインポート時のトランザクション範囲が広い（案件作成 + ケース作成 + 月次データ upsert を 1 トランザクションで処理する必要あり）
- 案件コード自動生成の衝突回避ロジックの設計が必要

---

## 5. デザインフェーズへの推奨事項

### 優先アプローチ: Option C（ハイブリッド）

### 主要な設計決定事項

1. **案件コード自動生成の方式** — プレフィックス + 連番？UUID？タイムスタンプベース？既存コードの命名規則調査が必要
2. **トランザクション境界** — 全行を 1 トランザクションで処理するか、案件単位で分割するか
3. **工数ケースNo（P列）の意味** — `project_case_id`（DB内部ID）か、ユーザー定義の番号か。新規ケースの場合に空にするのか
4. **バリデーション実行場所** — フロントエンドのみ（現行パターン）か、バックエンドにもマスタ検証 API を追加するか
5. **旧 bulk API との関係** — 新 API で置き換えるか、併存させるか
6. **ExcelImportDialog の拡張方針** — 17列プレビューの表示方法（水平スクロール？折りたたみ？）
7. **年度（C列）の導出ルール** — start_year_month からの自動計算か、独立フィールドか（日本の年度＝4月始まり？）

### Research Needed

- 既存の案件コードの命名パターン調査（DB 内の実データ確認）
- 大量データ（数百〜数千行）インポート時のパフォーマンス特性
- `ExcelImportDialog` の 17列対応のUI/UX設計

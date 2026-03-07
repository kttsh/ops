# ギャップ分析: indirect-simulation

## 1. 現状調査

### 既存アセット

#### 再利用可能なコンポーネント
| コンポーネント | パス | 再利用度 | 備考 |
|---|---|---|---|
| `CalculationResultTable` | `features/indirect-case-study/components/` | **そのまま利用可** | 表示専用、props経由でデータ受け取り（321行） |
| `ResultPanel` | 同上 | **部分利用可** | 保存・エクスポート・インポートのアクションボタン＋CalculationResultTableを統合（313行）。ただしCRUD関連のpropsも含む |
| `ExcelImportDialog` | `components/shared/` | **そのまま利用可** | 汎用インポートダイアログ（ドラッグ&ドロップ、プレビュー、バリデーション） |
| `Select` | `components/ui/select.tsx` | **そのまま利用可** | Radix UIベースのドロップダウン |
| `PageHeader` | `components/shared/` | **そのまま利用可** | パンくず・タイトル・アクションボタン |

#### 再利用可能なフック
| フック | 行数 | 再利用度 | 備考 |
|---|---|---|---|
| `useCapacityCalculation` | 35行 | **そのまま利用可** | API呼び出しのラッパー、パラメータを渡すだけ |
| `useIndirectWorkCalculation` | 92行 | **そのまま利用可** | クライアントサイド計算ロジック（capacities × ratios） |
| `useExcelExport` | 57行 | **そのまま利用可** | キャパシティ計算結果のExcelエクスポート |
| `useIndirectWorkLoadExcelExport` | 72行 | **そのまま利用可** | 間接工数のExcelエクスポート |
| `useIndirectWorkLoadExcelImport` | 174行 | **そのまま利用可** | Excelインポート（パース＋バリデーション＋確定） |
| `useIndirectCaseStudyPage` | 296行 | **利用不可** | CRUD・dirty tracking・ローカル編集状態が密結合。シミュレーション用に分割が必要 |

#### 再利用可能なクエリ・ミューテーション
| 関数 | 再利用度 | 用途 |
|---|---|---|
| `headcountPlanCasesQueryOptions` | **そのまま利用可** | 人員計画ケース一覧取得 |
| `capacityScenariosQueryOptions` | **そのまま利用可** | キャパシティシナリオ一覧取得 |
| `indirectWorkCasesQueryOptions` | **そのまま利用可** | 間接作業ケース一覧取得 |
| `indirectWorkTypeRatiosQueryOptions` | **そのまま利用可** | 間接作業比率取得 |
| `monthlyHeadcountPlansQueryOptions` | **そのまま利用可** | 月次人員データ取得 |
| `useBulkSaveMonthlyIndirectWorkLoads` | **そのまま利用可** | 計算結果保存 |
| CRUD系ミューテーション（Create/Update/Delete/Restore） | **不要** | シミュレーション画面ではCRUD不要 |

#### 既存パターン・規約
- **ルーティング**: TanStack Router ファイルベース、`index.tsx` + `index.lazy.tsx` のlazy loadingパターン
- **Search Params**: Zod スキーマで `bu` パラメータをバリデーション（`indirect-capacity-settings` と同一パターン）
- **SidebarNav**: `menuItems` 配列に `{ label, href, icon }` を追加するパターン
- **トースト通知**: `sonner` の `toast.success/error` または `toast-utils` のヘルパー
- **Excel操作**: `@/lib/excel-utils` に共通ユーティリティ（`buildExportWorkbook`, `parseExcelFile` 等）

---

## 2. 要件実現性分析

### 要件 → 技術ニーズマッピング

| 要件 | 必要なアセット | ギャップ |
|---|---|---|
| Req 1: ルーティング | ルートファイル、SidebarNavエントリ | **Missing**: `routes/indirect/simulation/` ディレクトリ未存在 |
| Req 2: BU選択 | BU選択コンポーネント、Search Params | **既存**: `indirect-capacity-settings` と同一パターンで実装可能 |
| Req 3: ケース・シナリオ選択 | クエリ（一覧取得）、Selectコンポーネント | **既存**: クエリ・UIコンポーネントとも流用可能 |
| Req 4: キャパシティ計算 | `useCapacityCalculation` | **既存**: フックをそのまま利用 |
| Req 5: 間接作業計算 | `useIndirectWorkCalculation`、比率クエリ | **既存**: フック・クエリとも流用可能 |
| Req 6: 結果表示 | `CalculationResultTable` | **既存**: コンポーネントをそのまま利用 |
| Req 7: 結果保存 | `useBulkSaveMonthlyIndirectWorkLoads` | **既存**: ミューテーションをそのまま利用 |
| Req 8: Excelエクスポート | `useExcelExport`, `useIndirectWorkLoadExcelExport` | **既存**: フックをそのまま利用 |
| Req 9: Excelインポート | `useIndirectWorkLoadExcelImport`, `ExcelImportDialog` | **既存**: フック・コンポーネントとも流用可能 |

### 不足しているもの
| 不足アセット | 種別 | 説明 |
|---|---|---|
| `routes/indirect/simulation/index.tsx` | **Missing** | ルート定義（Search Params バリデーション） |
| `routes/indirect/simulation/index.lazy.tsx` | **Missing** | ページコンポーネント実装 |
| `useIndirectSimulation` フック | **Missing** | シミュレーション専用のオーケストレーションフック（`useIndirectCaseStudyPage` の軽量版） |
| SidebarNav エントリ | **Missing** | ナビゲーションリンク追加 |

### 複雑性シグナル
- **ワークフロー型**: 段階的な選択→計算→結果表示の一連のフロー
- **既存パターンの踏襲**: 大半のロジックは既存フック・コンポーネントの再利用で対応可能
- **CRUD排除による簡素化**: `useIndirectCaseStudyPage` から CRUD・dirty tracking・ローカル編集を除去した軽量版で済む

---

## 3. 実装アプローチ選択肢

### Option A: 既存コンポーネントを拡張
`indirect-case-study` feature 内に `useIndirectSimulation` フックを追加し、既存コンポーネント（`ResultPanel` 等）を mode prop で切り替える。

**トレードオフ:**
- ✅ 新規ファイル最小（フック1つ + ルート2つ + SidebarNav修正）
- ✅ コンポーネント共有が自然
- ❌ `ResultPanel` に mode 分岐が入り、既存コードが複雑化する
- ❌ `indirect-case-study` feature の責務が肥大化する

### Option B: 新規 feature を作成
`features/indirect-simulation/` を新規作成し、必要なコンポーネントを `indirect-case-study` からインポートまたは複製する。

**トレードオフ:**
- ✅ 責務の明確な分離
- ✅ 独立したテスト・メンテナンスが可能
- ❌ features 間の依存が発生（CLAUDE.md の「features同士の依存は極力排除する」に抵触）
- ❌ ファイル数が増える

### Option C: ハイブリッドアプローチ（推奨）
`indirect-case-study` feature 内にシミュレーション用フック（`useIndirectSimulation`）を追加し、feature の public API としてエクスポート。ページコンポーネントは `routes/indirect/simulation/` に配置。既存の `CalculationResultTable` や計算フック、クエリ、Excel フックは `indirect-case-study` feature から直接インポート。`ResultPanel` は複製せず、ページコンポーネント内で必要なUI（アクションボタン＋テーブル）を直接組み立てる。

**トレードオフ:**
- ✅ 既存 feature の拡張として自然（シミュレーションは間接作業ケーススタディの一部）
- ✅ 新規 feature を作らないため features 間依存の問題を回避
- ✅ `ResultPanel` を mode 分岐で汚さない（ページ側で直接組み立て）
- ✅ 計算・クエリ・Excel フックの再利用が最大化
- ❌ `indirect-case-study` の index.ts エクスポートが若干増える

---

## 4. 実装複雑性 & リスク

### 工数: **S（1〜3日）**
- 既存パターンの踏襲が主体
- 新規ロジックは `useIndirectSimulation` フック（`useIndirectCaseStudyPage` の CRUD を除外した軽量版）のみ
- UI は既存コンポーネント + Select ドロップダウンの組み合わせ

### リスク: **Low**
- 使用技術はすべて既知（TanStack Router/Query、shadcn/ui、既存フック）
- アーキテクチャ変更なし
- 既存機能への影響は SidebarNav への1行追加のみ
- 計算ロジック自体は既存フックに完全に委譲

---

## 5. 設計フェーズへの推奨事項

### 推奨アプローチ: Option C（ハイブリッド）

### 主要な設計判断事項
1. **`useIndirectSimulation` フックの設計**: `useIndirectCaseStudyPage` から必要な状態管理（選択・計算・結果）のみを抽出し、CRUD・dirty tracking・ローカル編集を排除
2. **ページレイアウト**: 左パネル（選択＋計算ボタン）/ 右パネル（結果テーブル＋アクション）の2カラム構成。`ResultPanel` を直接使うかページ内で組み立てるかの判断
3. **SidebarNav のセクション構成**: 既存「案件・間接作業管理」セクションへの追加 vs 新セクション作成
4. **BU選択の実装方式**: URL Search Params（`?bu=`）で管理し、BU一覧は既存クエリで取得

### 調査継続事項（Research Needed）
- **BU選択コンポーネント**: `BusinessUnitSelector`（multi-select）を使うか、単一BU選択用の `Select` で実装するか（Issue #49 は単一BU前提に見える）
- **`ResultPanel` の再利用範囲**: props の差分を確認し、直接利用可能か・ページ側で組み立てる方が適切かを判断

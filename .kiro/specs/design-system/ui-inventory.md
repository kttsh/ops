# UI インベントリレポート

## 概要

操業管理システムのフロントエンドUIコンポーネントを Storybook でカタログ化した結果、以下の棚卸しレポートをまとめる。

- **コアUI**: 10コンポーネント
- **共有**: 2コンポーネント
- **レイアウト**: 1コンポーネント
- **feature**: 約50コンポーネント（7 feature モジュール）
- **ストーリーファイル**: 62ファイル

---

## 1. 類似パターンの重複

### DataTable（3 feature で重複）

| Feature | コンポーネント | ページネーション | 仮想化 |
|---------|---------------|:---:|:---:|
| business-units | `DataTable<TData>` | サーバーサイド | なし |
| project-types | `DataTable<TData>` | なし | なし |
| work-types | `DataTable<TData>` | なし | なし |
| workload | `WorkloadDataTable` | なし | TanStack Virtual |

- business-units の `DataTable` はサーバーサイドページネーション付きのジェネリック実装
- project-types と work-types の `DataTable` はほぼ同一のコード（ページネーションなし版）
- workload の `WorkloadDataTable` は完全に独自実装（列ピン留め、リサイズ、仮想化）

**共通化候補**: project-types と work-types の DataTable はコードがほぼ同一のため、共有コンポーネントとして `components/shared/DataTable` に統合可能。

### DataTableToolbar（4箇所で重複）

| 場所 | パターン |
|------|---------|
| `components/shared/DataTableToolbar` | 共有版（検索 + 削除済み表示 + 新規登録ボタン） |
| `features/business-units/components/DataTableToolbar` | 共有版を re-export |
| `features/project-types/components/DataTableToolbar` | 独自実装（共有版とほぼ同一） |
| `features/work-types/components/DataTableToolbar` | 独自実装（共有版とほぼ同一） |

**共通化候補**: project-types と work-types のツールバーは共有版 `DataTableToolbar` に統合可能。新規登録ボタンの遷移先だけが異なる。

### DeleteConfirmDialog（4 feature で重複）

| Feature | コンポーネント | エンティティ名 prop |
|---------|---------------|-------------------|
| components/shared | `DeleteConfirmDialog` | `entityLabel` + `entityName` |
| business-units | `DeleteConfirmDialog` | `businessUnitName` |
| project-types | `DeleteConfirmDialog` | `projectTypeName` |
| work-types | `DeleteConfirmDialog` | `workTypeName` |

- 共有版は汎用的な `entityLabel` / `entityName` で設計済み
- 各 feature 版はエンティティ固有の prop 名を使用

**共通化候補**: 各 feature 版を廃止し、共有版 `DeleteConfirmDialog` に統合可能。

### RestoreConfirmDialog（3 feature で重複）

| Feature | props |
|---------|-------|
| business-units | `open, onOpenChange, onConfirm, isLoading` |
| projects | 同上 |
| project-types | 同上 |
| work-types | 同上 |

- 4箇所で完全に同じインターフェースのダイアログ（テキストのみ異なる）

**共通化候補**: `components/shared/RestoreConfirmDialog` として統合可能。

### DebouncedSearchInput（3 feature で重複）

| 場所 | 備考 |
|------|------|
| `features/business-units/components/DebouncedSearchInput` | オリジナル実装 |
| `features/project-types/components/DebouncedSearchInput` | コピー |
| `features/work-types/components/DebouncedSearchInput` | コピー |

- 共有版 `DataTableToolbar` が business-units の `DebouncedSearchInput` を直接参照しており、feature 間依存が発生している

**共通化候補（高優先度）**: `components/shared/DebouncedSearchInput` に移動し、feature 間依存を解消すべき。

### columns.tsx（3 feature で類似パターン）

| Feature | 特徴 |
|---------|------|
| business-units | `createColumns()` ファクトリ + Link + Badge + 復元アクション |
| project-types | 同上 |
| work-types | 同上 + color カラム |

- カラム定義パターンが共通（コード列のLink、ステータスBadge、復元アクション）

**共通化候補**: 汎用的な `createMasterColumns()` ヘルパーを作成可能。

---

## 2. スタイルの不整合

### ボタンの使い方

- 削除確認ダイアログ: 共有版は `className="bg-destructive..."` を手動で追加、feature 版も同様
- フォームの送信ボタン: 統一して `variant="default"` を使用（一貫）
- ツールバーの新規登録: `variant="default"` + `Plus` アイコン（一貫）

### 間隔・レイアウト

- フォームの field 間隔: 全フォームで `gap-4` ～ `gap-6` を使用（若干のばらつきあり）
- DataTable のセル padding: `px-4 py-3`（コアUI Table）だが、WorkloadDataTable は独自スタイル

### Badge バリアント

- ステータス表示: 有効=`success`、削除済み=`destructive` で統一されている（一貫）
- case-study の isPrimary: 独自の Badge スタイル（`bg-primary/10`）

---

## 3. コンポーネント分類と依存関係

### コアUI（10）
`button`, `input`, `label`, `select`, `separator`, `sheet`, `switch`, `table`, `badge`, `alert-dialog`
- 外部依存: Radix UI、CVA、lucide-react
- 全 feature から広く参照される基盤層

### 共有（2）
`DataTableToolbar`, `DeleteConfirmDialog`
- DataTableToolbar → DebouncedSearchInput（business-units から直接参照 = 規約違反）
- DataTableToolbar → TanStack Router Link

### レイアウト（1）
`AppShell`
- TanStack Router に依存

### Feature: business-units（7）
`BusinessUnitForm`, `DataTable`, `DataTableToolbar`（re-export）, `DebouncedSearchInput`, `DeleteConfirmDialog`, `RestoreConfirmDialog`, `columns`

### Feature: projects（3）
`ProjectForm`, `RestoreConfirmDialog`, `columns`
- ProjectForm → TanStack Query（BU選択肢・案件タイプ選択肢）

### Feature: project-types（7）
`ProjectTypeForm`, `DataTable`, `DataTableToolbar`, `DebouncedSearchInput`, `DeleteConfirmDialog`, `RestoreConfirmDialog`, `columns`

### Feature: work-types（7）
`WorkTypeForm`, `DataTable`, `DataTableToolbar`, `DebouncedSearchInput`, `DeleteConfirmDialog`, `RestoreConfirmDialog`, `columns`

### Feature: case-study（7）
`CaseForm`, `CaseFormSheet`, `CaseSidebar`, `CaseStudySection`, `WorkloadChart`, `StandardEffortPreview`, `WorkloadCard`
- CaseForm → TanStack Query（標準工数マスタ）
- CaseStudySection → 複合コンポーネント（サイドバー、チャート、カード、フォームシート統合）

### Feature: workload（13）
`BusinessUnitSelector`, `FeedbackStates`（8種）, `LegendPanel`, `PeriodSelector`, `ProfileManager`, `ProjectEditSheet`, `SidePanel`, `SidePanelProjects`, `SidePanelIndirect`, `SidePanelSettings`, `ViewToggle`, `WorkloadChart`, `WorkloadDataTable`
- 最大の feature モジュール
- BusinessUnitSelector, SidePanelProjects, SidePanelSettings, ProfileManager → TanStack Query
- WorkloadDataTable → TanStack Virtual（仮想化）
- WorkloadChart → Recharts ComposedChart

### Feature: indirect-case-study（12）
`BulkInputDialog`, `CalculationResultTable`, `CapacityScenarioList`, `CaseFormSheet`, `HeadcountPlanCaseList`, `IndirectWorkCaseList`, `IndirectWorkRatioMatrix`, `MonthlyHeadcountGrid`, `ResultPanel`, `ScenarioFormSheet`, `SettingsPanel`, `UnsavedChangesDialog`
- 最多のコンポーネント数
- MonthlyHeadcountGrid, IndirectWorkRatioMatrix → TanStack Query
- CalculationResultTable → 独自テーブル実装（TanStack Table 不使用）

---

## 4. リデザイン優先順位（推奨）

影響範囲の広いコンポーネントから順に対応することを推奨する。

### 優先度 P0: 基盤層の共通化

1. **DebouncedSearchInput の共有化**
   - 影響: 3 feature + 共有 DataTableToolbar
   - 理由: feature 間依存の規約違反を解消
   - 対応: `components/shared/DebouncedSearchInput` に移動

2. **DataTable の統合**
   - 影響: business-units, project-types, work-types
   - 理由: project-types と work-types がほぼ同一コード
   - 対応: 汎用 DataTable を `components/shared/` に作成

3. **DeleteConfirmDialog の統合**
   - 影響: 4 feature
   - 理由: 共有版が既に存在、feature 版は不要
   - 対応: 各 feature 版を共有版に置き換え

### 優先度 P1: 重複パターンの整理

4. **RestoreConfirmDialog の共有化**
   - 影響: 4 feature
   - 対応: `components/shared/RestoreConfirmDialog` を作成

5. **DataTableToolbar の統合**
   - 影響: 3 feature
   - 対応: project-types, work-types 版を廃止し共有版に統合

6. **columns.tsx の共通ヘルパー**
   - 影響: 3 feature
   - 対応: `createMasterColumns()` ユーティリティ作成

### 優先度 P2: スタイル統一

7. **フォーム間隔の統一**
   - gap-4/gap-6 の使い分けルールを策定

8. **Badge バリアントの体系化**
   - ステータス表示パターンをデザイントークンとして定義

### 優先度 P3: 長期改善

9. **WorkloadDataTable のアーキテクチャ検討**
   - TanStack Table + Virtual の統合パターンを他テーブルにも展開可能か検討

10. **CalculationResultTable のリファクタリング**
    - TanStack Table を使用しない独自実装のため、統一性の観点で検討

---

## 5. 総括

- 全62ストーリーファイルが Storybook ビルドに成功
- コアUI 10 + 共有 3 + feature 約50 = 計約63コンポーネントをカタログ化
- 主要な重複パターン: DataTable（3箇所）、DeleteConfirmDialog（4箇所）、DebouncedSearchInput（3箇所）
- 最優先の改善事項: `DebouncedSearchInput` の共有化による feature 間依存の解消

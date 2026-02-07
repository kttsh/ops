# Requirements Document

## Introduction

操業管理システムのフロントエンドにおける UI スタイル改善の第一段階として、既存の全 UI コンポーネントを Storybook でカタログ化（UI インベントリ）する。これにより、現状の不整合・重複パターンを可視化し、リデザインの基盤を構築する。

Storybook v10.2.7 は既にセットアップ済みだが、プロダクションコンポーネントのストーリーは未作成である。対象は以下の3層すべてを含む：
- **コアUIプリミティブ**（`components/ui/`）: shadcn/ui ベース 10コンポーネント
- **共有・レイアウトコンポーネント**（`components/shared/`, `components/layout/`）: 3コンポーネント
- **feature コンポーネント**（`features/*/components/`）: 7 feature モジュール、約60コンポーネント

本仕様のスコープは「棚卸し（カタログ化）」フェーズに限定し、リデザイン・全体展開は後続仕様で扱う。

## Requirements

### Requirement 1: コアUIコンポーネントのストーリー作成

**Objective:** As a フロントエンド開発者, I want shadcn/ui ベースのコアUIコンポーネント（`components/ui/`配下）の全バリアントと状態が Storybook で確認できること, so that UIスタイル改善時にコンポーネントの現状を一覧で把握し、変更のインパクトを即座にプレビューできる

#### Acceptance Criteria

1. The Storybook shall `components/ui/` 配下の全10コンポーネント（button, input, label, select, separator, sheet, switch, table, badge, alert-dialog）に対応するストーリーファイルを含むこと
2. When Storybook でボタンコンポーネントのストーリーを表示した場合, the Storybook shall 全バリアント（default, destructive, outline, secondary, ghost, link）と全サイズ（default, sm, lg, icon）の組み合わせを個別のストーリーとして表示すること
3. When Storybook で input コンポーネントのストーリーを表示した場合, the Storybook shall デフォルト状態、placeholder 付き、disabled 状態、エラー状態を個別のストーリーとして表示すること
4. When Storybook で select コンポーネントのストーリーを表示した場合, the Storybook shall 閉じた状態、開いた状態、選択済み状態、disabled 状態を個別のストーリーとして表示すること
5. When Storybook で alert-dialog コンポーネントのストーリーを表示した場合, the Storybook shall ダイアログの開閉操作とアクション・キャンセルボタンの動作を確認できるストーリーを表示すること
6. When Storybook で sheet コンポーネントのストーリーを表示した場合, the Storybook shall 各方向（top, right, bottom, left）からのスライドイン表示を確認できるストーリーを表示すること
7. When Storybook で badge コンポーネントのストーリーを表示した場合, the Storybook shall 全バリアント（default, secondary, destructive, outline）を個別のストーリーとして表示すること
8. When Storybook で switch コンポーネントのストーリーを表示した場合, the Storybook shall オン・オフの切替操作と disabled 状態を確認できるストーリーを表示すること
9. When Storybook で label コンポーネントのストーリーを表示した場合, the Storybook shall デフォルト表示とフォーム要素との関連付け例を確認できるストーリーを表示すること
10. When Storybook で separator コンポーネントのストーリーを表示した場合, the Storybook shall 水平・垂直の両方向を確認できるストーリーを表示すること
11. When Storybook で table コンポーネントのストーリーを表示した場合, the Storybook shall ヘッダー・ボディ・フッターを含む基本テーブルレイアウトを確認できるストーリーを表示すること

### Requirement 2: ストーリーファイルの構成と命名規約

**Objective:** As a フロントエンド開発者, I want ストーリーファイルの配置・命名が統一されていること, so that コンポーネントとストーリーの対応関係が明確で、新規ストーリーの追加が容易になる

#### Acceptance Criteria

1. The Storybook shall ストーリーファイルを対象コンポーネントと同じディレクトリに `[ComponentName].stories.tsx` の命名規則で配置すること
2. The Storybook shall 各ストーリーファイルが CSF3（Component Story Format 3）形式で記述されていること
3. The Storybook shall 各ストーリーファイルの `title` を以下の階層構造で定義し、Storybook のサイドバーでカテゴリ別に整理されること
   - コアUI: `UI/[ComponentName]`
   - 共有: `Shared/[ComponentName]`
   - レイアウト: `Layout/[ComponentName]`
   - feature: `Features/[FeatureName]/[ComponentName]`
4. The Storybook shall 各ストーリーに `args` を使用して props のインタラクティブな変更を可能にすること

### Requirement 3: サンプルストーリーの整理

**Objective:** As a フロントエンド開発者, I want Storybook 初期セットアップ時に生成されたサンプルストーリーとサンプルコンポーネントが整理されていること, so that プロダクションコンポーネントのみがカタログに含まれ、混乱を避けられる

#### Acceptance Criteria

1. When Storybook を起動した場合, the Storybook shall `src/stories/` 配下のサンプルストーリー（Button.stories.ts, Header.stories.ts, Page.stories.ts）およびサンプルコンポーネント（Button.tsx, Header.tsx, Page.tsx）が削除されていること
2. When Storybook を起動した場合, the Storybook shall `src/stories/` 配下の関連ファイル（Configure.mdx, CSS ファイル, assets ディレクトリ）が削除されていること

### Requirement 4: 共有コンポーネントのストーリー作成

**Objective:** As a フロントエンド開発者, I want 共有コンポーネント（`components/shared/`・`components/layout/`配下）のストーリーが作成されていること, so that アプリ全体で再利用されるコンポーネントの見た目と振る舞いを一元的に確認できる

#### Acceptance Criteria

1. The Storybook shall `components/shared/DataTableToolbar` のストーリーを含み、検索入力・フィルター・アクションボタンの各状態を確認できること
2. The Storybook shall `components/shared/DeleteConfirmDialog` のストーリーを含み、ダイアログの開閉・確認・キャンセル操作を確認できること
3. The Storybook shall `components/layout/AppShell` のストーリーを含み、サイドバー展開・折りたたみ・メインコンテンツ領域のレイアウトを確認できること

### Requirement 5: feature コンポーネントのストーリー作成（フォーム系）

**Objective:** As a フロントエンド開発者, I want 各 feature モジュールのフォームコンポーネントが Storybook で確認できること, so that 入力フォームのスタイル・レイアウト・バリデーション表示の一貫性を評価できる

#### Acceptance Criteria

1. The Storybook shall `features/business-units/components/BusinessUnitForm` のストーリーを含み、新規作成モードと編集モードを確認できること
2. The Storybook shall `features/projects/components/ProjectForm` のストーリーを含み、新規作成モードと編集モードを確認できること
3. The Storybook shall `features/case-study/components/CaseForm` のストーリーを含み、新規作成モードと編集モードを確認できること
4. The Storybook shall `features/case-study/components/CaseFormSheet` のストーリーを含み、Sheet 内でのフォーム表示を確認できること
5. The Storybook shall `features/project-types/components/ProjectTypeForm` のストーリーを含み、新規作成モードと編集モードを確認できること
6. The Storybook shall `features/work-types/components/WorkTypeForm` のストーリーを含み、新規作成モードと編集モードを確認できること
7. The Storybook shall `features/indirect-case-study/components/ScenarioFormSheet` のストーリーを含み、Sheet 内でのシナリオフォーム表示を確認できること
8. When TanStack Query に依存するフォームコンポーネントのストーリーを表示した場合, the Storybook shall モックデータを使用して API 依存なしにコンポーネントを描画すること

### Requirement 6: feature コンポーネントのストーリー作成（データテーブル系）

**Objective:** As a フロントエンド開発者, I want 各 feature モジュールのデータテーブルコンポーネントが Storybook で確認できること, so that テーブルのスタイル・ソート・フィルター・ページネーション表示の一貫性を評価できる

#### Acceptance Criteria

1. The Storybook shall `features/business-units/components/DataTable` のストーリーを含み、データ表示・ソート・フィルター状態を確認できること
2. The Storybook shall `features/project-types/components/DataTable` のストーリーを含み、データ表示・ソート・フィルター状態を確認できること
3. The Storybook shall `features/work-types/components/DataTable` のストーリーを含み、データ表示・ソート・フィルター状態を確認できること
4. The Storybook shall `features/workload/components/WorkloadDataTable` のストーリーを含み、工数データのテーブル表示を確認できること
5. The Storybook shall 各テーブルストーリーが空データ状態、少量データ状態、大量データ状態を個別のストーリーとして含むこと
6. The Storybook shall `features/business-units/components/DataTableToolbar` 等のツールバーコンポーネントのストーリーを含み、検索・フィルター操作を確認できること
7. The Storybook shall `features/indirect-case-study/components/CalculationResultTable` のストーリーを含み、計算結果テーブルの表示を確認できること

### Requirement 7: feature コンポーネントのストーリー作成（チャート系）

**Objective:** As a フロントエンド開発者, I want Recharts ベースのチャートコンポーネントが Storybook で確認できること, so that チャートの色・レイアウト・インタラクションの一貫性を評価できる

#### Acceptance Criteria

1. The Storybook shall `features/workload/components/WorkloadChart` のストーリーを含み、積み上げ面グラフとキャパシティラインの表示を確認できること
2. The Storybook shall `features/case-study/components/WorkloadChart` のストーリーを含み、工数チャートの表示を確認できること
3. The Storybook shall `features/case-study/components/StandardEffortPreview` のストーリーを含み、標準工数パターンのプレビュー表示を確認できること
4. The Storybook shall 各チャートストーリーがモックデータを使用して描画され、実際のデータ形状に近いサンプルデータを含むこと

### Requirement 8: feature コンポーネントのストーリー作成（ダイアログ・パネル系）

**Objective:** As a フロントエンド開発者, I want ダイアログ・サイドパネル・セレクター等のインタラクションコンポーネントが Storybook で確認できること, so that モーダルやパネルのスタイル・トランジション・レイアウトの一貫性を評価できる

#### Acceptance Criteria

1. The Storybook shall 各 feature の `DeleteConfirmDialog` および `RestoreConfirmDialog` のストーリーを含み、確認ダイアログの表示を確認できること
2. The Storybook shall `features/indirect-case-study/components/BulkInputDialog` のストーリーを含み、一括入力ダイアログの表示を確認できること
3. The Storybook shall `features/indirect-case-study/components/UnsavedChangesDialog` のストーリーを含み、未保存変更の警告ダイアログを確認できること
4. The Storybook shall `features/workload/components/SidePanel` のストーリーを含み、パネルの展開・折りたたみ状態を確認できること
5. The Storybook shall `features/workload/components/SidePanelProjects`、`SidePanelIndirect`、`SidePanelSettings` のストーリーを含み、各タブパネルの内容を確認できること
6. The Storybook shall `features/workload/components/BusinessUnitSelector` のストーリーを含み、BU 選択 UI を確認できること
7. The Storybook shall `features/workload/components/PeriodSelector`、`ViewToggle`、`LegendPanel`、`ProfileManager` のストーリーを含み、各操作 UI を確認できること
8. The Storybook shall `features/workload/components/ProjectEditSheet` のストーリーを含み、プロジェクト編集シートの表示を確認できること
9. The Storybook shall `features/case-study/components/CaseSidebar` のストーリーを含み、ケーススタディのサイドバーを確認できること
10. The Storybook shall `features/case-study/components/CaseStudySection`、`WorkloadCard` のストーリーを含み、セクションおよびカード表示を確認できること

### Requirement 9: feature コンポーネントのストーリー作成（間接工数管理系）

**Objective:** As a フロントエンド開発者, I want 間接工数管理（indirect-case-study）の専用コンポーネントが Storybook で確認できること, so that 複雑なグリッド・マトリクス・リスト表示のスタイルを評価できる

#### Acceptance Criteria

1. The Storybook shall `features/indirect-case-study/components/MonthlyHeadcountGrid` のストーリーを含み、月別人員グリッドの表示を確認できること
2. The Storybook shall `features/indirect-case-study/components/IndirectWorkRatioMatrix` のストーリーを含み、間接工数比率マトリクスの表示を確認できること
3. The Storybook shall `features/indirect-case-study/components/CapacityScenarioList` のストーリーを含み、キャパシティシナリオの一覧表示を確認できること
4. The Storybook shall `features/indirect-case-study/components/HeadcountPlanCaseList` のストーリーを含み、人員計画ケースの一覧表示を確認できること
5. The Storybook shall `features/indirect-case-study/components/IndirectWorkCaseList` のストーリーを含み、間接業務ケースの一覧表示を確認できること
6. The Storybook shall `features/indirect-case-study/components/ResultPanel`、`SettingsPanel` のストーリーを含み、結果パネルと設定パネルの表示を確認できること

### Requirement 10: Storybook のモック・デコレータ基盤

**Objective:** As a フロントエンド開発者, I want feature コンポーネントの外部依存（TanStack Query, TanStack Form, Recharts 等）が Storybook 上でモックされて動作すること, so that API サーバーなしにすべてのコンポーネントを独立して描画・操作できる

#### Acceptance Criteria

1. The Storybook shall TanStack Query に依存するコンポーネントのために `QueryClientProvider` デコレータを提供し、全ストーリーで QueryClient が利用可能であること
2. The Storybook shall TanStack Query のクエリに対してモックデータをプリセットする仕組み（QueryClient の初期キャッシュ設定またはハンドラモック）を提供すること
3. The Storybook shall TanStack Form に依存するフォームコンポーネントがストーリー上で入力・バリデーション操作を実行できること
4. The Storybook shall Recharts に依存するチャートコンポーネントがモックデータで描画されること
5. The Storybook shall TanStack Table に依存するテーブルコンポーネントがモックデータとカラム定義で描画されること
6. The Storybook shall 各 feature のモックデータを `[feature]/components/__mocks__/` または `[feature]/components/[Component].stories.tsx` 内に配置し、実際のデータ構造に準拠した型安全なモックを使用すること

### Requirement 11: Storybook のアクセシビリティ検証統合

**Objective:** As a フロントエンド開発者, I want 各ストーリーでアクセシビリティ検証が自動実行されること, so that UIスタイル改善時にアクセシビリティの退行を早期に検知できる

#### Acceptance Criteria

1. The Storybook shall `@storybook/addon-a11y`（既にインストール済み）を有効化し、全ストーリーでアクセシビリティパネルを表示すること
2. When Storybook で任意のストーリーを表示した場合, the Storybook shall axe-core によるアクセシビリティ違反を自動検出し、結果をパネルに表示すること

### Requirement 12: ドキュメントとインタラクション

**Objective:** As a フロントエンド開発者, I want 各コンポーネントの props 定義と使用例がドキュメントとして自動生成されること, so that コンポーネントの使い方を Storybook 上で即座に確認できる

#### Acceptance Criteria

1. The Storybook shall `@storybook/addon-docs`（既にインストール済み）により、各コンポーネントの props テーブルを自動生成して表示すること
2. The Storybook shall 各コンポーネントのドキュメントページに、基本的な使用例コードを含むこと
3. When Storybook の Controls パネルで props の値を変更した場合, the Storybook shall プレビュー領域にリアルタイムで変更を反映すること

### Requirement 13: UI インベントリレポート

**Objective:** As a フロントエンド開発者, I want 全コンポーネントのカタログ化完了後に、UIの不整合・重複パターンが一覧として記録されること, so that 次フェーズのリデザイン対象と優先順位を判断できる

#### Acceptance Criteria

1. The Storybook shall 全コンポーネントのストーリー作成完了後、以下の観点でUIインベントリレポートを `.kiro/specs/design-system/ui-inventory.md` に記録すること
   - 類似パターンの重複（例: 複数 feature に存在する DataTable、DeleteConfirmDialog 等）
   - スタイルの不整合（例: ボタンの使い方、間隔、色使いの差異）
   - 共通化候補のコンポーネント
2. The Storybook shall レポートに各コンポーネントの分類（コアUI / 共有 / feature）と依存関係の概要を含むこと
3. The Storybook shall レポートにリデザイン時の推奨優先順位（影響範囲の広いコンポーネントから順）を含むこと

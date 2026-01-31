# ギャップ分析: メインダッシュボード (main-dashboard)

## 1. 現状調査 (Current State Investigation)

### 1.1 フロントエンド既存資産

#### ルート構成
- **既存ルート**: `/master/` 配下の CRUD ルートのみ（projects, business-units, work-types, project-types）
- **ダッシュボードルート**: `/workload` は **未実装**
- ルーティング基盤: TanStack Router v1.121.3（ファイルベースルーティング）

#### Feature モジュール構成（4件）
全 Feature が以下の統一パターンに従う:
```
features/[feature]/
├── api/          # api-client.ts, queries.ts, mutations.ts
├── components/   # DataTable, columns, Form, Dialogs
├── types/        # Zod schemas + TypeScript types
└── index.ts      # Public API exports
```

#### 再利用可能コンポーネント
| コンポーネント | 種別 | ダッシュボードでの再利用可能性 |
|---|---|---|
| `components/ui/button.tsx` | shadcn/ui | ○ そのまま利用 |
| `components/ui/badge.tsx` | shadcn/ui | ○ BU選択数バッジ等 |
| `components/ui/select.tsx` | shadcn/ui | ○ フィルタ選択 |
| `components/ui/sheet.tsx` | shadcn/ui | ○ モバイルサイドパネル |
| `components/ui/switch.tsx` | shadcn/ui | ○ 表示/非表示トグル |
| `components/ui/table.tsx` | shadcn/ui | ○ テーブル基盤 |
| `components/ui/separator.tsx` | shadcn/ui | ○ セクション区切り |
| `components/ui/alert-dialog.tsx` | shadcn/ui | △ 確認ダイアログ |
| `components/layout/AppShell.tsx` | レイアウト | ○ ナビゲーション拡張 |
| `components/shared/DataTableToolbar.tsx` | 共有 | △ テーブルフィルタ基盤 |

#### インストール済みライブラリ
| ライブラリ | バージョン | ダッシュボードでの利用 | 現在の使用状況 |
|---|---|---|---|
| `recharts` | ^3.7.0 | チャート描画の中核 | **未使用** |
| `@tanstack/react-table` | ^8.21.3 | データテーブル | 全 Feature で使用中 |
| `@tanstack/react-query` | ^5.80.7 | データ取得・キャッシュ | 全 Feature で使用中 |
| `@tanstack/react-form` | ^1.12.2 | フォーム（設定画面等） | 全 Feature で使用中 |
| `@tanstack/react-router` | ^1.121.3 | ルーティング | 全 Feature で使用中 |
| `zod` | ^4.3.6 | バリデーション | 全 Feature で使用中 |
| `lucide-react` | ^0.513.0 | アイコン | 全 Feature で使用中 |
| `sonner` | ^2.0.3 | トースト通知 | 全 Feature で使用中 |

**未インストールだが必要になる可能性のあるライブラリ:**
| ライブラリ | 用途 |
|---|---|
| `@tanstack/react-virtual` | テーブル仮想スクロール（Req 12: 最大1,000行対応） |
| `@dnd-kit/*` | ドラッグ&ドロップ（Req 9: 間接作業並び順変更） |

#### 確立されたパターン
- **Query Key Factory パターン**: `xxxKeys.all → lists → list(params) → details → detail(id)`
- **API Client パターン**: `fetchList/fetchOne/create/update/delete` + `handleResponse<T>`
- **API レスポンス型**: `PaginatedResponse<T>`, `SingleResponse<T>`, `ProblemDetails`
- **Search Params 駆動**: URL パラメータによる状態管理（ページネーション、フィルタ）
- **テスト**: feature 内 `__tests__/` に配置

#### 共有 Hooks / Stores
- **Hooks**: 空ディレクトリのみ（カスタムフックなし）
- **Stores**: Zustand 等の状態管理ライブラリは未導入（TanStack Query + URL params で管理）

### 1.2 バックエンド既存資産

#### ダッシュボード関連 API（実装済み）
| エンドポイント | 用途 | ダッシュボード要件との対応 |
|---|---|---|
| `GET /chart-data` | 集約チャートデータ | Req 1, 2, 18 の主データソース |
| `GET /business-units` | BU一覧 | Req 6: BU選択 |
| `GET /capacity-scenarios` | キャパシティシナリオ一覧 | Req 2: キャパシティライン |
| `GET /projects` | 案件一覧 | Req 8: 案件選択 |
| `GET /project-types` | 案件タイプ一覧 | Req 1: スタック分類 |
| `GET /indirect-work-cases` | 間接作業ケース一覧 | Req 9: 間接作業設定 |
| `GET /chart-views` | チャートビュー設定 | Req 15: プロファイル管理 |
| `GET /chart-color-settings` | カラー設定 | Req 9, 10: 配色設定 |
| `PUT /chart-color-settings/bulk` | カラー設定一括更新 | Req 9, 10: 配色永続化 |
| `GET /chart-stack-order-settings` | スタック順序設定 | Req 9, 10: 順序設定 |
| `PUT /chart-stack-order-settings/bulk` | スタック順序一括更新 | Req 9, 10: 順序永続化 |
| `GET /chart-views/:id/project-items` | チャートビュー案件項目 | Req 8: 案件フィルタ |
| `GET /chart-views/:id/indirect-work-items` | チャートビュー間接作業項目 | Req 9: 間接作業フィルタ |
| `GET /chart-color-palettes` | カラーパレット | Req 9, 10: プリセットパレット |

**`GET /chart-data` レスポンス構造**:
```typescript
{
  data: {
    projectLoads: ProjectLoadAggregation[],      // 案件タイプ別集約
    indirectWorkLoads: IndirectWorkLoadAggregation[], // 間接作業ケース別集約
    capacities: CapacityAggregation[],           // キャパシティシナリオ別
    period: { startYearMonth, endYearMonth },
    businessUnitCodes: string[]
  }
}
```

---

## 2. 要件実現性分析 (Requirements Feasibility Analysis)

### 2.1 要件→技術マッピング

| Req | 要件名 | 必要な技術要素 | ギャップ |
|-----|--------|----------------|----------|
| 1 | 積み上げエリアチャート | Recharts `ComposedChart` + `Area` | **Missing**: チャートコンポーネント一式が未実装 |
| 2 | キャパシティライン | Recharts `Line` (破線スタイル) | **Missing**: 同上 |
| 3 | 固定凡例パネル | カスタムコンポーネント（288px固定幅） | **Missing**: 凡例パネルコンポーネント未実装 |
| 4 | クリック詳細表示 | Recharts onClick + 状態管理 | **Missing**: チャートインタラクション未実装 |
| 5 | 案件ドリルダウン | Collapsible + アコーディオン | **Missing**: Collapsible はRadix UI導入済み |
| 6 | BU選択 | マルチセレクトチェックボックスUI | **Missing**: マルチセレクトコンポーネント未実装 |
| 7 | 表示期間設定 | YYYY/MM入力 + プリセットボタン + Zod | **Missing**: 期間入力コンポーネント未実装 |
| 8 | 案件選択 | カード型リスト + 検索 + ソート | **Missing**: カード型選択UIが未実装 |
| 9 | 間接作業設定 | トグル + DnD + カラーピッカー | **Missing**: DnD・カラーピッカー未実装 |
| 10 | 表示設定 | 順序変更 + カラー設定 | **Missing**: Req 9 と共通基盤 |
| 11 | ビュー切替 | セグメントコントロール | **Missing**: ビュー切替UIが未実装 |
| 12 | データテーブル | TanStack Table + 仮想スクロール | **Missing**: `@tanstack/react-virtual` 未インストール、仮想化テーブル未実装 |
| 13 | テーブルフィルタリング | グローバルフィルタ + 行タイプフィルタ | **Constraint**: 既存 DataTable は単純検索のみ |
| 14 | 年単位表示切替 | 列動的生成 + 年フィルタ | **Missing**: 動的列生成パターン未実装 |
| 15 | プロファイル管理 | chart-views CRUD | **Constraint**: バックエンド API 済、フロントエンド未実装 |
| 16 | サイドパネル | 600px幅パネル + タブ | **Missing**: パネルコンポーネント未実装（Sheet は全画面用） |
| 17 | コンテキスト操作 | チャートクリック → ナビゲーション | **Missing**: チャートコンテキストメニュー未実装 |
| 18 | データ取得・キャッシュ | TanStack Query + stale time | **Constraint**: パターン確立済み、拡張可能 |
| 19 | ローディング・エラー・空状態 | スケルトン + エラーカード | **Missing**: スケルトンコンポーネント未実装 |
| 20 | パフォーマンス | メモ化 + 仮想化 | **Research Needed**: Recharts パフォーマンス特性 |
| 21 | レスポンシブ | ブレークポイント制御 | **Constraint**: AppShell に基本レスポンシブあり |
| 22 | データ整合性 | 単一データソース設計 | **Constraint**: アーキテクチャ設計で対応 |

### 2.2 主要ギャップ

#### Missing（未実装）
1. **チャートコンポーネント群**: Recharts ベースの ComposedChart、Area、Line、カスタムカーソル、カスタムツールチップ抑制
2. **凡例パネル**: 288px 固定幅のカスタム凡例（ホバー/クリック連動、ドリルダウン付き）
3. **サイドパネル**: 600px 幅の開閉式パネル（3タブ構成、既存 Sheet とは異なるレイアウト）
4. **BUマルチセレクト**: チェックボックス + 全選択/全解除 + 検索フィルタ + バッジ
5. **仮想化テーブル**: `@tanstack/react-virtual` 統合の行仮想化テーブル
6. **案件カード型リスト**: 案件情報表示カード + 選択トグル + 検索 + ソート
7. **カラーピッカー/パレット選択**: プリセットパレットからの色選択UI
8. **DnD並び順変更**: ドラッグ&ドロップによる順序変更（代替: 上下ボタン）
9. **状態管理**: ダッシュボード固有の複合状態（BU選択、期間、ビューモード、凡例固定等）
10. **スケルトンローダー**: チャート・テーブル用のローディングプレースホルダー

#### Research Needed
1. **Recharts v3 ComposedChart パフォーマンス**: 60ヶ月 × 複数シリーズでの描画性能
2. **@tanstack/react-virtual + TanStack Table 統合**: 列ピン固定との併用パターン
3. **DnDライブラリ選定**: `@dnd-kit` vs 上下ボタンのみ（要件では「ドラッグ&ドロップまたは上下ボタン」）
4. **カラーピッカー実装方式**: ネイティブ input[type=color] vs カスタムプリセットパレットUI
5. **状態管理アプローチ**: URL Search Params のみ vs Zustand 併用 vs TanStack Query + ローカル state

#### Constraints（制約）
1. **既存パターンとの整合**: Query Key Factory、API Client パターン、Feature モジュール構成を踏襲する必要あり
2. **AppShell レイアウト**: 既存のサイドバー（lg: 256px）+ ヘッダー（56px）の中にダッシュボード固有レイアウトを構成する必要あり
3. **shadcn/ui スタイルシステム**: CSS 変数ベースのテーマに適合させる必要あり

### 2.3 複雑性シグナル

| 分類 | 該当要件 |
|------|----------|
| **単純 CRUD** | なし（ダッシュボードは表示・操作特化） |
| **アルゴリズム/ロジック** | Req 1 (スタック計算), Req 4 (ホバー/クリック状態遷移), Req 12 (仮想化), Req 20 (パフォーマンス最適化) |
| **ワークフロー** | Req 6→18→1 (BU選択→データ取得→チャート描画), Req 15 (プロファイル保存/呼出) |
| **UI/UX複合** | Req 3+4+5 (凡例パネルインタラクション), Req 16 (サイドパネル3タブ), Req 9+10 (設定カスタマイズ), Req 21 (レスポンシブ) |

---

## 3. 実装アプローチ選択肢

### Option A: 既存コンポーネント拡張

**適用対象**: AppShell ナビゲーション拡張、TanStack Query/Table パターンの踏襲、共通 UI コンポーネント再利用

- **拡張するファイル/モジュール**:
  - `components/layout/AppShell.tsx`: メニューに「ダッシュボード」項目追加
  - `lib/api/types.ts`: チャートデータ用のレスポンス型追加
  - `components/shared/DataTableToolbar.tsx`: テーブルフィルタ拡張（行タイプフィルタ追加）
- **互換性**: 既存ルートへの影響なし
- **トレードオフ**:
  - ✅ 既存パターン活用で一貫性維持
  - ❌ ダッシュボード固有の複雑性は既存コンポーネントでは吸収しきれない

### Option B: 新規 Feature モジュール作成（推奨）

**適用対象**: ダッシュボード全体を `features/workload/` として独立モジュール化

- **新規作成の根拠**:
  - ダッシュボードは CRUD とは根本的に異なるビジュアライゼーション機能
  - 独自の状態管理（BU選択、期間、ビューモード、凡例状態、チャートインタラクション）が必要
  - コンポーネント数が多く、既存 Feature とは構成が大きく異なる
- **提案する構成**:
  ```
  features/workload/
  ├── api/
  │   ├── api-client.ts          # chart-data, chart-views API
  │   ├── queries.ts             # queryOptions + key factory
  │   └── mutations.ts           # 設定保存 mutations
  ├── components/
  │   ├── WorkloadChart.tsx       # ComposedChart ラッパー
  │   ├── ChartAreas.tsx          # Area 描画ロジック
  │   ├── ChartCapacityLines.tsx  # Line 描画ロジック
  │   ├── LegendPanel.tsx         # 固定凡例パネル
  │   ├── LegendDrilldown.tsx     # ドリルダウンアコーディオン
  │   ├── SidePanel.tsx           # 600px 開閉パネル
  │   ├── SidePanelProjects.tsx   # 案件タブ
  │   ├── SidePanelIndirect.tsx   # 間接作業タブ
  │   ├── SidePanelSettings.tsx   # 設定タブ
  │   ├── BusinessUnitSelector.tsx # BU マルチセレクト
  │   ├── PeriodSelector.tsx      # 期間設定
  │   ├── ViewToggle.tsx          # ビュー切替
  │   ├── WorkloadDataTable.tsx   # 仮想化データテーブル
  │   ├── DataTableColumns.tsx    # 動的列定義
  │   ├── ColorPicker.tsx         # カラーピッカー
  │   ├── ProfileManager.tsx      # プロファイル管理
  │   ├── SkeletonChart.tsx       # スケルトンローダー
  │   └── EmptyState.tsx          # 空状態カード
  ├── hooks/
  │   ├── useChartData.ts         # チャートデータ取得・変換
  │   ├── useLegendState.ts       # 凡例パネル状態管理
  │   ├── useWorkloadFilters.ts   # フィルタ状態管理
  │   └── useTableData.ts         # テーブルデータ加工
  ├── types/
  │   └── index.ts                # チャート関連型定義
  └── index.ts
  ```
- **統合ポイント**: AppShell メニュー追加、`lib/api/` の共通ユーティリティ使用
- **トレードオフ**:
  - ✅ 責務の明確な分離
  - ✅ 独立したテスト・開発が可能
  - ✅ 既存 Feature への影響ゼロ
  - ❌ 多くの新規ファイル作成が必要

### Option C: ハイブリッドアプローチ

**適用対象**: Feature モジュールは新規作成しつつ、段階的に実装

- **フェーズ分割**:
  - **Phase 1（MVP）**: BU選択 → チャート描画 → 固定凡例 → 基本テーブル
  - **Phase 2（インタラクション）**: クリック固定、ドリルダウン、サイドパネル
  - **Phase 3（カスタマイズ）**: 配色設定、並び順変更、プロファイル管理
  - **Phase 4（最適化）**: 仮想スクロール、パフォーマンス最適化、レスポンシブ
- **リスク軽減**: 各フェーズで動作確認可能、段階的に複雑性を追加
- **トレードオフ**:
  - ✅ 早期にフィードバック取得可能
  - ✅ リスクの段階的管理
  - ❌ フェーズ間のインターフェース設計が重要

---

## 4. Research Needed（設計フェーズに持ち越し）

| # | 調査項目 | 影響する要件 |
|---|----------|-------------|
| R1 | Recharts v3 の `ComposedChart` + `Area` + `Line` の組み合わせパフォーマンス（60ヶ月×10+シリーズ） | Req 1, 2, 20 |
| R2 | `@tanstack/react-virtual` と TanStack Table の統合パターン（列ピン固定 + 行仮想化） | Req 12, 20 |
| R3 | DnD ライブラリ選定（`@dnd-kit/core` + `@dnd-kit/sortable` vs 上下ボタンのみ） | Req 9, 10 |
| R4 | ダッシュボード状態管理の最適アプローチ（URL params + React state vs Zustand 導入） | Req 4, 6, 7, 11 |
| R5 | Recharts カスタムカーソル（ReferenceLine）+ ツールチップ非表示の実装方法 | Req 4 |
| R6 | サイドパネルレイアウト設計（AppShell サイドバーとの共存） | Req 16, 21 |

---

## 5. 実装複雑性・リスク評価

### 全体評価

- **工数規模**: **XL**（2週間以上）
  - 理由: 22要件、新規 Feature モジュール、チャートライブラリ初回統合、仮想化テーブル、複合状態管理、3レスポンシブブレークポイント

- **リスク**: **Medium**
  - 理由: バックエンド API は全て実装済み、TanStack エコシステムの知見あり、Recharts はインストール済みだが未使用（初回統合リスク）。パフォーマンス要件（500ms描画、60fps）が具体的で、達成可否は実装後に検証が必要

### 要件別評価

| Req | 要件名 | 工数 | リスク | 備考 |
|-----|--------|------|--------|------|
| 1 | 積み上げエリアチャート | L | Medium | Recharts 初回統合、スタック順序ロジック |
| 2 | キャパシティライン | S | Low | Line コンポーネント追加 |
| 3 | 固定凡例パネル | M | Low | カスタムコンポーネント、データバインディング |
| 4 | クリック詳細表示 | M | Medium | 状態遷移ロジック（ホバー/固定/解除） |
| 5 | 案件ドリルダウン | S | Low | Collapsible 利用 |
| 6 | BU選択 | M | Low | マルチセレクトUI、既存パターン拡張 |
| 7 | 表示期間設定 | S | Low | Zod バリデーション + 入力UI |
| 8 | 案件選択 | M | Low | カードリスト + 検索 + ソート |
| 9 | 間接作業設定 | M | Medium | DnD or 上下ボタン + カラー設定 |
| 10 | 表示設定 | M | Low | Req 9 と共通パターン |
| 11 | ビュー切替 | S | Low | セグメントコントロール |
| 12 | データテーブル | L | Medium | 仮想スクロール + 列ピン固定 + 動的列 |
| 13 | テーブルフィルタリング | S | Low | 既存パターン拡張 |
| 14 | 年単位表示切替 | S | Low | 列定義再生成 |
| 15 | プロファイル管理 | M | Low | CRUD パターン（API 済） |
| 16 | サイドパネル | M | Medium | AppShell との共存レイアウト |
| 17 | コンテキスト操作 | S | Low | クリック → navigate |
| 18 | データ取得・キャッシュ | M | Low | 既存 TanStack Query パターン |
| 19 | ローディング・エラー・空状態 | M | Low | 新規コンポーネントだが単純 |
| 20 | パフォーマンス | M | High | 具体的な数値目標あり、測定・チューニング必要 |
| 21 | レスポンシブ | M | Medium | 3ブレークポイント、レイアウト大幅変更 |
| 22 | データ整合性 | S | Low | アーキテクチャ設計で対応 |

### 設計フェーズへの推奨事項

- **推奨アプローチ**: **Option B（新規 Feature モジュール）** + **Option C のフェーズ分割**
  - `features/workload/` として独立モジュール作成
  - MVP（チャート + 凡例 + テーブル基本）→ インタラクション → カスタマイズ → 最適化の段階実装
- **優先調査項目**: R1（Recharts パフォーマンス）、R2（仮想化テーブル）、R4（状態管理）
- **アーキテクチャ決定**: サイドパネルとAppShellサイドバーの共存設計が最重要の設計判断

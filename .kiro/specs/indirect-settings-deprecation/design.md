# Design Document: indirect-settings-deprecation

## Overview

**Purpose**: 旧 `/master/indirect-capacity-settings` ルートを廃止し、サイドバーナビゲーションを最終的な4カテゴリ構成に更新することで、画面構成の整合性を確保する。

**Users**: 開発者（コードベース保守）およびエンドユーザー（ナビゲーション利用）。

**Impact**: 旧ルートファイルの削除、SidebarNav の再構成、未参照コードの整理により、コードベースをクリーンな状態にする。

### Goals
- 旧 `indirect-capacity-settings` ルートの完全削除
- SidebarNav を4カテゴリ構成（ダッシュボード / 案件管理 / 間接作業管理 / マスタ管理）に更新
- 旧ルート専用コード（`useIndirectCaseStudyPage`, `SettingsPanel`）の削除
- TypeScript エラー0件・テスト全パスの維持

### Non-Goals
- `ResultPanel` の削除（シミュレーション画面が使用中）
- `indirect-case-study` feature の大規模リファクタリング
- 新規画面やコンポーネントの作成
- バックエンドAPIの変更

## Architecture

### Existing Architecture Analysis

現在のフロントエンドは TanStack Router のファイルベースルーティングを採用し、`src/routes/` 配下のディレクトリ構成からルートツリー（`routeTree.gen.ts`）を自動生成する。`SidebarNav` は `menuItems` 配列でメニュー構成を静的に定義している。

**変更対象の既存パターン**:
- ルートファイル削除 → `routeTree.gen.ts` 自動再生成
- `SidebarNav.tsx` の `menuItems` 配列 → 直接編集
- `AppShell.tsx` のパス条件 → 条件行の削除
- `indirect-case-study/index.ts` のエクスポート → 不要エクスポートの削除

### Architecture Pattern & Boundary Map

本変更は既存アーキテクチャパターンの範囲内で完結する。新しいパターンやバウンダリの導入は不要。

**Architecture Integration**:
- Selected pattern: 既存パターン踏襲（ファイルベースルーティング + 静的メニュー定義）
- Domain/feature boundaries: `indirect-case-study` feature のパブリック API を縮小するのみ
- Existing patterns preserved: TanStack Router のファイルベースルーティング、feature の index.ts によるエクスポート管理
- Steering compliance: feature 間の依存排除、`index.ts` でのパブリック API エクスポート

### Technology Stack

| Layer | Choice / Version | Role in Feature | Notes |
|-------|------------------|-----------------|-------|
| Frontend | React 19 + TanStack Router | ルートファイル削除・ルートツリー再生成 | 既存バージョンのまま |
| UI | SidebarNav (lucide-react アイコン) | メニュー構成の再定義 | アイコン追加なし |

## Requirements Traceability

| Requirement | Summary | Components | Interfaces | Flows |
|-------------|---------|------------|------------|-------|
| 1.1 | ルートディレクトリ削除 | RouteCleanup | — | — |
| 1.2 | 旧パスで404表示 | RouteCleanup | — | — |
| 1.3 | routeTree.gen.ts から除外 | RouteCleanup | — | — |
| 2.1 | 4カテゴリ表示 | SidebarNavUpdate | MenuItems | — |
| 2.2 | ダッシュボードカテゴリ | SidebarNavUpdate | MenuItems | — |
| 2.3 | 案件管理カテゴリ | SidebarNavUpdate | MenuItems | — |
| 2.4 | 間接作業管理カテゴリ | SidebarNavUpdate | MenuItems | — |
| 2.5 | マスタ管理カテゴリ | SidebarNavUpdate | MenuItems | — |
| 2.6 | メニュー遷移 | SidebarNavUpdate | MenuItems | — |
| 2.7 | 旧メニュー項目除外 | SidebarNavUpdate | MenuItems | — |
| 3.1 | useIndirectCaseStudyPage 削除 | DeadCodeCleanup | ExportUpdate | — |
| 3.2 | SettingsPanel 削除 | DeadCodeCleanup | ExportUpdate | — |
| 3.3 | ResultPanel 存続判定 | DeadCodeCleanup | — | — |
| 3.4 | index.ts エクスポート整理 | DeadCodeCleanup | ExportUpdate | — |
| 4.1 | TypeScript エラー0件 | Verification | — | — |
| 4.2 | テスト全パス | Verification | — | — |
| 4.3 | dev サーバー正常起動 | Verification | — | — |

## Components and Interfaces

| Component | Domain/Layer | Intent | Req Coverage | Key Dependencies | Contracts |
|-----------|--------------|--------|--------------|------------------|-----------|
| RouteCleanup | Routes | 旧ルートファイルの削除 | 1.1, 1.2, 1.3 | routeTree.gen.ts (P0) | — |
| SidebarNavUpdate | Layout | メニュー構成の4カテゴリ化 | 2.1–2.7 | SidebarNav.tsx (P0) | State |
| AppShellUpdate | Layout | パス条件の整理 | 1.1 | AppShell.tsx (P1) | — |
| DeadCodeCleanup | Feature | 未参照コード・エクスポートの削除 | 3.1–3.4 | index.ts (P0) | — |
| Verification | Quality | ビルド・テスト・起動の検証 | 4.1–4.3 | — | — |

### Layout Layer

#### SidebarNavUpdate

| Field | Detail |
|-------|--------|
| Intent | `menuItems` 配列を4カテゴリ構成に再定義する |
| Requirements | 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7 |

**Responsibilities & Constraints**
- `menuItems` 配列を4グループに再構成する
- 旧「間接作業・キャパシティ」項目を除外する
- 各メニュー項目の `href` が既存ルートに対応していることを保証する

**Dependencies**
- Inbound: なし
- Outbound: TanStack Router Link コンポーネント — ナビゲーション（P0）
- External: lucide-react — アイコン（P2）

**Contracts**: State [x]

##### State Management

最終的な `menuItems` 構成:

```typescript
const menuItems: MenuGroup[] = [
  {
    label: "ダッシュボード",
    children: [
      { label: "山積ダッシュボード", href: "/workload", icon: BarChart3 },
    ],
  },
  {
    label: "案件管理",
    children: [
      { label: "案件一覧", href: "/projects", icon: Briefcase },
      { label: "標準工数パターン", href: "/projects/standard-efforts", icon: TrendingUp },
    ],
  },
  {
    label: "間接作業管理",
    children: [
      { label: "シミュレーション", href: "/indirect/simulation", icon: Play },
    ],
  },
  {
    label: "マスタ管理",
    children: [
      { label: "人員計画ケース", href: "/master/headcount-plans", icon: Users },
      { label: "キャパシティシナリオ", href: "/master/capacity-scenarios", icon: Clock },
      { label: "間接作業ケース", href: "/master/indirect-work-cases", icon: ListChecks },
      { label: "案件タイプ", href: "/master/project-types", icon: FolderKanban },
      { label: "作業種類", href: "/master/work-types", icon: Palette },
      { label: "ビジネスユニット", href: "/master/business-units", icon: Building2 },
    ],
  },
];
```

**Implementation Notes**
- `Calculator` アイコンのインポートは旧項目削除に伴い不要となるため削除する
- `allHrefs` 定数は `menuItems` から自動導出されるため変更不要

#### AppShellUpdate

| Field | Detail |
|-------|--------|
| Intent | レイアウトのパス条件から旧ルートパスを除去する |
| Requirements | 1.1 |

**Implementation Notes**
- `AppShell.tsx` L83 の `currentPath.startsWith("/master/indirect-capacity-settings")` 条件を削除
- 他のパス条件（`/workload`, `/master/headcount-plans` 等）は維持

### Routes Layer

#### RouteCleanup

| Field | Detail |
|-------|--------|
| Intent | 旧ルートファイルのディレクトリごとの削除 |
| Requirements | 1.1, 1.2, 1.3 |

**Implementation Notes**
- `src/routes/master/indirect-capacity-settings/` ディレクトリを削除（`index.tsx`, `index.lazy.tsx`）
- `routeTree.gen.ts` は `pnpm dev` 実行時に TanStack Router が自動再生成する
- 旧パスへのアクセスは TanStack Router のデフォルト動作により404/フォールバックが表示される

### Feature Layer

#### DeadCodeCleanup

| Field | Detail |
|-------|--------|
| Intent | 旧ルート専用の未参照コードとエクスポートを削除する |
| Requirements | 3.1, 3.2, 3.3, 3.4 |

**Responsibilities & Constraints**
- 旧ルートのみが参照するファイルを削除する
- シミュレーション画面等が参照するファイルは存続させる
- `index.ts` のエクスポートを削除済みファイルに合わせて整理する

**削除対象ファイル**:

| ファイル | 理由 |
|---------|------|
| `hooks/useIndirectCaseStudyPage.ts` | 旧ルートのみが参照（3.1） |
| `components/SettingsPanel.tsx` | 旧ルートのみが参照（3.2） |
| `components/SettingsPanel.stories.tsx` | SettingsPanel のストーリーファイル |

**存続ファイル**:

| ファイル | 参照元 |
|---------|--------|
| `components/ResultPanel.tsx` | `/indirect/simulation/index.lazy.tsx`（3.3 条件不成立） |
| `components/ResultPanel.stories.tsx` | ResultPanel のストーリー |
| `hooks/useCapacityCalculation.ts` | `useIndirectSimulation.ts` |
| `hooks/useIndirectWorkCalculation.ts` | `useIndirectSimulation.ts`, `ResultPanel.tsx` 等 |
| `hooks/useExcelExport.ts` | `ResultPanel.tsx` |

**index.ts エクスポート削除対象**:
- `export { SettingsPanel } from "./components/SettingsPanel"`
- `export { useIndirectCaseStudyPage } from "./hooks/useIndirectCaseStudyPage"`

**Implementation Notes**
- 削除後に TypeScript コンパイルを実行し、他の参照漏れがないことを確認する

## Testing Strategy

### 手動テスト
- 旧パス `/master/indirect-capacity-settings` へのアクセスで404表示を確認
- SidebarNav の全メニュー項目（10項目）の表示と遷移を確認
- シミュレーション画面（`/indirect/simulation`）が正常に動作することを確認（ResultPanel の存続確認）

### ビルド検証
- `pnpm build` — TypeScript コンパイルエラー0件
- `pnpm test` — 既存テストスイート全パス
- `pnpm dev` — ルートツリー再生成・開発サーバー正常起動

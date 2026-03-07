# Design Document: projects-route-restructure

## Overview

**Purpose**: 案件管理（projects）と標準工数パターン（standard-effort-masters）のフロントエンドルーティングを `/master/` 配下から `/projects/` 配下に再構成し、ナビゲーション構造を論理的に整理する。

**Users**: 開発者がルート構成の一貫性を維持するため、およびエンドユーザーがサイドバーナビゲーションから案件関連画面に正しく遷移するために使用する。

**Impact**: フロントエンドのルートファイル物理配置と全パス参照を変更する。バックエンド API・データモデル・`features/` ディレクトリ構成には影響しない。

### Goals
- 案件関連ルートを `/projects` 配下に統合し、独立カテゴリとして整理する
- 標準工数パターンルートを `/projects/standard-efforts` 配下に移動し、案件管理のサブカテゴリとして位置づける
- 全パス参照の整合性を保ち、TypeScript エラーとテスト失敗を発生させない

### Non-Goals
- 旧パスへのリダイレクト設定
- バックエンド API パスの変更
- `features/` ディレクトリの名称変更やリファクタリング
- 画面の機能変更・UI 変更

## Architecture

### Existing Architecture Analysis

現在の案件関連ルート構成:

```
src/routes/master/
├── projects/
│   ├── index.tsx              → /master/projects
│   ├── new.tsx                → /master/projects/new
│   └── $projectId/
│       ├── index.tsx          → /master/projects/$projectId
│       └── edit.tsx           → /master/projects/$projectId/edit
├── standard-effort-masters/
│   ├── index.tsx              → /master/standard-effort-masters
│   ├── new.tsx                → /master/standard-effort-masters/new
│   └── $standardEffortId/
│       └── index.tsx          → /master/standard-effort-masters/$standardEffortId
├── business-units/            ← 変更なし
├── project-types/             ← 変更なし
├── work-types/                ← 変更なし
└── indirect-capacity-settings/ ← 変更なし
```

- `master` レイアウトルート（`master.tsx`）は存在しない。純粋なディレクトリベースルーティング
- `routes/projects/` ディレクトリは未存在
- `master/` 配下の他ルート（business-units 等）はそのまま残留

### Architecture Pattern & Boundary Map

**Architecture Integration**:
- Selected pattern: TanStack Router ファイルベースルーティングの既存パターンに準拠
- Domain boundaries: `features/` ディレクトリ（ドメインロジック）と `routes/` ディレクトリ（画面ルーティング）は独立。今回は `routes/` のみ変更
- Existing patterns preserved: `createFileRoute` によるルート定義、`@/features/` からのコンポーネントインポート
- Steering compliance: フロントエンド構成の `routes/` パターンに準拠

移動後のルート構成:

```
src/routes/
├── projects/
│   ├── index.tsx              → /projects
│   ├── new.tsx                → /projects/new
│   ├── $projectId/
│   │   ├── index.tsx          → /projects/$projectId
│   │   └── edit.tsx           → /projects/$projectId/edit
│   └── standard-efforts/
│       ├── index.tsx          → /projects/standard-efforts
│       ├── new.tsx            → /projects/standard-efforts/new
│       └── $standardEffortId/
│           └── index.tsx      → /projects/standard-efforts/$standardEffortId
├── master/
│   ├── business-units/        ← 変更なし
│   ├── project-types/         ← 変更なし
│   ├── work-types/            ← 変更なし
│   └── indirect-capacity-settings/ ← 変更なし
└── workload/                  ← 変更なし
```

### Technology Stack

| Layer | Choice / Version | Role in Feature | Notes |
|-------|------------------|-----------------|-------|
| Frontend | TanStack Router (既存) | ファイルベースルーティング | `routeTree.gen.ts` 自動再生成 |

## Requirements Traceability

| Requirement | Summary | Components | Interfaces | Flows |
|-------------|---------|------------|------------|-------|
| 1.1–1.4 | 案件ルート `/projects` 配下で4画面表示 | RouteFiles-Projects | createFileRoute | — |
| 1.5 | `createFileRoute` パス文字列を新パスに一致 | RouteFiles-Projects | createFileRoute | — |
| 2.1–2.3 | 標準工数パターンルート `/projects/standard-efforts` 配下で3画面表示 | RouteFiles-StandardEfforts | createFileRoute | — |
| 3.1–3.3 | SidebarNav のリンク先を新パスに更新 | SidebarNav | menuItems | — |
| 4.1 | 案件一覧の行リンクを `/projects/$projectId` に更新 | ProjectColumns | Link.to | — |
| 4.2 | 標準工数パターンの行リンクを `/projects/standard-efforts/$standardEffortId` に更新 | StandardEffortColumns | Link.to | — |
| 4.3 | 旧パス参照を残さない | 全対象ファイル | — | 検証ステップ |
| 5.1 | `routeTree.gen.ts` 自動再生成 | TanStack Router Plugin | — | `pnpm dev` |
| 5.2 | TypeScript エラーなし | 全対象ファイル | — | `tsc` |
| 5.3 | テストパス | 全対象ファイル | — | `pnpm test` |

## Components and Interfaces

| Component | Domain/Layer | Intent | Req Coverage | Key Dependencies | Contracts |
|-----------|--------------|--------|--------------|------------------|-----------|
| RouteFiles-Projects | Routes | 案件4画面のルート定義 | 1.1–1.5 | features/projects (P0) | — |
| RouteFiles-StandardEfforts | Routes | 標準工数パターン3画面のルート定義 | 2.1–2.3 | features/standard-effort-masters (P0) | — |
| SidebarNav | Layout | サイドバーナビゲーションのリンク先定義 | 3.1–3.3 | TanStack Router Link (P0) | — |
| ProjectColumns | Feature/UI | 案件一覧テーブルの行リンク | 4.1 | TanStack Router Link (P0) | — |
| StandardEffortColumns | Feature/UI | 標準工数一覧テーブルの行リンク | 4.2 | TanStack Router Link (P0) | — |

### Routes Layer

#### RouteFiles-Projects

| Field | Detail |
|-------|--------|
| Intent | 案件関連4画面のルートファイルを `/projects` 配下に配置し、パス文字列を更新する |
| Requirements | 1.1, 1.2, 1.3, 1.4, 1.5 |

**Responsibilities & Constraints**
- `routes/master/projects/` から `routes/projects/` へファイルを物理移動
- 各ファイル内の `createFileRoute` パス文字列を更新
- ファイル内のハードコードされたナビゲーションパス（`navigate({ to: ... })`、パンくずリスト `href` 等）を更新

**パス変更マッピング**

| ファイル（移動後） | 旧パス文字列 | 新パス文字列 |
|-------------------|-------------|-------------|
| `routes/projects/index.tsx` | `/master/projects/` | `/projects/` |
| `routes/projects/new.tsx` | `/master/projects/new` | `/projects/new` |
| `routes/projects/$projectId/index.tsx` | `/master/projects/$projectId/` | `/projects/$projectId/` |
| `routes/projects/$projectId/edit.tsx` | `/master/projects/$projectId/edit` | `/projects/$projectId/edit` |

**Implementation Notes**
- ファイル内の全パス参照で `/master/projects` → `/projects` に置換する
- `features/projects/` からのインポートパスは `@/features/projects/` であり変更不要

#### RouteFiles-StandardEfforts

| Field | Detail |
|-------|--------|
| Intent | 標準工数パターン3画面のルートファイルを `/projects/standard-efforts` 配下に配置し、パス文字列を更新する |
| Requirements | 2.1, 2.2, 2.3 |

**Responsibilities & Constraints**
- `routes/master/standard-effort-masters/` から `routes/projects/standard-efforts/` へファイルを物理移動
- ディレクトリ名を `standard-effort-masters` → `standard-efforts` に短縮
- 各ファイル内のパス文字列を更新

**パス変更マッピング**

| ファイル（移動後） | 旧パス文字列 | 新パス文字列 |
|-------------------|-------------|-------------|
| `routes/projects/standard-efforts/index.tsx` | `/master/standard-effort-masters/` | `/projects/standard-efforts/` |
| `routes/projects/standard-efforts/new.tsx` | `/master/standard-effort-masters/new` | `/projects/standard-efforts/new` |
| `routes/projects/standard-efforts/$standardEffortId/index.tsx` | `/master/standard-effort-masters/$standardEffortId/` | `/projects/standard-efforts/$standardEffortId/` |

**Implementation Notes**
- ファイル内の全パス参照で `/master/standard-effort-masters` → `/projects/standard-efforts` に置換する
- `features/standard-effort-masters/` からのインポートパスは変更不要

### Layout Layer

#### SidebarNav

| Field | Detail |
|-------|--------|
| Intent | サイドバーメニューの案件・標準工数パターンのリンク先を新パスに更新する |
| Requirements | 3.1, 3.2, 3.3 |

**変更箇所**

| 位置 | 旧値 | 新値 |
|------|------|------|
| `menuItems[1].children[0].href` | `/master/projects` | `/projects` |
| `menuItems[1].children[1].href` | `/master/standard-effort-masters` | `/projects/standard-efforts` |

**Implementation Notes**
- `isActive` の判定は `currentPath.startsWith(item.href)` を使用しており、パス変更後も正しく動作する
- `/projects` は `/projects/standard-efforts` の prefix でもあるため、案件メニューと標準工数パターンメニューの両方が同時にアクティブになる可能性がある。ただし、これは既存の `/master/projects` と `/master/standard-effort-masters` では発生しなかった問題。`/projects/standard-efforts` アクセス時に案件メニューもアクティブ表示される点は許容するか、要確認

### Feature/UI Layer

#### ProjectColumns

| Field | Detail |
|-------|--------|
| Intent | 案件一覧テーブルの名称カラムリンクを新パスに更新する |
| Requirements | 4.1 |

**変更箇所**: `to="/master/projects/$projectId"` → `to="/projects/$projectId"`

#### StandardEffortColumns

| Field | Detail |
|-------|--------|
| Intent | 標準工数パターン一覧テーブルのパターン名カラムリンクを新パスに更新する |
| Requirements | 4.2 |

**変更箇所**: `to="/master/standard-effort-masters/$standardEffortId"` → `to="/projects/standard-efforts/$standardEffortId"`

## Testing Strategy

### 検証ステップ（手動検証）
1. `pnpm dev` で `routeTree.gen.ts` が新ルート構成で再生成されることを確認
2. 旧パス文字列 `/master/projects` および `/master/standard-effort-masters` が `routeTree.gen.ts` 以外のソースコードに残存していないことを `grep` で検証（4.3）
3. TypeScript コンパイルエラーがないことを確認（5.2）
4. `pnpm --filter frontend test` で既存テストがパスすることを確認（5.3）

### 画面遷移確認（手動検証）
1. `/projects` → 案件一覧表示（1.1）
2. `/projects/new` → 新規作成画面表示（1.2）
3. `/projects/$projectId` → 詳細画面表示（1.3）
4. `/projects/$projectId/edit` → 編集画面表示（1.4）
5. `/projects/standard-efforts` → 標準工数パターン一覧表示（2.1）
6. `/projects/standard-efforts/new` → 新規作成画面表示（2.2）
7. `/projects/standard-efforts/$standardEffortId` → 詳細画面表示（2.3）
8. SidebarNav の案件メニュークリック → `/projects` に遷移（3.2）
9. SidebarNav の標準工数パターンメニュークリック → `/projects/standard-efforts` に遷移（3.3）

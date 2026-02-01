# ギャップ分析: improve-case-study-ui

## 1. 現状調査

### 既存アセット

| カテゴリ | ファイル | 役割 |
|---------|--------|------|
| ルート（統合先） | `routes/master/projects/$projectId/index.tsx` | 案件詳細画面（175行）。案件基本情報カード + 編集/削除ボタン + ケーススタディ別画面へのリンク |
| ルート（統合元） | `routes/master/projects/$projectId/case-study/index.tsx` | ケーススタディ画面（192行）。CaseSidebar + WorkloadCard + WorkloadChart を統合 |
| ルート（統合元） | `routes/master/projects/$projectId/case-study/new.tsx` | 新規ケース作成画面。CaseForm を表示（defaultValues なし） |
| ルート（統合元） | `routes/master/projects/$projectId/case-study/$caseId/edit.tsx` | ケース編集画面。CaseForm に既存データを defaultValues で渡す |
| コンポーネント | `features/case-study/components/CaseForm.tsx` | ケース作成・編集フォーム。`defaultValues?: Partial<CaseFormValues>` を受け取る |
| コンポーネント | `features/case-study/components/CaseSidebar.tsx` | ケース一覧サイドバー。選択・新規作成・編集・削除のコールバック |
| コンポーネント | `features/case-study/components/WorkloadCard.tsx` | 月別工数の編集テーブル |
| コンポーネント | `features/case-study/components/WorkloadChart.tsx` | 工数チャート表示 |
| UIプリミティブ | `components/ui/sheet.tsx` | Sheet（スライドパネル）コンポーネント（shadcn/ui） |

### 既存パターン・慣習

- **Sheet パターン**: プロジェクト内で確立済み。`ProjectEditSheet`（workload feature）や `CaseFormSheet`（indirect-case-study feature）で Sheet を使ったフォーム表示の実績あり
- **Sheet 構成**: `Sheet > SheetContent > SheetHeader(Title + Description) > フォーム` の定型パターン
- **CaseForm**: 既に `defaultValues` prop をサポート。`{ ...formDefaults, ...defaultValues }` でマージ済み
- **コールバックパターン**: CaseSidebar は `onNewCase`, `onEditCase`, `onDeleteCase` を受け取る設計
- **クエリ管理**: `projectCasesQueryOptions`, `projectCaseQueryOptions`, `projectLoadsQueryOptions` が整備済み
- **mutation**: `useCreateProjectCase`, `useUpdateProjectCase`, `useDeleteProjectCase` が整備済み

### 統合サーフェス

- **案件データ**: `projectQueryOptions(id)` で取得される `Project` 型に `startYearMonth`, `durationMonths`, `totalManhour` フィールドあり
- **ケースデータ**: `ProjectCase` 型に同名フィールドあり（nullable）
- **features 間の依存**: `case-study` feature の index.ts がパブリック API をエクスポート済み。案件詳細画面から直接利用可能

---

## 2. 要件実現可能性分析

### 要件 1: 案件詳細画面へのケーススタディセクション統合

**技術的に必要なもの:**
- 既存 case-study/index.tsx のロジック（状態管理 + クエリ + コールバック）を案件詳細画面に移植
- CaseSidebar, WorkloadCard, WorkloadChart コンポーネントの再利用（そのまま使える）

**ギャップ:**
- 案件詳細画面（現在175行）に統合後は大幅に行数が増加する → **コンポーネント分割が必要**
- レイアウト変更: 現在の case-study/index.tsx は `flex h-full` で全画面レイアウト → 案件詳細画面のセクションとしてレイアウト調整が必要

**制約:**
- features/case-study/components/ 配下のコンポーネントは変更不要（CaseSidebar の `onNewCase`, `onEditCase` のコールバック先を変えるだけ）

### 要件 2: 新規ケース作成時の初期値自動設定

**技術的に必要なもの:**
- `CaseForm` に `defaultValues` を渡す（既にサポート済み）
- 案件データから `startYearMonth`, `durationMonths`, `totalManhour` を取得して渡す

**ギャップ: なし**
- CaseForm は既に `defaultValues?: Partial<CaseFormValues>` を受け取る設計
- 案件データは `projectQueryOptions(id)` で取得済み
- 実装は呼び出し側で `defaultValues={{ startYearMonth: project.startYearMonth, ... }}` を渡すだけ

### 要件 3: 同一画面内でのケース作成・編集操作

**技術的に必要なもの:**
- Sheet コンポーネントで CaseForm をラップする新コンポーネント（`CaseFormSheet` 的なもの）
- 編集時のケースデータ取得ロジック

**ギャップ:**
- case-study feature に Sheet ラッパーコンポーネントが存在しない → **新規作成が必要**
- ただし indirect-case-study の `CaseFormSheet.tsx` と `ProjectEditSheet.tsx` に確立されたパターンあり

**参考実装:**
- `indirect-case-study/components/CaseFormSheet.tsx`: Sheet + TanStack Form のパターン
- `workload/components/ProjectEditSheet.tsx`: Sheet + データ取得 + フォームのパターン

### 要件 4: 独立ケーススタディルートの整理

**技術的に必要なもの:**
- `case-study/index.tsx`, `case-study/new.tsx`, `case-study/$caseId/edit.tsx` の削除
- `routeTree.gen.ts` の再生成（TanStack Router が自動生成）

**ギャップ: なし**
- ファイル削除 + `pnpm --filter frontend dev` で routeTree が自動再生成される

### 要件 5: 工数データの表示・編集の維持

**技術的に必要なもの:**
- WorkloadCard, WorkloadChart の再利用（変更不要）
- case-study/index.tsx にあるクエリ・状態管理ロジックの移植

**ギャップ: なし**
- コンポーネントのインターフェースは変更不要

---

## 3. 実装アプローチ

### Option A: 案件詳細画面を直接拡張

**概要:** `$projectId/index.tsx` にケーススタディのロジック・UIをすべて追加

**変更ファイル:**
| ファイル | 変更内容 |
|---------|---------|
| `routes/.../projectId/index.tsx` | ケーススタディセクション追加（+150行程度） |
| `routes/.../case-study/*` | 3ファイル削除 |

**トレードオフ:**
- ✅ 最小ファイル数。新規コンポーネントなし
- ✅ 実装が最も単純
- ❌ 案件詳細画面が 300行超に肥大化
- ❌ Sheet 表示ロジックも同一ファイルに含まれ、単一責任原則を逸脱
- ❌ ルートコンポーネントの100行前後ルール（CLAUDE.md）に違反

### Option B: ケーススタディセクションを専用コンポーネントに分離（推奨）

**概要:** ケーススタディの統合ロジックを `features/case-study/components/CaseStudySection.tsx` として抽出し、案件詳細画面からはそのコンポーネントを呼ぶだけにする。Sheet フォームは `CaseFormSheet.tsx` として別途作成。

**変更ファイル:**
| ファイル | 変更内容 |
|---------|---------|
| `routes/.../projectId/index.tsx` | CaseStudySection を import + 配置。ケーススタディボタン削除 |
| `features/case-study/components/CaseStudySection.tsx` | **新規作成**。case-study/index.tsx からロジックを移植 |
| `features/case-study/components/CaseFormSheet.tsx` | **新規作成**。Sheet + CaseForm のラッパー |
| `features/case-study/index.ts` | 新コンポーネントをエクスポートに追加 |
| `routes/.../case-study/*` | 3ファイル削除 |

**トレードオフ:**
- ✅ ルートコンポーネントが100行前後に収まる
- ✅ 責務が明確に分離（CaseStudySection = 統合ビュー、CaseFormSheet = フォーム Sheet）
- ✅ 既存の indirect-case-study の CaseFormSheet パターンと一貫性がある
- ✅ CaseStudySection は再利用可能（将来他の画面から利用する可能性）
- ❌ ファイル数が増加（+2ファイル）
- ❌ Option A より若干設計コストが高い

### Option C: ハイブリッド（段階的移行）

**概要:** まず Option A で素早く統合し、その後リファクタリングで Option B に移行

**トレードオフ:**
- ✅ 初期実装が速い
- ❌ 二段階の作業が必要
- ❌ 中間状態のコードが残るリスク
- ❌ 今回の規模では段階的にする利点が薄い

---

## 4. 工数・リスク評価

**工数: S（1〜3日）**
- 既存パターン（Sheet、CaseForm、CaseSidebar）をそのまま活用可能
- 新規バックエンド変更なし
- コンポーネントの移植が中心

**リスク: Low**
- 使用する技術・パターンはすべてプロジェクト内で実績あり
- 既存コンポーネントの interface 変更なし
- バックエンド API 変更なし

---

## 5. 設計フェーズへの推奨事項

### 推奨アプローチ: Option B（コンポーネント分離）

**理由:**
1. CLAUDE.md のルートコンポーネント100行前後ルールを遵守
2. `indirect-case-study` の CaseFormSheet パターンとの一貫性
3. features/case-study/components/ 配下に凝集され、feature-first 構成を維持
4. 案件詳細画面のルートファイルの肥大化を防止

### 設計フェーズで決定すべき事項

1. **CaseStudySection のレイアウト**: サイドバー + メインエリアの配置をどうするか（現在の flex レイアウトを維持するか、案件詳細画面に合わせるか）
2. **CaseFormSheet のサイズ**: `sm:max-w-lg`（ProjectEditSheet と同等）で十分か、CaseForm のフィールド数を考慮して調整するか
3. **案件詳細画面の編集ボタン**: ケーススタディボタン削除後のヘッダーレイアウト

### Research Needed: なし

すべての技術要素はプロジェクト内で実証済みのため、追加調査は不要。

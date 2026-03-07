# リファクタリング計画書

> 策定日: 2026-03-02
> 最終更新: 2026-03-04
> 対象: ops モノレポ全体 (apps/backend, apps/frontend)
> 手法: Martin Fowler「リファクタリング」カタログに基づく

---

## 進捗サマリー

| Phase | 総タスク数 | 完了 | 未着手 | 進捗率 |
|-------|----------|------|-------|--------|
| Phase 1: 共通ユーティリティ抽出 | 14 | **14** | 0 | **100%** |
| Phase 2: パターン抽象化 | 12 | **10** | 2 | **83%** |
| Phase 3: アーキテクチャリファクタリング | 15 | **1** | 14 | **7%** |
| Phase 4: 品質向上・統一化 | 7 | **0** | 7 | **0%** |
| Phase 5: 画面分割・ナビゲーション再構成 | 4 | **0** | 4 | **0%** |
| **合計** | **52** | **25** | **27** | **48%** |

---

## 1. 現状分析サマリー

### コードベース規模

| レイヤー | ファイル数 | 総行数 (本番コードのみ) |
|---------|----------|----------------------|
| Backend (routes/services/data/transform/types) | ~90 | ~12,200 |
| Frontend (features/routes/components/lib) | ~120 | ~16,400 |
| **合計** | **~210** | **~28,600** |

### 検出されたコードスメル総数

| 深刻度 | 件数 | 推定重複行数 |
|--------|------|-------------|
| CRITICAL | 8 | ~1,800 |
| HIGH | 14 | ~1,200 |
| MEDIUM | 12 | ~600 |
| LOW | 5 | ~200 |
| **合計** | **39** | **~3,800** |

重複・ボイラープレートが全体の **約13%** を占める。

---

## 2. コードスメル詳細分析

### 2.1 Backend: Routes レイヤー

#### [B-R3] ルート集約の肥大化 (MEDIUM) — 未着手
- **スメル**: Long Method / Open-Closed Principle 違反
- **影響範囲**: `index.ts` 1ファイル (23ルートを直接マウント)
- **内容**: ドメイン境界なくフラットに全ルートをマウント。新ルート追加のたびに必ず修正が必要
- **現状**: ルートは半階層的にマウントされているが、ドメイン別グルーピング (master/chart/workload) は未実施

---

### 2.2 Backend: Services レイヤー

#### [B-S1] CRUD サービスパターンの大量重複 (CRITICAL) — 未着手
- **スメル**: Duplicated Code / Parallel Class Hierarchies
- **影響範囲**: 20+ サービスファイル (~85-90% のコード構造が同一)
- **内容**: `findAll`, `findById`, `create`, `update`, `delete`, `restore` の6メソッドが全マスター系サービスで同一構造。差異は型名とデータ層呼び出し先のみ

#### [B-S2] Middle Man / Pass-Through 層 (HIGH) — 未着手
- **スメル**: Middle Man / Feature Envy
- **影響範囲**: 15+ サービスファイル
- **内容**: サービス層がビジネスロジックをほとんど持たず、Data 層への委譲 + Transform 呼び出しだけの薄いラッパーとして機能

#### [B-S3] 親リソース存在チェックの重複 (HIGH) — 一部残存
- **スメル**: Duplicated Code
- **影響範囲**: `monthlyCapacityService.ts`, `indirectWorkTypeRatioService.ts`, `monthlyHeadcountPlanService.ts`, `projectLoadService.ts`
- **内容**: 各データファイルで `*Exists()` メソッドが個別実装されており、共通ヘルパーは未作成

#### [B-S5] ソフトデリート認識ロジックの重複 (HIGH) — 未着手
- **スメル**: Duplicated Code
- **影響範囲**: 15+ データファイルで同一の soft-delete/restore SQL パターン
- **内容**: `UPDATE SET deleted_at = GETDATE()` / `deleted_at = NULL` が全ファイルで重複

---

### 2.3 Backend: Data レイヤー

#### [B-D1] SQL クエリパターンの大量重複 (CRITICAL) — 未着手
- **スメル**: Duplicated Code
- **影響範囲**: 22 データファイル (~1,770行)
- **内容**:
  - **ソフトデリート SQL**: 7ファイルで同一 UPDATE 文
  - **リストア SQL**: 4ファイルで同一 UPDATE 文
  - **ページネーション計算**: 8ファイルで `offset = (page - 1) * pageSize` + 二重クエリパターン
  - **参照チェック**: 3ファイルで `CASE WHEN EXISTS(...)` パターン
  - **作成パターン**: `INSERT + OUTPUT + findById 再取得` が全データファイルで同一構造

---

### 2.4 Backend: Transform レイヤー

#### [B-T1] 機械的フィールドマッピングのみ (HIGH) — 未着手
- **スメル**: Unnecessary Indirection / Inline Class
- **影響範囲**: 21 transform ファイル (~170行)
- **内容**: Transform 層の99%が `snake_case → camelCase` のフィールド名変換のみ。ビジネスロジックなし。汎用マッパーで代替可能

---

### 2.5 Frontend: Features API レイヤー

#### [F-A5] トースト通知の不統一 (MEDIUM) — 未着手
- **スメル**: Inconsistent Code
- **影響範囲**: mutations.ts 全般
- **内容**: マスター系 CRUD Mutation (factory経由) はトーストなし、workload/case-study 系は一部のみトーストあり。特にバルク操作でトーストが欠落

---

### 2.6 Frontend: Features Types レイヤー

#### [F-T3] Search スキーマの不統一 (MEDIUM) — 未着手
- **スメル**: Inconsistent Code
- **影響範囲**: `workTypeSearchSchema` (ページネーションなし) vs `businessUnitSearchSchema` (ページネーションあり)
- **内容**: work-types / project-types はページネーションなし、projects / business-units はページネーションあり。統一されたパターンがない

---

### 2.7 Frontend: Components レイヤー

#### [F-C8] 巨大コンポーネント (200行超) (MEDIUM) — 一部実施済み
- **スメル**: Large Class / Long Method
- **現状**:
  - `ProjectForm.tsx` — **300行** (420行から削減済み) ✅
  - `WorkloadDataTable.tsx` (416行) — **未着手**
  - `SidePanelSettings.tsx` (368行) — **未着手**
  - `CaseForm.tsx` (356行) — **未着手**
  - `CalculationResultTable.tsx` (320行) — **未着手**

---

### 2.8 Frontend: Routes レイヤー

#### [F-RO1] マスター CRUD ルートの大量重複 (CRITICAL) — 未着手
- **スメル**: Duplicated Code / Clone Classes
- **影響範囲**: 4 master × 4ルート (index/new/edit/detail) = 16ファイル
- **内容**:
  - **一覧ページ**: 検索ハンドラ、ページネーションハンドラ、復元ダイアログロジックが4ファイルで同一
  - **新規作成ページ**: `handleSubmit` のエラーハンドリングが4ファイルで同一
  - **編集ページ**: ローディング/エラー状態表示 + 更新ハンドラが4ファイルで同一
  - **詳細ページ**: 削除/復元エラーハンドリング + ローディング/NotFound 表示が4ファイルで同一
- **備考**: Mutation フックファクトリ (F-A3) により Mutation 層の重複は解消済み。ルートコンポーネント自体の共通化が残課題

#### [F-RO4] ルートパスのハードコード (MEDIUM) — 未着手
- **スメル**: Magic String
- **影響範囲**: columns.tsx × 4 features + hooks 内 (6+ 箇所)
- **内容**: `"/master/work-types/$workTypeCode"` 等のパス文字列がリテラルとして散在

---

## 3. ファウラーのリファクタリングメソッド対応表

> 実施済み項目は [Appendix A](#appendix-a-実施済みバックログ) に移動

| ID | コードスメル | 適用するリファクタリング手法 | 難易度 | 削減行数 | 状態 |
|----|------------|--------------------------|--------|---------|------|
| B-S1 | CRUD サービスパターン重複 | **Extract Superclass** → ジェネリック Base Service | 高 | ~800 | 未着手 |
| B-S2 | Middle Man | **Inline Class** (検討) / **Move Method** | 中 | - | 未着手 |
| B-S3 | 親リソース存在チェック重複 | **Extract Method** → バリデーションユーティリティ | 低 | ~100 | 一部残存 |
| B-S5 | ソフトデリートロジック重複 | **Extract Method** → 共通ヘルパー | 低 | ~60 | 未着手 |
| B-D1 | SQL パターン重複 | **Extract Superclass** → Base Data クラス / クエリビルダー | 高 | ~600 | 未着手 |
| B-T1 | 機械的 Transform | **Inline Class** → 汎用マッパーに置換 | 中 | ~170 | 未着手 |
| F-C8 | 巨大コンポーネント | **Extract Class** → サブコンポーネント分割 | 中 | - | 一部実施 |
| F-RO1 | マスター CRUD ルート重複 | **Extract Method** → カスタムフック群 | 高 | ~600 | 未着手 |

---

## 4. リファクタリング実行計画

### Phase 1: 共通ユーティリティ抽出 — ✅ 完了

> Phase 1 の全タスクは実施済み。詳細は [Appendix A](#appendix-a-実施済みバックログ) を参照。

---

### Phase 2: パターン抽象化 — 🔶 83% 完了

**目標**: 繰り返される構造パターンをファクトリ/ジェネレータに置き換え。

#### 2-1〜2-4: Frontend パターン抽象化 — ✅ 完了
> 実施済み。詳細は [Appendix A](#appendix-a-実施済みバックログ) を参照。

#### 2-5. Backend: Transform 層の簡素化 — ❌ 未着手
- [ ] `utils/fieldMapper.ts` 作成: `snake_case → camelCase` 汎用変換 + ISO 日付フォーマット [B-T1]
- [ ] 既存 Transform ファイルを汎用マッパー + 差分カスタマイズの構成に移行
- [ ] ビジネスロジックを含む Transform (`chartViewTransform.ts`, `standardEffortMasterTransform.ts`) は個別に残す

**Phase 2 残作業の推定削減行数**: ~170行
**リスク**: 中 (Transform のインターフェース変更がサービス層に波及)

---

### Phase 3: アーキテクチャリファクタリング (高リスク・最大効果) — 🔴 7% 完了

**目標**: レイヤー構造自体のボイラープレートを解消。

#### 3-1. Backend: Base CRUD Service — ❌ 未着手
- [ ] `services/base/BaseCrudService.ts` 作成 [B-S1]:
  ```typescript
  abstract class BaseCrudService<TRow, TResponse, TCreate, TUpdate> {
    abstract dataAccess: BaseCrudData<TRow>;
    abstract transform(row: TRow): TResponse;

    async findAll(params): PaginatedResult<TResponse> { ... }
    async findById(id): TResponse { ... }
    async create(data: TCreate): TResponse { ... }
    async update(id, data: TUpdate): TResponse { ... }
    async softDelete(id): void { ... }
    async restore(id): TResponse { ... }
  }
  ```
- [ ] `services/base/BaseNestedService.ts` 作成: ネストリソース用基底 [B-S3]
- [ ] `utils/validationHelpers.ts` 作成: 親存在チェック、複合キー重複チェック [B-S3, B-S4]
- [ ] 既存の単純 CRUD サービスを基底クラス継承に移行

#### 3-2. Backend: Base CRUD Data — ❌ 未着手
- [ ] `data/base/BaseCrudData.ts` 作成 [B-D1]:
  - 共通の `findAll` (ページネーション付き)
  - 共通の `softDelete` / `restore`
  - 共通の `hasReferences`
  - テーブル名・カラム定義をメタデータとして受け取る
- [ ] 単純な CRUD データクラスを基底クラス継承に移行

#### 3-3. Backend: ルートのドメイン別グルーピング — ❌ 未着手
- [ ] `routes/master/index.ts` 作成: マスターデータ系ルートを集約 [B-R3]
- [ ] `routes/chart/index.ts` 作成: チャート関連ルートを集約
- [ ] `routes/workload/index.ts` 作成: 工数関連ルートを集約
- [ ] `index.ts` のルートマウントをドメイン単位に簡素化

#### 3-4. Frontend: マスター CRUD ルートの統合 — ❌ 未着手
- [ ] `hooks/useMasterListPage.ts` 作成 [F-RO1]:
  ```typescript
  export function useMasterListPage<T>(config: {
    queryOptions: (params) => QueryOptions;
    searchSchema: ZodSchema;
    basePath: string;
    entityName: string;
  }) { ... }
  ```
- [ ] `hooks/useMasterDetailPage.ts` 作成: 詳細/削除/復元ロジック共通化
- [ ] `hooks/useMasterFormPage.ts` 作成: 新規作成/編集のエラーハンドリング共通化
- [ ] 16のマスタールートファイルを共通フック呼び出し + JSX レイアウトのみに簡素化

#### 3-5. Frontend: 巨大コンポーネントの分割 — 🔶 一部実施
- [x] `ProjectForm.tsx` (420行 → 300行) ✅ 削減済み
- [ ] `SidePanelSettings.tsx` (368行) → `PeriodSettings` + `ProjectColorSettings` + `ProfileSettings` に分割
- [ ] `WorkloadDataTable.tsx` (416行) → カラム定義、展開ロジック、フィルタリングを分離
- [ ] `CaseForm.tsx` (356行) → 計算モード別コンポーネントに分割

**推定削減行数**: ~1,600行
**リスク**: 高 (アーキテクチャ変更。段階的移行が必須)
**所要規模**: 大

---

### Phase 4: 品質向上・統一化 (低リスク・整理) — 🔴 未着手

**目標**: 一貫性の確保と残余の整理。

#### 4-1. トースト通知の統一 — ❌ 未着手
- [ ] `lib/toast-utils.ts` を拡充: CRUD 操作用の標準メッセージテンプレート [F-A5]
- [ ] 全 Mutation のトースト処理を統一パターンに

#### 4-2. ページネーション戦略の統一 — ❌ 未着手
- [ ] マスター一覧のページネーション有無を統一 [F-T3]
- [ ] `lib/api/constants.ts` にデフォルトページサイズを定義

#### 4-3. Backend 型ファイルの整理 — ❌ 未着手
- [ ] `chartColorPalette.ts` と `chartColorSetting.ts` を `chartSettings.ts` に統合
- [ ] `pagination.ts` を `types/common.ts` に統合

#### 4-4. Row 型の命名統一 — ❌ 未着手
- [ ] JOIN 付き Row 型を `*DetailRow` / `*QueryRow` に改名して意図を明確化

#### 4-5. ルートパスのハードコード解消 — ❌ 未着手
- [ ] TanStack Router の型安全ルートパスを活用し、マジックストリングを排除 [F-RO4]

**推定削減行数**: ~200行
**リスク**: 低
**所要規模**: 小

---

## 5. 実行順序と依存関係

```
Phase 1 (共通ユーティリティ) ✅ 完了
  ├── 1-1 Backend ユーティリティ ✅
  ├── 1-2 Backend Zod スキーマ ✅
  ├── 1-3 Frontend ユーティリティ ✅
  └── 1-4 Frontend 共有コンポーネント ✅
        │
Phase 2 (パターン抽象化) 🔶 83% 完了
  ├── 2-1 CRUD API インフラ ✅
  ├── 2-2 カラムファクトリ ✅
  ├── 2-3 フォームインフラ ✅
  ├── 2-4 共通型定義 ✅
  └── 2-5 Transform 簡素化 ❌ 未着手
        │
Phase 3 (アーキテクチャ) 🔴 7% 完了
  ├── 3-1 Base CRUD Service ❌ (Phase 2-5 依存)
  ├── 3-2 Base CRUD Data ❌
  ├── 3-3 ルートグルーピング ❌
  ├── 3-4 マスター CRUD ルート統合 ❌
  └── 3-5 巨大コンポーネント分割 🔶 (ProjectForm のみ完了)
        │
Phase 4 (品質向上) 🔴 未着手
  ├── 4-1 トースト統一 ❌
  ├── 4-2 ページネーション統一 ❌
  ├── 4-3 型ファイル整理 ❌
  ├── 4-4 Row 型命名統一 ❌
  └── 4-5 ルートパスハードコード解消 ❌

Phase 5 (画面分割・ナビゲーション再構成) 🔴 未着手
  ├── 5-1 (#47) ルーティング再構成 ❌ ← 直接実行
  ├── 5-2 (#48) マスタ管理画面 ❌ ← 直接実行 (5-1 と並行可)
  ├── 5-3 (#49) シミュレーション画面 ❌ ← Spec推奨 (5-1 と並行可)
  └── 5-4 (#50) 廃止・最終更新 ❌ ← 直接実行 (5-1〜5-3 完了後)
```

---

## Phase 5: 画面分割・ナビゲーション再構成 — 🔴 未着手

**目標**: `indirect-capacity-settings` の巨大画面を適切な機能単位に分割し、ナビゲーション構造を再構成する。

### 背景

現在の `/master/indirect-capacity-settings` 画面にマスタCRUD・データ入力・計算シミュレーション・結果管理が1画面に集約されており、ユーザビリティが低い。これを「案件管理」「間接作業管理」「マスタ管理」の3カテゴリに分割する。

### ナビゲーション最終構成

```
ダッシュボード
  └ 山積ダッシュボード              /workload

案件管理
  ├ 案件一覧                       /projects
  └ 標準工数パターン                /projects/standard-efforts

間接作業管理
  └ シミュレーション                /indirect/simulation

マスタ管理
  ├ 人員計画ケース                  /master/headcount-plans
  ├ キャパシティシナリオ             /master/capacity-scenarios
  ├ 間接作業ケース                  /master/indirect-work-cases
  ├ 案件タイプ                      /master/project-types
  ├ 作業種類                        /master/work-types
  └ ビジネスユニット                /master/business-units
```

### Issue 一覧

| # | Issue | 概要 | 開発単位 | Spec |
|---|-------|------|---------|------|
| [#47](../../issues/47) | ルーティング再構成 — 案件管理パスを `/projects` に移動 | `/master/projects` → `/projects`、`/master/standard-effort-masters` → `/projects/standard-efforts` へルートファイルを移動。SidebarNav のリンク更新。 | 1 PR | 直接実行（ファイル移動 + パス書き換えのみ） |
| [#48](../../issues/48) | マスタ管理画面の新規作成（人員計画・キャパシティシナリオ・間接作業ケース） | 既存コンポーネント（HeadcountPlanCaseList, MonthlyHeadcountGrid, CapacityScenarioList, IndirectWorkCaseList, IndirectWorkRatioMatrix）を3つの独立ルートページに配置。 | 1 PR（3画面とも同一パターン） | 直接実行（既存コンポーネントの再配置） |
| [#49](../../issues/49) | 間接作業シミュレーション画面の新規作成 | `/indirect/simulation` に計算ワークフロー（ケース選択→計算→結果表示→保存/エクスポート/インポート）を統合。`useIndirectCaseStudyPage` からシミュレーション専用フックを分離。 | 1 PR | Spec 推奨: `screen-split-simulation`（フック分離の設計判断あり） |
| [#50](../../issues/50) | 旧 indirect-capacity-settings 廃止・サイドメニュー最終更新 | 旧ルート削除、SidebarNav 最終構成化、未参照コード整理。 | 1 PR | 直接実行（#47〜#49 完了後のクリーンアップ） |

### 依存関係と実行順序

```
#47 ルーティング再構成 ─────────────────────────────┐
                                                    │
#48 マスタ管理画面 ──┐                               ├─→ #50 廃止・最終更新
                     ├─ (#48 と #49 は並行可能)      │
#49 シミュレーション画面 ─────────────────────────────┘
```

- **#47** は他と独立して先行実施可能
- **#48** と **#49** は並行実施可能（互いに依存しない）
- **#50** は #47〜#49 がすべて完了した後に実施

### リスク
- **低〜中**: 既存コンポーネントの再利用が主体。新規ロジックは #49 のフック分離のみ。
- **ルートツリー再生成**: TanStack Router の File-based routing により、ファイル移動後に `routeTree.gen.ts` が自動更新される。移動中の一時的なビルドエラーに注意。

---

## 6. リスク管理

### 各 Phase のリスクと対策

| Phase | リスク | 対策 |
|-------|-------|------|
| Phase 1 | 低: 純粋な関数抽出のため振る舞い変化なし | 既存テストが全パスすることを確認 |
| Phase 2 | 中: ファクトリのインターフェース設計ミス | 最初の1 feature で PoC を実施し、残りに展開 |
| Phase 3 | 高: 基底クラスの設計が全エンティティに影響 | feature flag やブランチ戦略で段階的に移行。旧実装との並行稼働期間を設ける |
| Phase 4 | 低: 表面的な変更のみ | — |
| Phase 5 | 低〜中: 既存コンポーネントの再配置が主体。#49 のフック分離が最大のリスク | 段階的に画面を追加し、最後に旧画面を削除。並行稼働期間を設ける |

### 全体方針
- **各タスクは1機能(1 feature / 1エンティティ)単位でPRを作成**し、段階的にマージ
- **テストカバレッジを維持**: リファクタリング前後で既存テストが全パスすること
- **振る舞いの変更を伴わない**: 外部 API レスポンスや UI の見た目は一切変更しない
- **Strangler Fig パターン**: Phase 3 では旧実装を一度に削除せず、新基底クラスへの移行を1エンティティずつ進める

---

## 7. 期待される効果

### 定量的効果

| 指標 | Before | After (推定) | 改善率 |
|------|--------|-------------|--------|
| 総行数 (本番コード) | ~28,600 | ~24,000 | -16% |
| 重複コード行 | ~3,800 | ~400 | -89% |
| 新エンティティ追加時の必要行数 | ~600 | ~100 | -83% |
| 変更波及ファイル数 (共通パターン修正時) | 14-20 | 1-2 | -90% |

### 定性的効果
- **保守性向上**: 共通パターンの修正が1箇所で完結
- **一貫性確保**: バリデーション、エラーメッセージ、レスポンス形式の統一
- **オンボーディング改善**: 新規開発者が理解すべきパターンが明確に
- **拡張性向上**: 新機能追加時のボイラープレートが大幅削減

---

## Appendix A: 実施済みバックログ

> 以下は実施完了済みのリファクタリング項目。コードベース調査日: 2026-03-04

### Phase 1: 共通ユーティリティ抽出 (全完了)

#### 1-1. Backend 共通ユーティリティ ✅
| タスク | 対応スメル | 実装先 |
|--------|----------|--------|
| `parseIntParam` を統一シグネチャで一元化 | B-R1 | `utils/parseParams.ts` |
| `buildPaginatedResponse()` ヘルパー作成 | B-R2 | `utils/responseHelper.ts` |
| `setLocationHeader()` ヘルパー作成 | B-R4 | `utils/responseHelper.ts` |
| 14ルートファイルからローカル関数を削除し共通 import に切替 | B-R1 | 各 routes/*.ts |

#### 1-2. Backend 共通 Zod スキーマ ✅
| タスク | 対応スメル | 実装先 |
|--------|----------|--------|
| `yearMonthSchema` を一元化 | B-TY1 | `types/common.ts` |
| `businessUnitCodeSchema` を一元化 | B-TY1 | `types/common.ts` |
| `colorCodeSchema` を一元化 | B-TY1 | `types/common.ts` |
| `includeDisabledFilterSchema` を一元化 | B-TY1 | `types/common.ts` |
| 各型ファイルを共通スキーマの import に切替 | B-TY1 | 各 types/*.ts |

#### 1-3. Frontend 共通ユーティリティ ✅
| タスク | 対応スメル | 実装先 |
|--------|----------|--------|
| `formatDateTime()` 共通関数作成 | F-C1 | `lib/format-utils.ts` |
| `displayOrderValidators` 共通バリデータ作成 | F-C4 | `lib/validators.ts` |
| `STALE_TIMES` 定数オブジェクト作成 | F-A4 | `lib/api/constants.ts` |
| 4つの columns.tsx からローカル formatDateTime 削除 | F-C1 | 各 columns.tsx |

#### 1-4. Frontend 共有コンポーネント抽出 ✅
| タスク | 対応スメル | 実装先 |
|--------|----------|--------|
| `DetailRow.tsx` 共有コンポーネント作成 | F-RO2 | `components/shared/DetailRow.tsx` |
| `NotFoundState.tsx` 共有コンポーネント作成 | F-RO3 | `components/shared/NotFoundState.tsx` |
| 4つの detail ルートから重複ローカルコンポーネント削除 | F-RO2/3 | 各 detail routes |

---

### Phase 2: パターン抽象化 (2-1〜2-4 完了)

#### 2-1. Frontend: CRUD API インフラ ✅
| タスク | 対応スメル | 実装先 |
|--------|----------|--------|
| `createCrudClient<T>()` ファクトリ作成 | F-A1 | `lib/api/crud-client-factory.ts` |
| `createQueryKeys()` ジェネレータ作成 | F-A2 | `lib/api/query-key-factory.ts` |
| `createCrudMutations()` ジェネレータ作成 | F-A3 | `lib/api/mutation-hooks-factory.ts` |
| 各 feature の api-client/queries/mutations をファクトリ呼出に置換 | F-A1/2/3 | 各 features/*/api/ |

#### 2-2. Frontend: カラムファクトリ ✅
| タスク | 対応スメル | 実装先 |
|--------|----------|--------|
| `createStatusColumn()` 作成 | F-C2 | `components/shared/column-helpers.ts` |
| `createRestoreActionColumn()` 作成 | F-C3 | `components/shared/column-helpers.ts` |
| `createDateTimeColumn()` 作成 | F-C2 | `components/shared/column-helpers.ts` |
| `createSortableColumn()` 作成 | F-C2 | `components/shared/column-helpers.ts` |
| 4つの columns.tsx をファクトリ呼出に簡素化 | F-C2/3 | 各 columns.tsx |

#### 2-3. Frontend: フォームインフラ ✅
| タスク | 対応スメル | 実装先 |
|--------|----------|--------|
| `FormTextField.tsx` ラッパー作成 | F-C5 | `components/shared/FormTextField.tsx` |
| `QuerySelect.tsx` 3状態 Select 作成 | F-C6 | `components/shared/QuerySelect.tsx` |
| 各 Form コンポーネントを共通ラッパーで簡素化 | F-C5/6 | 各 *Form.tsx |

#### 2-4. Frontend: 共通型定義 ✅
| タスク | 対応スメル | 実装先 |
|--------|----------|--------|
| `SoftDeletableEntity` / `MasterEntity` 基底型作成 | F-T1 | `lib/types/base-entity.ts` |
| 共通 Zod スキーマヘルパー作成 | F-T2 | `lib/schemas/master-entity-schema.ts` |
| 各 feature の型を基底型の拡張に変更 | F-T1/2 | 各 features/*/types/ |

---

### 個別解消済みスメル

| ID | 内容 | 状態 | 備考 |
|----|------|------|------|
| B-S4 | バルク Upsert バリデーション重複 | ✅ 解消 | 重複パターンが検出されなくなった |
| B-D2 | WHERE 句の文字列組み立て | ✅ 解消 | パラメータ化クエリに移行済み |
| B-TY2 | chartData.ts の肥大化 | ✅ 軽減 | 162行 → 153行に削減 |
| F-C7 | ケース管理リスト状態管理重複 | ✅ 解消 | props ベースの状態管理に整理済み |
| F-C8 (部分) | ProjectForm.tsx 巨大化 | ✅ 軽減 | 420行 → 300行に削減 |

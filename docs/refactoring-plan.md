# リファクタリング計画書

> 策定日: 2026-03-02
> 最終更新: 2026-03-13
> 対象: ops モノレポ全体 (apps/backend, apps/frontend)
> 手法: Martin Fowler「リファクタリング」カタログ + t_wada テスト駆動開発原則に基づく

---

## 進捗サマリー

| Phase | 総タスク数 | 完了 | 未着手 | 進捗率 |
|-------|----------|------|-------|--------|
| Phase 1: 共通ユーティリティ抽出 | 14 | **14** | 0 | **100%** |
| Phase 2: パターン抽象化 | 12 | **11** | 1 | **92%** |
| Phase 3: アーキテクチャリファクタリング | 15 | **1** | 14 | **7%** |
| Phase 4: 品質向上・統一化 | 7 | **0** | 7 | **0%** |
| Phase 5: 画面分割・ナビゲーション再構成 | 4 | **4** | 0 | **100%** |
| Phase 6: デッドコード削除・簡素化 | 5 | **0** | 5 | **0%** |
| **合計** | **57** | **30** | **27** | **53%** |

---

## 1. 現状分析サマリー

> 最終調査日: 2026-03-13

### コードベース規模

| レイヤー | ファイル数 | 総行数 (本番コードのみ) |
|---------|----------|----------------------|
| Backend (routes/services/data/transform/types) | ~90 | ~12,200 |
| Frontend (features/routes/components/lib) | ~120 | ~16,400 |
| **合計** | **~210** | **~28,600** |

### 検出されたコードスメル総数

| 深刻度 | 件数 | 解消済み | 残存 | 推定残存重複行数 |
|--------|------|---------|------|----------------|
| CRITICAL | 8 | 4 | 4 | ~1,400 |
| HIGH | 14 | 8 | 6 | ~900 |
| MEDIUM | 12 | 5 | 7 | ~400 |
| LOW | 5 | 4 | 1 | ~50 |
| **合計** | **39** | **21** | **18** | **~2,750** |

Phase 1〜2 と Phase 5 の完了により、当初の重複 ~3,800行から **~1,050行を解消** (28%削減)。

---

## 2. コードスメル詳細分析

### 2.1 Backend: Routes レイヤー

#### [B-R3] ルート集約の肥大化 (MEDIUM) — 未着手
- **スメル**: Long Method / Open-Closed Principle 違反
- **影響範囲**: `index.ts` 1ファイル (28ルートを直接マウント)
- **内容**: ドメイン境界なくフラットに全ルートをマウント。新ルート追加のたびに必ず修正が必要
- **現状**: ルートは半階層的にマウントされているが、ドメイン別グルーピング (master/chart/workload) は未実施

---

### 2.2 Backend: Services レイヤー

#### [B-S1] CRUD サービスパターンの大量重複 (CRITICAL) — 未着手
- **スメル**: Duplicated Code / Parallel Class Hierarchies
- **影響範囲**: 23 サービスファイル (~85-90% のコード構造が同一)
- **内容**: `findAll`, `findById`, `create`, `update`, `delete`, `restore` の6メソッドが全マスター系サービスで同一構造。差異は型名とデータ層呼び出し先のみ
- **補足**: サービスは全てオブジェクトリテラル形式。クラス継承は未使用

#### [B-S2] Middle Man / Pass-Through 層 (HIGH) — 未着手
- **スメル**: Middle Man / Feature Envy
- **影響範囲**: 15+ サービスファイル
- **内容**: サービス層がビジネスロジックをほとんど持たず、Data 層への委譲 + Transform 呼び出しだけの薄いラッパーとして機能
- **例外**: `chartDataService` (集約ロジック), `importExportService` (トランザクション制御), `monthlyCapacityService` 等 (bulkUpsert バリデーション) はビジネスロジックを持つ

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
- **影響範囲**: 23 データファイル (~5,600行、うち ~1,770行が重複パターン)
- **内容**:
  - **ソフトデリート SQL**: 7ファイルで同一 UPDATE 文
  - **リストア SQL**: 4ファイルで同一 UPDATE 文
  - **ページネーション計算**: 8ファイルで `OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY` + 二重クエリパターン
  - **参照チェック**: 3ファイルで `CASE WHEN EXISTS(...)` パターン
  - **作成パターン**: `INSERT + OUTPUT + findById 再取得` が全データファイルで同一構造

---

### 2.4 Backend: Transform レイヤー

#### [B-T1] 機械的フィールドマッピングのみ (HIGH) — ✅ ほぼ解消
- **スメル**: Unnecessary Indirection / Inline Class
- **当初の影響範囲**: 21 transform ファイル (~170行)
- **現状**: `createFieldMapper` ユーティリティを作成済み。**21/22 ファイルが移行完了**
- **残存**: `standardEffortMasterTransform.ts` (40行) のみ手動マッピング。`createFieldMapper` に移行可能

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
- **現状** (2026-03-13 再計測):
  - `ProjectForm.tsx` — **302行** (420行から削減済み) ✅
  - `CapacityScenarioDetailSheet.tsx` (427行) — **未着手** ← 新規検出
  - `WorkloadDataTable.tsx` (416行) — **未着手**
  - `SidePanelSettings.tsx` (359行) — **未着手**
  - `CaseForm.tsx` (359行) — **未着手**
  - `CalculationResultTable.tsx` (320行) — **未着手**
  - `ResultPanel.tsx` (313行) — **未着手** ← 新規検出
  - `WorkTypeDetailSheet.tsx` (303行) — **未着手** ← 新規検出
  - `BusinessUnitDetailSheet.tsx` (291行) — **未着手** ← 新規検出
  - `ProjectTypeDetailSheet.tsx` (287行) — **未着手** ← 新規検出
- **備考**: DetailSheet 3ファイル (work-types/business-units/project-types) は同一パターン。ジェネリック `MasterDetailSheet<T>` への統合候補

---

### 2.8 Frontend: Routes レイヤー

#### [F-RO1] マスター CRUD ルートの大量重複 (CRITICAL) — 未着手
- **スメル**: Duplicated Code / Clone Classes
- **影響範囲**: 3 master list routes (business-units/work-types/project-types) = ~350行の重複
- **内容**:
  - **一覧ページ**: 検索ハンドラ、ページネーションハンドラ、復元ダイアログロジック、`useMasterSheet` 利用が3ファイルで同一
  - 差異はエンティティ名、コードフィールド名、ヘッダーラベルのみ
- **備考**: Mutation フックファクトリ (F-A3) + `useMasterSheet` により Mutation/Sheet 層の重複は解消済み。ルートコンポーネント自体の共通化が残課題

#### [F-RO4] ルートパスのハードコード (MEDIUM) — 未着手
- **スメル**: Magic String
- **影響範囲**: columns.tsx × 4 features + hooks 内 (6+ 箇所)
- **内容**: `"/master/work-types/$workTypeCode"` 等のパス文字列がリテラルとして散在

---

## 3. ファウラーのリファクタリングメソッド対応表

> 実施済み項目は [Appendix A](#appendix-a-実施済みバックログ) に移動

| ID | コードスメル | 適用するリファクタリング手法 | 難易度 | 削減行数 | 状態 | 優先度 |
|----|------------|--------------------------|--------|---------|------|--------|
| B-T1 | 機械的 Transform | **Inline Class** → 汎用マッパーに置換 | 低 | ~40 | ほぼ解消 (残1) | 🟢 即時 |
| B-S1 | CRUD サービスパターン重複 | **Extract Superclass** → ジェネリック Base Service | 高 | ~800 | 未着手 | 🟡 次期 |
| B-S2 | Middle Man | **Inline Class** (検討) / **Move Method** | 中 | - | 未着手 | 🔵 検討中 |
| B-S3 | 親リソース存在チェック重複 | **Extract Method** → バリデーションユーティリティ | 低 | ~100 | 一部残存 | 🟡 次期 |
| B-S5 | ソフトデリートロジック重複 | **Extract Method** → 共通ヘルパー | 低 | ~60 | 未着手 | 🟡 次期 |
| B-D1 | SQL パターン重複 | **Extract Superclass** → Base Data クラス / クエリビルダー | 高 | ~600 | 未着手 | 🟡 次期 |
| F-C8 | 巨大コンポーネント | **Extract Class** → サブコンポーネント分割 | 中 | - | 一部実施 | 🟡 次期 |
| F-RO1 | マスター CRUD ルート重複 | **Extract Method** → カスタムフック群 | 中 | ~350 | 未着手 | 🟢 即時 |

### 優先度の判断基準

- 🟢 **即時**: 低リスク・高効果。テストで保護された安全なリファクタリング
- 🟡 **次期**: 中〜高リスク。設計判断を要するが効果が大きい
- 🔵 **検討中**: 費用対効果の再評価が必要。現状で大きな問題を引き起こしていない

---

## 4. リファクタリング実行計画

### Phase 1: 共通ユーティリティ抽出 — ✅ 完了

> Phase 1 の全タスクは実施済み。詳細は [Appendix A](#appendix-a-実施済みバックログ) を参照。

---

### Phase 2: パターン抽象化 — 🟢 92% 完了

**目標**: 繰り返される構造パターンをファクトリ/ジェネレータに置き換え。

#### 2-1〜2-4: Frontend パターン抽象化 — ✅ 完了
> 実施済み。詳細は [Appendix A](#appendix-a-実施済みバックログ) を参照。

#### 2-5. Backend: Transform 層の簡素化 — 🟢 ほぼ完了
- [x] `utils/fieldMapper.ts` 作成: `snake_case → camelCase` 汎用変換 + ISO 日付フォーマット + カスタム変換 [B-T1] ✅
- [x] 既存 Transform ファイルを汎用マッパー + 差分カスタマイズの構成に移行 (21/22ファイル完了) ✅
- [ ] `standardEffortMasterTransform.ts` を `createFieldMapper` に移行 (残り1ファイル、~40行)

**Phase 2 残作業の推定削減行数**: ~20行
**リスク**: 低 (同一パターンの機械的適用のみ)

---

### Phase 3: アーキテクチャリファクタリング (高リスク・最大効果) — 🔴 7% 完了

**目標**: レイヤー構造自体のボイラープレートを解消。

> **ファウラーの原則**: "Preparatory Refactoring" — 次の機能追加を容易にするためのリファクタリングとして実施。
> **t_wada の原則**: "Red-Green-Refactor" — 各ステップで既存テストが Green であることを確認してから進む。

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
- [ ] 既存の単純 CRUD サービスを基底クラス継承に移行 (Strangler Fig: 1エンティティずつ)

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
- [ ] `MasterDetailSheet<T>` ジェネリックコンポーネント作成: view/edit/delete フローの共通化
- [ ] 3つのマスター一覧ルートを共通フック呼び出し + JSX レイアウトのみに簡素化

#### 3-5. Frontend: 巨大コンポーネントの分割 — 🔶 一部実施
- [x] `ProjectForm.tsx` (420行 → 302行) ✅ 削減済み
- [ ] `SidePanelSettings.tsx` (359行) → `PeriodSettings` + `ProjectColorSettings` + `ProfileSettings` に分割
- [ ] `WorkloadDataTable.tsx` (416行) → カラム定義、展開ロジック、フィルタリングを分離
- [ ] `CaseForm.tsx` (359行) → 計算モード別コンポーネントに分割

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

### Phase 5: 画面分割・ナビゲーション再構成 — ✅ 完了

> Phase 5 の全タスクは実施済み。詳細は [Appendix A](#appendix-a-実施済みバックログ) を参照。

---

### Phase 6: デッドコード削除・簡素化 (新規) — 🔴 未着手

**目標**: 後方互換のために残されたコード、未使用コード、条件付きで削除可能なコードを特定・除去し、コードベースをよりシンプルにする。

> **ファウラーの原則**: "Remove Dead Code" — 使われていないコードは理解の妨げになる。削除せよ。
> **t_wada の原則**: 削除前にテストで振る舞いを保護し、削除後もテストが Green であることを確認する。

#### 6-1. 未使用バックエンドエンドポイントの削除 — ❌ 未着手
- [ ] `ChartViewIndirectWorkItem` 関連の全スタックを削除:
  - `types/chartViewIndirectWorkItem.ts`
  - `data/chartViewIndirectWorkItemData.ts`
  - `transform/chartViewIndirectWorkItemTransform.ts`
  - `services/chartViewIndirectWorkItemService.ts`
  - `routes/chartViewIndirectWorkItems.ts`
  - `__tests__/routes/chartViewIndirectWorkItems.test.ts`
  - `index.ts` からのルートマウント削除
- **根拠**: フロントエンドから一切参照されていない。Capacity Lines 機能実装後に不要になった可能性大
- **事前確認**: 外部システムからの利用がないことを確認してから削除

#### 6-2. 後方互換フィルターパラメータの統一 — ❌ 未着手
- [ ] `routes/projects.ts` の `filter[businessUnitCode]` (単数形) サポートを削除
  - 現在 `filter[businessUnitCodes]` (複数形) と `filter[businessUnitCode]` (単数形) の両方をサポート
  - フロントエンドが `filter[businessUnitCodes]` のみ使用していることを確認後、単数形を削除
- **根拠**: API 進化の過渡期に追加された後方互換コード。クライアントが統一されていれば不要

#### 6-3. 重複型定義の統一 — ❌ 未着手
- [ ] `case-study/types/index.ts` 内の `StandardEffortMaster` ローカル型定義を確認
  - `standard-effort-masters` feature からの import に置き換え可能か検証
  - feature 間の依存は最小限にする原則に注意（必要なら shared types に昇格）

#### 6-4. Feature 型ファイルの re-export 整理 — ❌ 未着手
- [ ] 8つの feature `types/index.ts` から `PaginatedResponse`, `SingleResponse`, `ProblemDetails`, `SelectOption` の re-export パターンを確認
  - 各 feature で `@/lib/api` から直接 import する方が明確なら re-export を削除
  - 消費者側のインポートパスを調査し、影響範囲を確認してから判断

#### 6-5. standardEffortMasterTransform.ts の createFieldMapper 移行 — ❌ 未着手
- [ ] 手動マッピングを `createFieldMapper` に移行 (Phase 2-5 の残タスク)
  - `toSummaryResponse`: 6フィールドの直接マッピング → createFieldMapper
  - `toWeightResponse`: 3フィールドの直接マッピング → createFieldMapper
  - `toDetailResponse`: composition パターンはそのまま維持

**推定削減行数**: ~300行 (うちテストコード含む)
**リスク**: 低 (未使用コードの削除が主体)
**所要規模**: 小
**前提条件**: 各削除前に参照調査を完了すること

---

## 5. 実行順序と依存関係

### 推奨実行順序 (2026-03-13 時点)

```
即時実行可能 (低リスク・高確実性)
  ├── 6-5 standardEffortMaster Transform 移行 ← 10分で完了
  ├── 6-1 ChartViewIndirectWorkItem 削除 ← 参照確認後即実行
  ├── 6-2 後方互換フィルター統一 ← フロントエンド確認後即実行
  └── 6-3 重複型定義の統一 ← 影響調査後即実行
        │
次期 (中リスク・高効果)
  ├── 3-4 マスター CRUD ルート統合 ← F-RO1 解消、~350行削減
  ├── 3-5 巨大コンポーネント分割 ← F-C8 解消
  └── 3-3 Backend ルートグルーピング ← B-R3 解消
        │
将来 (高リスク・最大効果) ← 設計 PoC が必要
  ├── 3-2 Base CRUD Data ← B-D1 解消、~600行削減
  ├── 3-1 Base CRUD Service ← B-S1 解消、~800行削減 (3-2 依存)
  └── 4-* 品質向上タスク群 ← 随時実行可
```

### 依存関係図

```
Phase 6 (デッドコード削除) ─── 他の全 Phase と独立。即時実行可能
        │
Phase 2-5 (Transform 残1件) ─── Phase 3-1 の前提
        │
Phase 3-2 (Base CRUD Data) ───┐
                               ├── Phase 3-1 (Base CRUD Service)
Phase 3-3 (ルートグルーピング) ─── 独立。いつでも実行可
        │
Phase 3-4 (マスター CRUD 統合) ─── 独立。Phase 2 完了後推奨
        │
Phase 3-5 (コンポーネント分割) ─── 独立。いつでも実行可
        │
Phase 4 (品質向上) ─── 各タスク独立。随時実行可
```

---

## Phase 5: 画面分割・ナビゲーション再構成 — ✅ 完了

> 2026-03-13 確認: 全4 Issue が実施完了。

### 完了した構成

```
ダッシュボード
  └ 山積ダッシュボード              /workload

案件管理
  ├ 案件一覧                       /projects
  └ 標準工数パターン                /projects/standard-efforts

間接作業管理
  ├ 間接工数入力                   /indirect/monthly-loads
  └ シミュレーション                /indirect/simulation

マスタ管理
  ├ 人員計画ケース                  /master/headcount-plans
  ├ キャパシティシナリオ             /master/capacity-scenarios
  ├ 間接作業ケース                  /master/indirect-work-cases
  ├ 案件タイプ                      /master/project-types
  ├ 作業種類                        /master/work-types
  └ ビジネスユニット                /master/business-units
```

### Issue 完了状況

| # | Issue | 状態 |
|---|-------|------|
| [#47](../../issues/47) | ルーティング再構成 | ✅ 完了 |
| [#48](../../issues/48) | マスタ管理画面の新規作成 | ✅ 完了 |
| [#49](../../issues/49) | シミュレーション画面の新規作成 | ✅ 完了 |
| [#50](../../issues/50) | 旧 indirect-capacity-settings 廃止 | ✅ 完了 |

---

## 6. リスク管理

### 各 Phase のリスクと対策

| Phase | リスク | 対策 |
|-------|-------|------|
| Phase 1 | ✅ 完了 | — |
| Phase 2 | ✅ ほぼ完了 (残1件は低リスク) | — |
| Phase 3 | 高: 基底クラスの設計が全エンティティに影響 | Strangler Fig パターンで1エンティティずつ移行。各ステップで全テストを実行 |
| Phase 4 | 低: 表面的な変更のみ | — |
| Phase 5 | ✅ 完了 | — |
| Phase 6 | 低: 未使用コード削除が主体 | 削除前に参照調査 (grep + テスト実行) を必ず実施。外部 API の利用者確認 |

### 全体方針

- **各タスクは1機能(1 feature / 1エンティティ)単位でPRを作成**し、段階的にマージ
- **テストカバレッジを維持**: リファクタリング前後で既存テストが全パスすること (t_wada: "テストが壊れたらすぐ戻す")
- **振る舞いの変更を伴わない**: 外部 API レスポンスや UI の見た目は一切変更しない
- **Strangler Fig パターン**: Phase 3 では旧実装を一度に削除せず、新基底クラスへの移行を1エンティティずつ進める
- **Preparatory Refactoring**: 新機能追加の直前に、その機能を容易にするリファクタリングを実施する (ファウラー: "最初にリファクタリングしてから機能を追加せよ")

### B-S2 (Middle Man) に関する方針

B-S2 はファウラーの「Middle Man」に該当するが、現時点では**意図的に保留**する。理由:

1. **レイヤー分離の価値**: Service 層が薄くても、Routes → Services → Data の明確な境界はテスタビリティと変更容易性に寄与
2. **将来のビジネスロジック追加**: 要件変更でバリデーションやワークフローが追加される可能性がある
3. **Phase 3 との整合**: Base CRUD Service 導入時にボイラープレートは解消される
4. **費用対効果**: Inline Class で Service 層を廃止すると Routes ファイルが肥大化し、別の問題を生む

→ Phase 3 (Base CRUD Service) で自然に解消される。個別の Inline Class は行わない。

---

## 7. 期待される効果

### 定量的効果

| 指標 | Before | 現在 (Phase 1+2+5 完了) | After (全Phase完了・推定) | 改善率 |
|------|--------|----------------------|-------------------------|--------|
| 総行数 (本番コード) | ~28,600 | ~28,300 | ~24,000 | -16% |
| 重複コード行 | ~3,800 | ~2,750 | ~400 | -89% |
| 新エンティティ追加時の必要行数 | ~600 | ~500 | ~100 | -83% |
| 変更波及ファイル数 (共通パターン修正時) | 14-20 | 8-12 | 1-2 | -90% |

### 定性的効果
- **保守性向上**: 共通パターンの修正が1箇所で完結
- **一貫性確保**: バリデーション、エラーメッセージ、レスポンス形式の統一
- **オンボーディング改善**: 新規開発者が理解すべきパターンが明確に
- **拡張性向上**: 新機能追加時のボイラープレートが大幅削減
- **認知負荷低減**: デッドコード削除によりコードベースの理解が容易に

---

## Appendix A: 実施済みバックログ

> 以下は実施完了済みのリファクタリング項目。コードベース調査日: 2026-03-13

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

### Phase 2: パターン抽象化 (2-1〜2-4 完了、2-5 ほぼ完了)

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

#### 2-5. Backend: Transform 層の簡素化 🔶 (21/22 完了)
| タスク | 対応スメル | 実装先 |
|--------|----------|--------|
| `createFieldMapper` ユーティリティ作成 | B-T1 | `utils/fieldMapper.ts` (92行) |
| 21 Transform ファイルを createFieldMapper に移行 | B-T1 | 各 transform/*.ts |
| 3モード対応: DirectMapping / TransformMapping / ComputedMapping | B-T1 | `utils/fieldMapper.ts` |

---

### Phase 5: 画面分割・ナビゲーション再構成 (全完了)

| # | Issue | 概要 | 状態 |
|---|-------|------|------|
| [#47](../../issues/47) | ルーティング再構成 — `/projects` へ移動 | ✅ 完了 |
| [#48](../../issues/48) | マスタ管理画面の新規作成 (人員計画・キャパシティシナリオ・間接作業ケース) | ✅ 完了 |
| [#49](../../issues/49) | シミュレーション画面の新規作成 | ✅ 完了 |
| [#50](../../issues/50) | 旧 indirect-capacity-settings 廃止・サイドメニュー最終更新 | ✅ 完了 |

---

### 個別解消済みスメル

| ID | 内容 | 状態 | 備考 |
|----|------|------|------|
| B-S4 | バルク Upsert バリデーション重複 | ✅ 解消 | 重複パターンが検出されなくなった |
| B-D2 | WHERE 句の文字列組み立て | ✅ 解消 | パラメータ化クエリに移行済み |
| B-TY2 | chartData.ts の肥大化 | ✅ 軽減 | 162行 → 153行に削減 |
| F-C7 | ケース管理リスト状態管理重複 | ✅ 解消 | props ベースの状態管理に整理済み |
| F-C8 (部分) | ProjectForm.tsx 巨大化 | ✅ 軽減 | 420行 → 302行に削減 |
| B-T1 (大部分) | 機械的 Transform | ✅ ほぼ解消 | 21/22ファイルが createFieldMapper 移行完了 |

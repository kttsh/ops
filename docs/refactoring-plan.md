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
| Phase 2: パターン抽象化 | 12 | **12** | 0 | **100%** |
| Phase 3: アーキテクチャリファクタリング | 15 | **1** | 14 | **7%** |
| Phase 4: 品質向上・統一化 | 7 | **0** | 7 | **0%** |
| Phase 5: 画面分割・ナビゲーション再構成 | 4 | **4** | 0 | **100%** |
| Phase 6: デッドコード削除・簡素化 | 5 | **5** | 0 | **100%** |
| **合計** | **57** | **35** | **22** | **61%** |

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
| HIGH | 14 | 9 | 5 | ~860 |
| MEDIUM | 12 | 5 | 7 | ~400 |
| LOW | 5 | 4 | 1 | ~50 |
| **合計** | **39** | **22** | **17** | **~2,710** |

Phase 1〜2 と Phase 5〜6 の完了分により、当初の重複 ~3,800行から **~1,090行を解消** (29%削減)。

---

## 2. 残存コードスメル

### Backend

| ID | スメル | 深刻度 | 影響範囲 | 概要 |
|----|--------|--------|---------|------|
| B-S1 | CRUD サービスパターン重複 | CRITICAL | 23 サービスファイル | `findAll`〜`restore` の6メソッドが全マスター系で同一構造 |
| B-D1 | SQL クエリパターン重複 | CRITICAL | 23 データファイル (~1,770行重複) | ソフトデリート/リストア/ページネーション/参照チェック/作成パターン |
| B-S5 | ソフトデリートロジック重複 | HIGH | 15+ データファイル | `deleted_at = GETDATE()` / `NULL` が全ファイルで重複 |
| B-S3 | 親リソース存在チェック重複 | HIGH | 4 サービスファイル | `*Exists()` メソッドが個別実装 |
| B-S2 | Middle Man / Pass-Through 層 | HIGH | 15+ サービスファイル | Phase 3-1 で自然解消予定。個別対処は行わない |
| B-R3 | ルート集約の肥大化 | MEDIUM | `index.ts` (28ルート) | ドメイン別グルーピング未実施 |

### Frontend

| ID | スメル | 深刻度 | 影響範囲 | 概要 |
|----|--------|--------|---------|------|
| F-RO1 | マスター CRUD ルート重複 | CRITICAL | 3 ルートファイル (~350行重複) | 検索/ページネーション/復元ロジックが同一 |
| F-C8 | 巨大コンポーネント (200行超) | MEDIUM | 9 コンポーネント | DetailSheet 3件は `MasterDetailSheet<T>` 統合候補 |
| F-A5 | トースト通知の不統一 | MEDIUM | mutations.ts 全般 | CRUD Mutation のトースト処理が未統一 |
| F-T3 | Search スキーマの不統一 | MEDIUM | 4 feature | ページネーション有無がバラバラ |
| F-RO4 | ルートパスのハードコード | MEDIUM | columns.tsx × 4 + hooks | マジックストリングが散在 |

---

## 3. 優先度付き実行計画

### 優先度の判断基準

- 🟢 **即時**: 低リスク・高確実性。調査 → 即実行。テストで保護済み
- 🟡 **次期**: 中リスク・高効果。設計判断を要するが、削減行数が大きい
- 🔴 **将来**: 高リスク・最大効果。設計 PoC が必要。段階的移行が必須

### 推奨実行順序

```
🟢 即時実行可能 (低リスク)
  ├── 6-3 重複型定義の統一           ← ✅ 完了
  ├── 6-4 Feature 型 re-export 整理  ← ✅ 完了
  ├── 4-3 Backend 型ファイルの整理
  └── 4-4 Row 型の命名統一
        │
🟡 次期 (中リスク・高効果)
  ├── 3-4 マスター CRUD ルート統合      ← F-RO1 解消、~350行削減
  ├── 3-5 巨大コンポーネント分割        ← F-C8 解消
  ├── 3-3 Backend ルートグルーピング     ← B-R3 解消
  ├── 4-1 トースト通知の統一            ← F-A5 解消
  ├── 4-2 ページネーション戦略の統一     ← F-T3 解消
  └── 4-5 ルートパスのハードコード解消   ← F-RO4 解消
        │
🔴 将来 (高リスク・最大効果) ← 設計 PoC が必要
  ├── 3-2 Base CRUD Data              ← B-D1 解消、~600行削減
  └── 3-1 Base CRUD Service           ← B-S1/B-S3/B-S5 解消、~960行削減 (3-2 依存)
```

### 依存関係

```
6-3, 6-4           ─── 独立。即時実行可
4-3, 4-4            ─── 独立。即時実行可
3-3                 ─── 独立。いつでも実行可
3-4                 ─── 独立。Phase 2 完了済みのため即実行可
3-5                 ─── 独立。いつでも実行可
4-1, 4-2, 4-5      ─── 独立。随時実行可
3-2 (Base Data)     ─── 独立。PoC 後に着手
3-1 (Base Service)  ─── 3-2 に依存。3-2 完了後に着手
```

---

## 4. タスク詳細 — 🟢 即時実行可能

### 6-3. 重複型定義の統一 — ✅ 完了 (2026-03-13)

- [x] `case-study/types/index.ts` 内の `StandardEffortMaster` ローカル型定義を `standard-effort-masters` feature からの re-export に置換
  - `StandardEffortMaster`, `StandardEffortWeight`, `StandardEffortMasterDetail` の3型を統一
  - `StandardEffortMasterListParams` は case-study 固有（全フィールド optional）のためローカルに残置
  - feature 間依存は re-export による最小限の参照に留めた
- **対応スメル**: なし（整理目的）
- **リスク**: 低

### 6-4. Feature 型ファイルの re-export 整理 — ✅ 完了 (2026-03-13)

- [x] 8つの feature `types/index.ts` から `PaginatedResponse`, `SingleResponse`, `ProblemDetails`, `SelectOption` の re-export を削除
  - 全消費者を調査し、これら4型を feature パス経由で import しているコードは外部に存在しないことを確認
  - feature 内部の api クライアント (5ファイル) が feature types 経由で import していた箇所を `@/lib/api` からの直接 import に変更
  - feature `index.ts` (7ファイル) の re-export リストから4型を除去
  - `indirect-case-study/types/common.ts` (re-export のみのファイル) を削除
- **対応スメル**: なし（整理目的）
- **リスク**: 低

### 4-3. Backend 型ファイルの整理

- [ ] `chartColorPalette.ts` と `chartColorSetting.ts` を `chartSettings.ts` に統合
- [ ] `pagination.ts` を `types/common.ts` に統合
- **対応スメル**: なし（整理目的）
- **リスク**: 低

### 4-4. Row 型の命名統一

- [ ] JOIN 付き Row 型を `*DetailRow` / `*QueryRow` に改名して意図を明確化
- **対応スメル**: なし（可読性向上）
- **リスク**: 低

---

## 5. タスク詳細 — 🟡 次期

### 3-4. Frontend: マスター CRUD ルートの統合

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
- **対応スメル**: F-RO1 (CRITICAL)
- **推定削減行数**: ~350行
- **リスク**: 中

### 3-5. Frontend: 巨大コンポーネントの分割

- [x] `ProjectForm.tsx` (420行 → 302行) ✅ 削減済み
- [ ] `SidePanelSettings.tsx` (359行) → `PeriodSettings` + `ProjectColorSettings` + `ProfileSettings` に分割
- [ ] `WorkloadDataTable.tsx` (416行) → カラム定義、展開ロジック、フィルタリングを分離
- [ ] `CaseForm.tsx` (359行) → 計算モード別コンポーネントに分割
- **対応スメル**: F-C8 (MEDIUM)
- **リスク**: 中

### 3-3. Backend: ルートのドメイン別グルーピング

- [ ] `routes/master/index.ts` 作成: マスターデータ系ルートを集約 [B-R3]
- [ ] `routes/chart/index.ts` 作成: チャート関連ルートを集約
- [ ] `routes/workload/index.ts` 作成: 工数関連ルートを集約
- [ ] `index.ts` のルートマウントをドメイン単位に簡素化
- **対応スメル**: B-R3 (MEDIUM)
- **リスク**: 中

### 4-1. トースト通知の統一

- [ ] `lib/toast-utils.ts` を拡充: CRUD 操作用の標準メッセージテンプレート [F-A5]
- [ ] 全 Mutation のトースト処理を統一パターンに
- **対応スメル**: F-A5 (MEDIUM)
- **リスク**: 低

### 4-2. ページネーション戦略の統一

- [ ] マスター一覧のページネーション有無を統一 [F-T3]
- [ ] `lib/api/constants.ts` にデフォルトページサイズを定義
- **対応スメル**: F-T3 (MEDIUM)
- **リスク**: 低

### 4-5. ルートパスのハードコード解消

- [ ] TanStack Router の型安全ルートパスを活用し、マジックストリングを排除 [F-RO4]
- **対応スメル**: F-RO4 (MEDIUM)
- **リスク**: 低

---

## 6. タスク詳細 — 🔴 将来 (設計 PoC 要)

> **ファウラーの原則**: "Preparatory Refactoring" — 次の機能追加を容易にするためのリファクタリングとして実施。
> **t_wada の原則**: "Red-Green-Refactor" — 各ステップで既存テストが Green であることを確認してから進む。

### 3-2. Backend: Base CRUD Data

- [ ] `data/base/BaseCrudData.ts` 作成 [B-D1]:
  - 共通の `findAll` (ページネーション付き)
  - 共通の `softDelete` / `restore`
  - 共通の `hasReferences`
  - テーブル名・カラム定義をメタデータとして受け取る
- [ ] 単純な CRUD データクラスを基底クラス継承に移行
- **対応スメル**: B-D1 (CRITICAL)
- **推定削減行数**: ~600行
- **リスク**: 高 (全データアクセスの基盤変更)

### 3-1. Backend: Base CRUD Service

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
- [ ] `utils/validationHelpers.ts` 作成: 親存在チェック、複合キー重複チェック [B-S3]
- [ ] 既存の単純 CRUD サービスを基底クラス継承に移行 (Strangler Fig: 1エンティティずつ)
- **対応スメル**: B-S1 (CRITICAL), B-S3 (HIGH), B-S5 (HIGH)
- **推定削減行数**: ~960行
- **リスク**: 高 (アーキテクチャ変更。3-2 への依存あり)
- **前提**: 3-2 (Base CRUD Data) が完了していること

---

## 7. リスク管理

### 全体方針

- **各タスクは1機能(1 feature / 1エンティティ)単位でPRを作成**し、段階的にマージ
- **テストカバレッジを維持**: リファクタリング前後で既存テストが全パスすること (t_wada: "テストが壊れたらすぐ戻す")
- **振る舞いの変更を伴わない**: 外部 API レスポンスや UI の見た目は一切変更しない
- **Strangler Fig パターン**: Phase 3 では旧実装を一度に削除せず、新基底クラスへの移行を1エンティティずつ進める
- **Preparatory Refactoring**: 新機能追加の直前に、その機能を容易にするリファクタリングを実施する

### B-S2 (Middle Man) に関する方針

B-S2 はファウラーの「Middle Man」に該当するが、現時点では**意図的に保留**する。理由:

1. **レイヤー分離の価値**: Service 層が薄くても、Routes → Services → Data の明確な境界はテスタビリティと変更容易性に寄与
2. **将来のビジネスロジック追加**: 要件変更でバリデーションやワークフローが追加される可能性がある
3. **Phase 3 との整合**: Base CRUD Service 導入時にボイラープレートは解消される
4. **費用対効果**: Inline Class で Service 層を廃止すると Routes ファイルが肥大化し、別の問題を生む

→ Phase 3 (Base CRUD Service) で自然に解消される。個別の Inline Class は行わない。

---

## 8. 期待される効果

### 定量的効果

| 指標 | Before | 現在 (Phase 1+2+5+6 完了分) | After (全タスク完了・推定) | 改善率 |
|------|--------|----------------------|-------------------------|--------|
| 総行数 (本番コード) | ~28,600 | ~28,300 | ~24,000 | -16% |
| 重複コード行 | ~3,800 | ~2,710 | ~400 | -89% |
| 新エンティティ追加時の必要行数 | ~600 | ~500 | ~100 | -83% |
| 変更波及ファイル数 (共通パターン修正時) | 14-20 | 8-12 | 1-2 | -90% |

### 定性的効果

- **保守性向上**: 共通パターンの修正が1箇所で完結
- **一貫性確保**: バリデーション、エラーメッセージ、レスポンス形式の統一
- **オンボーディング改善**: 新規開発者が理解すべきパターンが明確に
- **拡張性向上**: 新機能追加時のボイラープレートが大幅削減
- **認知負荷低減**: デッドコード削除によりコードベースの理解が容易に

---

## Appendix A: 実行ログ

> 完了済みリファクタリングの記録。コードベース調査日: 2026-03-13

### Phase 1: 共通ユーティリティ抽出 — ✅ 全完了

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

### Phase 2: パターン抽象化 — ✅ 全完了

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

#### 2-5. Backend: Transform 層の簡素化 ✅ (22/22 完了)

| タスク | 対応スメル | 実装先 |
|--------|----------|--------|
| `createFieldMapper` ユーティリティ作成 | B-T1 | `utils/fieldMapper.ts` (92行) |
| 21 Transform ファイルを createFieldMapper に移行 | B-T1 | 各 transform/*.ts |
| 3モード対応: DirectMapping / TransformMapping / ComputedMapping | B-T1 | `utils/fieldMapper.ts` |

---

### Phase 5: 画面分割・ナビゲーション再構成 — ✅ 全完了

| # | Issue | 概要 | 状態 |
|---|-------|------|------|
| [#47](../../issues/47) | ルーティング再構成 — `/projects` へ移動 | ✅ 完了 |
| [#48](../../issues/48) | マスタ管理画面の新規作成 (人員計画・キャパシティシナリオ・間接作業ケース) | ✅ 完了 |
| [#49](../../issues/49) | シミュレーション画面の新規作成 | ✅ 完了 |
| [#50](../../issues/50) | 旧 indirect-capacity-settings 廃止・サイドメニュー最終更新 | ✅ 完了 |

完了した画面構成:

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

---

### Phase 6: デッドコード削除・簡素化 — ✅ 全完了

#### 6-1. 未使用バックエンドエンドポイントの削除 — ✅ 完了 (2026-03-13)

- `ChartViewIndirectWorkItem` 関連の全スタック (types/data/transform/services/routes/tests) を削除
- `index.ts` からのルートマウント削除、DB定義・シードデータ・API仕様書・テーブル仕様書を更新
- **根拠**: フロントエンドから一切参照されていない。Capacity Lines 機能実装後に不要になった

#### 6-2. 後方互換フィルターパラメータの統一 — ✅ 完了 (2026-03-13)

- `routes/projects.ts` の `filter[businessUnitCode]` (単数形) サポートを削除
- `types/project.ts` のスキーマ定義、ルートのフォールバックロジック、テスト、API仕様書を更新
- **根拠**: フロントエンドが `filter[businessUnitCodes]` のみ使用。後方互換コードは不要

#### 6-5. standardEffortMasterTransform.ts の createFieldMapper 移行 — ✅ 完了 (2026-03-13)

- `toSummaryResponse` / `toWeightResponse` を createFieldMapper に移行
- `toDetailResponse` は composition パターンを維持

#### 6-4. Feature 型 re-export 整理 — ✅ 完了 (2026-03-13)

- 8つの feature `types/index.ts` から `PaginatedResponse`, `SingleResponse`, `ProblemDetails`, `SelectOption` の re-export を削除
- feature 内部の api クライアント 5ファイルの import 元を `@/lib/api` に変更
- feature `index.ts` 7ファイルの re-export リストから4型を除去
- `indirect-case-study/types/common.ts` (re-export 専用ファイル) を削除
- **根拠**: 4型はすべて `@/lib/api` の公開型。feature 経由の迂回 import は不要

#### 6-3. 重複型定義の統一 — ✅ 完了 (2026-03-13)

- `case-study/types/index.ts` の `StandardEffortMaster`, `StandardEffortWeight`, `StandardEffortMasterDetail` ローカル定義を削除
- `@/features/standard-effort-masters/types` からの re-export に置換
- `StandardEffortMasterListParams` は case-study 固有要件（全フィールド optional）のためローカルに残置
- **根拠**: `standard-effort-masters` が正規の型定義元。case-study 側は `SoftDeletableEntity` 継承なしの不完全な複製だった

---

### 個別解消済みスメル

| ID | 内容 | 状態 | 備考 |
|----|------|------|------|
| B-S4 | バルク Upsert バリデーション重複 | ✅ 解消 | 重複パターンが検出されなくなった |
| B-D2 | WHERE 句の文字列組み立て | ✅ 解消 | パラメータ化クエリに移行済み |
| B-TY2 | chartData.ts の肥大化 | ✅ 軽減 | 162行 → 153行に削減 |
| F-C7 | ケース管理リスト状態管理重複 | ✅ 解消 | props ベースの状態管理に整理済み |
| F-C8 (部分) | ProjectForm.tsx 巨大化 | ✅ 軽減 | 420行 → 302行に削減 |
| B-T1 | 機械的 Transform | ✅ 解消 | 22/22ファイルが createFieldMapper 移行完了 |

# ギャップ分析: indirect-case-study

## 1. 現状調査

### 1.1 バックエンド（完全実装済み）

全ての必要なAPIエンドポイントが実装済み。routes → services → data → transform → types の5層構成で統一されたパターンに従っている。

| エンティティ | Route | Service | Data | Transform | Types | Tests |
|-------------|:-----:|:-------:|:----:|:---------:|:-----:|:-----:|
| headcountPlanCases | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| monthlyHeadcountPlans | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| capacityScenarios | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| monthlyCapacities | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| indirectWorkCases | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| indirectWorkTypeRatios | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| monthlyIndirectWorkLoads | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| businessUnits（マスタ） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| workTypes（マスタ） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**特記事項:**
- `POST /capacity-scenarios/:id/actions/calculate` — キャパシティ計算APIも実装済み（`headcountPlanCaseId` をリクエストボディで受け取り、MERGE文で月次キャパシティをupsert）
- 全ネストリソースで `PUT /bulk`（一括upsert）実装済み
- ソフトデリート + restore アクション実装済み（親リソースのみ）
- ページネーション・フィルタリング（`filter[includeDisabled]`, `filter[businessUnitCode]`）実装済み

### 1.2 フロントエンド（画面未実装、部分的に型・API定義あり）

#### 既存アセット

| アセット | 場所 | 状態 |
|---------|------|------|
| `IndirectWorkCase` 型 | `features/workload/types/index.ts` | 簡易型（id, name, buCode のみ） |
| `fetchIndirectWorkCases()` | `features/workload/api/api-client.ts` | 全件取得（ダッシュボード用） |
| `indirectWorkCasesQueryOptions()` | `features/workload/api/queries.ts` | クエリ定義あり |
| `SidePanelIndirect.tsx` | `features/workload/components/` | ダッシュボード用サイドパネル（表示切替・色設定のみ） |
| `BusinessUnitSelector.tsx` | `features/workload/components/` | BU選択UIあり（マルチセレクト型、本画面ではシングルセレクトが必要） |

#### 未実装アセット

- **ルート/画面**: 間接作業・キャパシティ設定画面は未作成
- **feature モジュール**: `features/indirect-case-study/` は存在しない
- **人員計画ケース関連**: フロントエンドに型・API定義なし
- **キャパシティシナリオ関連**: フロントエンドに型・API定義なし
- **月次人員数入力UI**: 未実装
- **間接作業比率マトリクスUI**: 未実装
- **計算結果テーブルUI**: 未実装
- **Excelエクスポート**: 未実装

### 1.3 既存パターン・規約

#### フロントエンド feature 構成パターン

```
features/[feature]/
├── types/index.ts           # 型定義 + Zodスキーマ
├── api/
│   ├── api-client.ts        # fetch関数
│   ├── queries.ts           # Query Key Factory + queryOptions
│   └── mutations.ts         # useMutation hooks
├── components/
│   ├── columns.tsx          # TanStack Table列定義
│   ├── DataTable.tsx        # テーブルコンポーネント
│   └── [Form].tsx           # TanStack Formフォーム
├── hooks/                   # feature固有hooks（任意）
└── index.ts                 # パブリックAPIエクスポート
```

#### 利用可能な shadcn/ui コンポーネント

Button, Input, Label, Select, Switch, Badge, Table, AlertDialog, Sheet, Separator

#### 共有コンポーネント

- `DataTableToolbar` — 検索 + includeDisabled トグル + 新規作成ボタン
- `DeleteConfirmDialog` — 削除確認ダイアログ

---

## 2. 要件実現可能性分析

### 2.1 要件-アセット対応表

| Req# | 要件 | 必要な技術要素 | 現状 | ギャップ |
|------|------|-------------|------|---------|
| 1 | BU選択 | BUドロップダウン（シングルセレクト）、URLステート管理 | `BusinessUnitSelector` はマルチセレクト型 | **要新規作成**: シングルセレクト版BUセレクターが必要 |
| 2 | 人員計画ケースCRUD | CRUD UI + APIクライアント | バックエンドAPI済、フロントなし | **Missing**: feature全体（types, api, components） |
| 3 | 月次人員数入力 | 12ヶ月グリッド入力、年度ページング、一括入力ダイアログ | なし | **Missing**: グリッド入力コンポーネント |
| 4 | キャパシティシナリオCRUD | CRUD UI + APIクライアント | バックエンドAPI済、フロントなし | **Missing**: feature全体（types, api, components） |
| 5 | キャパシティ計算 | calculate API呼び出し + 結果表示 | バックエンドAPI済 | **Missing**: フロントエンド計算呼び出し |
| 6 | 間接作業ケースCRUD | CRUD UI + APIクライアント | workload featureに簡易型あり | **Missing**: フル型定義 + CRUD UI |
| 7 | 間接作業比率入力 | 年度×種類マトリクス入力UI | なし | **Missing**: マトリクス入力コンポーネント |
| 8 | 間接作業工数計算 | フロントエンド計算ロジック | なし | **Missing**: 計算ロジック + UI統合 |
| 9 | 計算結果表示 | 月次テーブル（折りたたみ行、按分計算） | なし | **Missing**: 計算結果テーブルコンポーネント |
| 10 | 計算結果保存 | bulk PUT呼び出し + トースト | バックエンドAPI済 | **Missing**: mutation hooks |
| 11 | レスポンシブレイアウト | Tailwind CSS レスポンシブ | Tailwind利用可 | **Constraint**: 2カラムレイアウト設計のみ |
| 12 | 未保存警告 | beforeUnload + ルート遷移ガード | なし | **Missing**: 未保存検知 + 警告ダイアログ |
| 13 | Excelエクスポート | xlsx生成ライブラリ | なし | **Research Needed**: ライブラリ選定（sheetjs等） |
| 14 | 操作フィードバック | sonner トースト | sonner導入済み | 低ギャップ：パターン確立済み |

### 2.2 複雑度シグナル

| 要素 | 複雑度 | 理由 |
|------|--------|------|
| CRUD UI（Req 2, 4, 6） | 低 | 既存パターン（business-units等）をそのまま踏襲可能 |
| 月次人員数グリッド（Req 3） | 中 | 12ヶ月入力グリッドは既存コンポーネントにない新規UI |
| 間接作業比率マトリクス（Req 7） | 中 | 年度×種類の2次元入力は新規UIパターン |
| キャパシティ計算連携（Req 5） | 低 | APIは実装済み、呼び出すだけ |
| 間接工数計算（Req 8） | 中 | フロントエンド計算ロジック + 年度判定 |
| 計算結果テーブル（Req 9） | 中-高 | 折りたたみ行 + 按分計算 + 年度ページング |
| 未保存警告（Req 12） | 中 | TanStack Router の beforeLoad/遷移ガード統合 |
| Excelエクスポート（Req 13） | 低-中 | ライブラリ依存、初回導入 |
| 全体統合（画面レイアウト） | 高 | 左右2カラム、3つのケース選択、計算フロー連携 |

---

## 3. 実装アプローチ選択肢

### Option A: 単一 feature モジュールとして新規作成

`features/indirect-case-study/` を新規作成し、全コンポーネントを1つのfeatureに集約。

**構成案:**
```
features/indirect-case-study/
├── types/index.ts                    # 全エンティティの型 + スキーマ
├── api/
│   ├── api-client.ts                 # 全APIクライアント
│   ├── queries.ts                    # 全queryOptions
│   └── mutations.ts                  # 全mutation hooks
├── components/
│   ├── HeadcountPlanCaseList.tsx      # 人員計画ケースリスト
│   ├── HeadcountPlanCaseForm.tsx      # ケース編集オーバーレイ
│   ├── MonthlyHeadcountGrid.tsx       # 月次人員数グリッド
│   ├── BulkInputDialog.tsx            # 一括入力ダイアログ
│   ├── CapacityScenarioList.tsx       # キャパシティシナリオリスト
│   ├── CapacityScenarioForm.tsx       # シナリオ編集オーバーレイ
│   ├── IndirectWorkCaseList.tsx       # 間接作業ケースリスト
│   ├── IndirectWorkCaseForm.tsx       # ケース編集オーバーレイ
│   ├── IndirectWorkRatioMatrix.tsx    # 比率マトリクス
│   ├── CalculationResultTable.tsx     # 計算結果テーブル
│   ├── SettingsPanel.tsx              # 左側設定パネル
│   └── ResultPanel.tsx                # 右側結果パネル
├── hooks/
│   ├── useCapacityCalculation.ts      # キャパシティ計算
│   ├── useIndirectWorkCalculation.ts  # 間接工数計算
│   └── useUnsavedChanges.ts           # 未保存変更検知
└── index.ts
```

**トレードオフ:**
- ✅ 画面単位で凝集度が高い
- ✅ 既存featureとの依存なし
- ✅ 1つのfeatureで完結、ナビゲーションが容易
- ❌ types/index.ts が大きくなる可能性（7エンティティ分）
- ❌ api-client.ts も大きくなる可能性

### Option B: エンティティ別に複数 feature モジュールを作成

人員計画、キャパシティ、間接作業を別々のfeatureに分離。

**構成案:**
```
features/headcount-plan/          # 人員計画ケース + 月次人員数
features/capacity-scenario/       # キャパシティシナリオ + 月次キャパシティ
features/indirect-work/           # 間接作業ケース + 比率 + 月次工数
features/indirect-case-study/     # 統合画面（上記featureを利用）
```

**トレードオフ:**
- ✅ 各featureが小さく保たれる
- ✅ 将来的に別画面でも再利用可能
- ❌ feature間の依存が発生（indirect-case-study → 他3つ）
- ❌ ファイル数が大幅に増加
- ❌ CLAUDE.md の「features同士の依存は極力排除」に反する

### Option C: ハイブリッド（推奨）

`features/indirect-case-study/` を主体としつつ、型定義のみ粒度を分割。API・コンポーネントは1つのfeature内に集約。

**構成案:**
```
features/indirect-case-study/
├── types/
│   ├── headcount-plan.ts             # 人員計画系の型
│   ├── capacity-scenario.ts          # キャパシティ系の型
│   ├── indirect-work.ts              # 間接作業系の型
│   ├── calculation.ts                # 計算結果系の型
│   └── index.ts                      # 再エクスポート
├── api/
│   ├── headcount-plan-client.ts      # 人員計画API
│   ├── capacity-scenario-client.ts   # キャパシティAPI
│   ├── indirect-work-client.ts       # 間接作業API
│   ├── queries.ts                    # 全queryOptions（Key Factory統合）
│   └── mutations.ts                  # 全mutation hooks
├── components/
│   ├── （Option Aと同様）
├── hooks/
│   ├── （Option Aと同様）
└── index.ts
```

**トレードオフ:**
- ✅ 1 feature で完結（feature間依存なし）
- ✅ ファイル粒度が適切（型・APIクライアントをエンティティ別に分割）
- ✅ 既存パターンとの整合性が高い
- ❌ feature内のファイル数はやや多い（ただし管理可能な範囲）

---

## 4. Research Needed（設計フェーズへの持ち越し）

| # | 項目 | 理由 |
|---|------|------|
| R1 | Excelエクスポートライブラリ選定 | sheetjs / exceljs 等の比較が必要。バンドルサイズ・機能・ライセンスの評価 |
| R2 | TanStack Router の遷移ガード実装方法 | `beforeLoad` で未保存警告をどう実装するかの詳細調査 |
| R3 | workload feature との重複管理 | `IndirectWorkCase` 型が workload にも存在。重複排除戦略の決定 |
| R4 | 月次グリッド入力のアクセシビリティ | 12ヶ月×年度のグリッド入力でキーボードナビゲーション対応の検討 |

---

## 5. 実装複雑度とリスク

### 工数見積: **L（1〜2週間）**

**理由:**
- バックエンドは完全実装済みのため、フロントエンド開発のみ
- ただし、新規UIコンポーネントが多い（グリッド入力、マトリクス入力、折りたたみ結果テーブル）
- 3つのケース選択 + 計算フロー + 結果保存の統合が複雑
- 14要件・76個のAcceptance Criteria

### リスク: **Medium**

**理由:**
- 既存パターン（CRUD、TanStack Query/Form/Table）は確立されており踏襲可能 → リスク低減
- 新規UIパターン（グリッド入力、マトリクス、折りたたみテーブル）は未実績 → 中程度のリスク
- フロントエンド計算ロジック（年度判定、按分計算）は明確に定義されており → リスク低
- Excelエクスポートは初回導入 → 小さなリスク

---

## 6. 設計フェーズへの推奨事項

### 推奨アプローチ: Option C（ハイブリッド）

- 1つの `features/indirect-case-study/` featureとして構築
- 型定義とAPIクライアントはエンティティ別にファイル分割
- コンポーネントは画面構成に合わせて分割
- 既存パターン（Query Key Factory、useMutation、TanStack Form）を踏襲

### 設計フェーズでの重点事項

1. **ルート設計**: この画面は「マスタ管理」配下か独立カテゴリか（要件書の画面構成上は独立した設定画面）
2. **状態管理設計**: 3つのケース選択状態 + 計算結果の中間状態をどう管理するか（URL search params vs ローカルstate）
3. **コンポーネント分割の詳細**: 左パネル・右パネル内のコンポーネント境界の確定
4. **Research項目の解決**: R1〜R4の調査結果を設計に反映

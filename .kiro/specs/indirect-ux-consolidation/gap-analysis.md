# Gap Analysis: indirect-ux-consolidation

## 1. 現状調査

### 既存ディレクトリ構成

```
features/indirect-case-study/
├── api/          # クエリ・ミューテーション・APIクライアント
├── components/   # 15+コンポーネント（選択UI、テーブル、フォーム等）
├── hooks/        # 9+フック（シミュレーション、計算、エクスポート/インポート）
├── types/        # 型定義（5ファイル）
├── utils/        # ユーティリティ
└── index.ts      # パブリックAPI

routes/indirect/
├── simulation/   # index.tsx + index.lazy.tsx（293行）
└── monthly-loads/ # index.tsx + index.lazy.tsx（廃止対象）
```

### 再利用可能な既存資産

| 資産 | ファイル | 再利用度 |
|------|---------|---------|
| BU選択コンポーネント | `BusinessUnitSingleSelector.tsx` | **高** — そのまま使用可 |
| 計算結果テーブル | `CalculationResultTable.tsx` | **高** — 年度セレクタ→チップ変更、直接行追加のみ |
| primaryケース検出 | `simulation-utils.ts` | **高** — findPrimaryId/derivePrimaryState をそのまま活用 |
| キャパシティ計算Hook | `useCapacityCalculation.ts` | **高** — 変更不要 |
| 間接工数計算Hook | `useIndirectWorkCalculation.ts` | **高** — 変更不要 |
| メインシミュレーションHook | `useIndirectSimulation.ts` | **中** — 大幅簡素化が必要 |
| 結果パネル | `ResultPanel.tsx` | **低** — エクスポート/インポート/保存UI削除で実質書き直し |
| ケース選択セクション | `CaseSelectSection`（ルート内ローカル） | **低** — ドロップダウン→テキスト表示に変更 |
| クエリ・ミューテーション | `queries.ts`, `mutations.ts` | **高** — 変更不要 |
| APIクライアント | `*-client.ts` | **高** — 変更不要 |

### 既存パターン・規約

- **URLパラメータによるBU選択**: `?bu={code}` で選択BUを保持（維持）
- **primary自動選択**: `useEffect` + `findPrimaryId` で初回ロード時に自動選択（維持・強化）
- **TanStack Query**: `queryOptions` パターン、`STALE_TIMES.MEDIUM`（維持）
- **sonner トースト**: 計算完了・エラー通知（維持）
- **shadcn/ui**: Badge, Button, Select 等のUIプリミティブ（維持）

---

## 2. 要件実現可能性分析

### 要件→技術ニーズマッピング

| 要件 | 技術ニーズ | GAP状態 |
|------|-----------|---------|
| Req1: BU選択 | `BusinessUnitSingleSelector` + URL params | **なし** — 既存で対応可 |
| Req2: primary自動表示 | `derivePrimaryState` + ケース名テキスト表示 | **部分的** — ドロップダウン→テキスト表示への変更が必要 |
| Req3: 統合テーブル | `CalculationResultTable` + 保存済みデータ取得 | **部分的** — 「直接」行の追加、保存済みデータの初期表示ロジックが未実装 |
| Req4: 年度チップ | 新コンポーネント | **Missing** — 横並びチップセレクタは新規作成 |
| Req5: 1ボタン再計算 | 確認ダイアログ + 計算連続実行 | **部分的** — 計算ロジックは既存、連続実行+確認ダイアログが未実装 |
| Req6: サイドバー統合 | `SidebarNav.tsx` 変更 | **なし** — 設定値の変更のみ |
| Req7: 不要機能廃止 | ファイル削除 + 参照解除 | **なし** — 削除作業 |
| Req8: 最終計算日時 | 保存済みデータの `updatedAt` 参照 | **Unknown** — 既存APIレスポンスに最終計算日時が含まれるか要確認 |

### 主要GAPの詳細

#### GAP-1: 保存済みデータの初期表示（Req1, Req3）
**現状**: simulation画面は計算を実行するまでテーブルが空。monthly-loads画面が保存済みデータを別途表示。
**必要**: 画面表示時にprimaryケースの保存済みデータを自動的にフェッチしてテーブル表示。
**影響**: `useIndirectSimulation` のデータフロー変更。計算前の初期状態でも保存済みの `monthlyIndirectWorkLoads` を取得・表示するクエリ追加が必要。

#### GAP-2: 年度チップセレクタ（Req4）
**現状**: `Select`（セレクトボックス）で-2〜+8年度を固定表示。
**必要**: データが存在する年度のみ横並びチップで表示。
**影響**: 利用可能年度の動的取得ロジック + チップUIコンポーネントの新規作成。

#### GAP-3: 1ボタン再計算フロー（Req5）
**現状**: 「キャパシティ計算」→「間接作業計算」の2ボタン。計算結果はローカルステート、保存は別ボタン。
**必要**: 1ボタンで確認ダイアログ → キャパシティ計算 → 間接工数計算 → 自動保存。
**影響**: `useIndirectSimulation` の計算フローの統合。確認ダイアログ（`AlertDialog`）の追加。

#### GAP-4: 計算条件パネルのUX変更（Req2）
**現状**: `CaseSelectSection` がドロップダウン + Primary Badge + マスタリンク。
**必要**: ケース名テキスト表示 + `→` リンク + 未設定警告。
**影響**: `CaseSelectSection` の全面書き替え（よりシンプルになるため工数は少ない）。

#### GAP-5: 最終計算日時（Req8）
**Research Needed**: `MonthlyIndirectWorkLoad` の `updatedAt` が最終計算日時として使用可能か、またはバックエンドに別途タイムスタンプ管理が必要か確認が必要。

---

## 3. 実装アプローチ

### Option A: 既存コンポーネントの段階的改修

既存の `useIndirectSimulation` フックとルートファイルを段階的に改修する。

- **改修対象**:
  - `useIndirectSimulation.ts` — ケース選択ステート削除、初期データ取得追加、1ボタン計算統合
  - `routes/indirect/simulation/index.lazy.tsx` — UIを全面改修（計算条件パネル、テーブル、年度チップ）
  - `CalculationResultTable.tsx` — 年度セレクタ→チップ、「直接」行追加
  - `SidebarNav.tsx` — メニュー統合

- **削除対象**:
  - `ResultPanel.tsx`, `MonthlyLoadsMatrix.tsx`, `HeadcountPlanCaseChips.tsx`, `IndirectWorkCaseChips.tsx`
  - `useMonthlyLoadsPage.ts`, `useExcelExport.ts`, `useIndirectWorkLoadExcelExport.ts`, `useIndirectWorkLoadExcelImport.ts`
  - `routes/indirect/monthly-loads/` ディレクトリ

**Trade-offs**:
- ✅ ファイル数が最小（既存ファイルの改修が中心）
- ✅ 既存のクエリ・ミューテーション・計算ロジックをそのまま活用
- ✅ git diffが追いやすい
- ❌ `useIndirectSimulation` が現在350行あり、改修中の整合性維持が複雑
- ❌ `CalculationResultTable` のprops変更が大きい

### Option B: 新規フック＋ルート全面書き直し

新しいフック `useIndirectOverview` と新しいルートコンポーネントを作成し、旧コードを段階的に削除する。

- **新規作成**:
  - `useIndirectOverview.ts` — primaryケース取得 + 保存済みデータ表示 + 1ボタン再計算
  - ルートコンポーネント全面書き直し
  - `FiscalYearChips.tsx` — 年度チップコンポーネント

- **再利用**:
  - `simulation-utils.ts`, `useCapacityCalculation.ts`, `useIndirectWorkCalculation.ts`
  - API クエリ・ミューテーション・クライアント

**Trade-offs**:
- ✅ クリーンな設計でゼロからの最適化が可能
- ✅ 旧コードと並行して開発可能（壊さない）
- ❌ ファイル数が増加（一時的に旧・新が共存）
- ❌ 既存テストの書き直しが必要

### Option C: ハイブリッド（推奨）

`useIndirectSimulation` を簡素化しつつ、ルートコンポーネントと `CalculationResultTable` は既存ファイルを改修する。年度チップのみ新規コンポーネント。

- **改修**:
  - `useIndirectSimulation.ts` — 大幅簡素化（ケース選択ステート・setter・dirty追跡を削除、保存済みデータ取得追加、1ボタン計算関数統合）
  - `routes/indirect/simulation/index.lazy.tsx` — UI全面改修
  - `CalculationResultTable.tsx` — 年度チップ統合、「直接」行追加、条件サマリー削除

- **新規作成**:
  - `FiscalYearChips.tsx`（年度チップコンポーネント、または `CalculationResultTable` 内にインライン）

- **削除**: Option Aと同じ

**Trade-offs**:
- ✅ 既存ファイルの進化的改修でコミット履歴が追いやすい
- ✅ 新規ファイルは最小限（年度チップのみ）
- ✅ API層・計算ロジックは一切変更不要
- ✅ `useIndirectSimulation` が大幅に短くなる（350行→150行程度）
- ❌ 改修の粒度が大きく、一時的にビルドが通らない可能性

---

## 4. 工数・リスク評価

### 工数: M（3〜7日）

**根拠**:
- API層・バックエンド変更は不要
- 既存の計算ロジック・クエリを再利用
- 主な作業はフロントエンドのUI改修とフック簡素化
- 不要コードの削除が多い（追加より削除中心）

### リスク: Medium

**根拠**:
- `useIndirectSimulation` の大幅改修はregressionリスクあり
- 年度チップの「データが存在する年度のみ表示」は年度判定ロジックの追加が必要
- 最終計算日時の取得方法がバックエンドAPI依存（Research Needed）
- 既存テスト（`useIndirectSimulation.test.ts`）の更新が必要

---

## 5. 設計フェーズへの推奨事項

### 推奨アプローチ: Option C（ハイブリッド）
既存ファイルを進化的に改修し、新規ファイルは年度チップコンポーネントのみに抑える。

### 設計フェーズで検討すべき事項

1. **保存済みデータの初期表示**: primaryケース自動選択後、`monthlyIndirectWorkLoads` と `monthlyCapacities` を即座にフェッチして初期表示するデータフロー設計
2. **年度チップのデータソース**: 保存済みデータの `yearMonth` から利用可能年度を動的に抽出するロジック
3. **最終計算日時の取得方法**: 既存APIの `updatedAt` で代替可能か、専用フィールド/エンドポイントが必要か
4. **ルート変更**: `/indirect/simulation` → `/indirect` へのルート変更（リダイレクト処理の要否）
5. **テスト戦略**: 既存テストの改修範囲と新規テストの必要性

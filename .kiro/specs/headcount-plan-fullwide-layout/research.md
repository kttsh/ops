# Research & Design Decisions

## Summary
- **Feature**: `headcount-plan-fullwide-layout`
- **Discovery Scope**: Extension（既存画面のUI刷新）
- **Key Findings**:
  - API/バックエンド変更不要 — `fetchMonthlyHeadcountPlans` は既に全年度データを返却
  - チップセレクターパターンは `IndirectWorkCaseChips` + `BusinessUnitSingleSelector` で確立済み
  - 132セル（11行×12ヶ月）の `<input>` は仮想化不要レベル — DOM要素数は軽微

## Research Log

### チップセレクターパターンの一貫性
- **Context**: ケース選択UIをラジオボタンリストからチップボタンに変更する際、既存パターンとの一貫性を確認
- **Sources Consulted**: `BusinessUnitSingleSelector.tsx`（48行）、`IndirectWorkCaseChips.tsx`（66行）
- **Findings**:
  - 共通スタイル: `flex flex-wrap items-center gap-1.5`、`rounded-lg border px-3 py-1.5 text-sm`
  - 選択状態: `border-primary bg-primary/10 text-primary`
  - 非選択状態: `border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground`
  - Primary バッジ: `IndirectWorkCaseChips` は `<span>` で「主」テキスト表示
- **Implications**: 新規 `HeadcountPlanCaseChips` は同パターンを踏襲し、CRUD操作（編集・削除・復元）とスイッチを追加する拡張版として設計

### 全年度データの状態管理
- **Context**: 現在の `MonthlyHeadcountGrid` は `localData: Record<string, number>` で管理。全年度対応に必要な変更を評価
- **Sources Consulted**: `MonthlyHeadcountGrid.tsx`、`useHeadcountPlansPage.ts`、`headcount-plan-client.ts`
- **Findings**:
  - `fetchMonthlyHeadcountPlans(caseId, businessUnitCode)` は年度フィルタなしで全データ返却
  - `localData` の key は `yearMonth`（例: `202604`）で、既に年度横断管理に対応
  - `bulkUpdateMonthlyHeadcountPlans` は `items` 配列で一括保存 → 全年度に対応
  - dirty追跡は現在 boolean フラグのみ → セル単位の追跡が必要
- **Implications**: `useHeadcountPlansPage` から `fiscalYear` 単一管理を削除し、全年度リスト生成のみ。dirty追跡は `originalData` との差分比較で実装

### テーブルレイアウトとスクロール
- **Context**: 11行×13列のテーブルがフルワイドレイアウトに収まるか評価
- **Findings**:
  - 13列 × 各80px（入力セル幅）+ 100px（年度列）= 約1060px → 一般的なデスクトップ画面（1280px+）では横スクロール不要
  - 年度列の `position: sticky; left: 0` は全モダンブラウザで対応済み
  - 132個の `<input>` 要素は仮想化不要のレベル（TanStack Virtual は数千行以上で検討）
- **Implications**: `overflow-x-auto` でセーフガードしつつ、通常使用では横スクロールなし

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Option B: 新規コンポーネント作成 | `HeadcountPlanCaseChips` + `MonthlyHeadcountTable` を新規作成、旧コンポーネント廃止 | UIパターンの根本的な違いに合致、チップパターンの一貫性 | CRUDロジックの移植が必要 | **採用** |

## Design Decisions

### Decision: セル単位のdirty追跡方式
- **Context**: 全年度テーブルで変更セルを `bg-amber-50` でハイライトするため、セル単位の変更追跡が必要
- **Alternatives Considered**:
  1. `Set<string>` で変更済み yearMonth を追跡 — 手動管理が必要
  2. `originalData: Record<string, number>` を保持し、`localData` との差分比較でdirty判定
- **Selected Approach**: Option 2（originalData との差分比較）
- **Rationale**: API データ取得時に `originalData` を保存し、各セルで `localData[ym] !== originalData[ym]` を比較するだけで判定可能。Set の手動管理（追加・削除）より宣言的で、一括入力時にも自然に動作する
- **Trade-offs**: レンダリング時に比較演算が走るが、132セルでは無視できるコスト
- **Follow-up**: 保存成功時に `originalData` を `localData` のスナップショットで更新

### Decision: 全年度データの状態管理リフト
- **Context**: 現在 `MonthlyHeadcountGrid` 内部で管理している `localData` を、全年度対応のためにフック層にリフトアップ
- **Selected Approach**: `useHeadcountPlansPage` フックで `localData` と `originalData` を一元管理
- **Rationale**: テーブルコンポーネントはプレゼンテーション層に集中し、状態管理はフック層が担当。`BulkInputDialog` からの一括入力もフック経由で反映
- **Trade-offs**: フックの責務が増えるが、データフローが単方向化され見通しが良くなる

## Risks & Mitigations
- **CRUDロジック移植漏れ**: `HeadcountPlanCaseList` から削除確認ダイアログ・復元操作を `HeadcountPlanCaseChips` に移植する際の漏れ → テスト項目で網羅
- **旧コンポーネント削除忘れ**: 廃止対象の `HeadcountPlanCaseList` と `MonthlyHeadcountGrid` の index.ts からのエクスポート削除漏れ → タスクで明示

# Research & Design Decisions

## Summary
- **Feature**: `indirect-monthly-loads-view`
- **Discovery Scope**: Extension（既存 feature の拡張）
- **Key Findings**:
  - 既存の `features/indirect-case-study/` に API クライアント・mutation・型・Query Key がすべて揃っており、新規 API 実装は不要
  - `IndirectWorkRatioMatrix` にカスタムキーボードナビゲーションは未実装（ブラウザ標準 Tab のみ）。マトリクスセル間の Tab/Enter 移動は新規実装が必要
  - `IndirectWorkCaseList` は CRUD 操作（作成・編集・削除・復元）を内包しており、チップ形式の選択 UI には過剰。軽量な新規コンポーネントが適切

## Research Log

### IndirectWorkCaseList の再利用可否
- **Context**: 要件 1.2 でケースをチップ形式で表示する必要がある
- **Sources Consulted**: `IndirectWorkCaseList.tsx` のコード調査
- **Findings**:
  - 現在の props: `items, selectedId, onSelect, businessUnitCode, isLoading, includeDisabled, onIncludeDisabledChange`
  - CRUD 操作（CaseFormSheet, AlertDialog）を内包している
  - ラジオボタン + リスト形式の UI
- **Implications**: チップ形式には過剰。データ取得（`indirectWorkCasesQueryOptions`）は再利用し、UI は新規の `IndirectWorkCaseChips` コンポーネントとして作成する

### キーボードナビゲーション実装方式
- **Context**: 要件 5.4 で Tab/Enter によるセル間移動が必要
- **Sources Consulted**: `IndirectWorkRatioMatrix.tsx`、HTML input の標準挙動
- **Findings**:
  - 既存の RatioMatrix には `onKeyDown` ハンドラなし
  - Tab: ブラウザ標準でフォーカス移動（DOM 順 = 行方向）
  - Enter: 標準挙動なし（form 外の input）
- **Implications**: 各 Input に `onKeyDown` ハンドラを追加し、Tab で右隣セル、Enter で下セルにフォーカスを移す。`data-row` / `data-col` 属性でグリッド座標を管理し、`querySelector` でターゲットセルを特定する

### マトリクスのローカル状態設計
- **Context**: 60セル（5年度×12ヶ月）の編集状態を効率的に管理する必要がある
- **Sources Consulted**: `IndirectWorkRatioMatrix.tsx` の `localData` パターン
- **Findings**:
  - RatioMatrix: `Record<string, number>`（キー: `${fiscalYear}-${workTypeCode}`）
  - `useEffect` で API データから初期化、`handleChange` で個別更新
- **Implications**: 同パターンを踏襲。キー: `yearMonth`（YYYYMM 形式）、値: `number`（manhour）。初期ソースマップ `Record<string, "calculated" | "manual">` を別途保持し、calculated → manual への変更追跡に使用

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A: 既存 feature 拡張 | `indirect-case-study/` にコンポーネント・hook を追加 | API/mutation/型の完全再利用、features 間依存なし | feature がやや肥大化 | 推奨 |
| B: 新規 feature | `indirect-monthly-loads/` を新規作成 | 責務分離 | API/型の複製、Query Key の分断、features 間依存禁止ルールに抵触 | 非推奨 |

## Design Decisions

### Decision: マトリクス形式のデータ表示
- **Context**: 5年度分（60ヶ月）のデータを一覧性高く表示する
- **Alternatives Considered**:
  1. 縦リスト（1行=1ヶ月）— 60行で一覧性が低い
  2. マトリクス（行=年度、列=月）— 5行×12列+合計で一画面に収まる
- **Selected Approach**: マトリクス形式
- **Rationale**: `IndirectWorkRatioMatrix` と同じ年度×項目のマトリクスパターンが確立済み。5行×13列（12ヶ月+合計）は画面に収まり一覧性が高い
- **Trade-offs**: 年度数が可変の場合の対応が必要（5年度固定で対応）

### Decision: ケースセレクタをチップ形式に
- **Context**: BU あたり最大10件程度のケースを素早く切り替えたい
- **Alternatives Considered**:
  1. `IndirectWorkCaseList` 再利用 — CRUD 操作が過剰
  2. ドロップダウン — 1クリック追加で切替が遅い
  3. チップ（ボタン群） — BU セレクタと統一パターン
- **Selected Approach**: チップ形式の新規コンポーネント
- **Rationale**: BU セレクタと同じ UI パターンで統一感があり、1クリックで切替可能

### Decision: calculated 上書き警告の粒度
- **Context**: `source: 'calculated'` のセルを編集する際に警告を表示する
- **Alternatives Considered**:
  1. セル編集ごとに AlertDialog — 連続編集時にストレスが高い
  2. 初回の calculated セル編集時のみ AlertDialog（セッション単位）— バランスが良い
  3. 警告なし — リスクが高い
- **Selected Approach**: ケース選択後、初回の calculated セル編集時のみ AlertDialog を表示。同じケース内での2回目以降はダイアログなし
- **Rationale**: 連続編集のストレスを低減しつつ、誤操作防止を担保

## Risks & Mitigations
- **60セルの再レンダリング性能** — `React.memo` と `useCallback` で個別セルのメモ化。実測で問題なければ最適化不要（60セルは軽量）
- **年度範囲の決定** — API 取得データから年度を抽出し、5年度分を表示。データが5年度未満の場合は存在する年度のみ表示

## References
- `IndirectWorkRatioMatrix.tsx` — マトリクス + インライン編集パターンの参照実装
- `useIndirectWorkCasesPage.ts` — ページレベル hook のパターン参照
- `useUnsavedChanges.ts` — useBlocker ベースの未保存警告パターン

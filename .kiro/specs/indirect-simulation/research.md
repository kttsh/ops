# Research & Design Decisions

## Summary
- **Feature**: `indirect-simulation`
- **Discovery Scope**: Extension（既存システムの拡張）
- **Key Findings**:
  - 計算フック・クエリ・Excelフック・`CalculationResultTable` はすべてそのまま再利用可能
  - `useIndirectCaseStudyPage`（296行）は CRUD・dirty tracking が密結合しており、シミュレーション用に軽量版フックの新規作成が必要
  - `ResultPanel` はほぼそのまま利用可能。`indirectWorkResultDirty` はフック側で計算完了時 `true` / 保存成功時 `false` として管理する

## Research Log

### useIndirectCaseStudyPage の分離可能性
- **Context**: シミュレーション専用フックの設計にあたり、既存フックの構造を分析
- **Findings**:
  - 返却値の約40%がCRUD/dirty tracking関連（`saveHeadcountPlans`, `saveRatios`, `headcountDirty`, `ratioDirty`, `setHeadcountLocalData`, `setRatioLocalData`, `includeDisabled*`）
  - シミュレーションに必要なのは: 選択状態、クエリ結果（一覧）、計算アクション、計算結果、結果保存のみ
  - 内部で `useCapacityCalculation` と `useIndirectWorkCalculation` を使用しており、これらは独立して利用可能
- **Implications**: 既存フックを修正せず、新規 `useIndirectSimulation` フックで必要な部分のみ再構成する

### ResultPanel の再利用範囲
- **Context**: ResultPanel（313行）をそのまま使えるか調査
- **Findings**:
  - Props 17個のうち、`indirectWorkResultDirty`（dirty tracking）は CRUD 画面固有のロジック
  - ただし `onSaveIndirectWorkLoads` と `isSavingResults` はシミュレーション画面でも保存機能として必要
  - ResultPanel 内部で ExcelImportDialog、useExcelExport、useIndirectWorkLoadExcelExport、useIndirectWorkLoadExcelImport をすべて統合
- **Implications**: ResultPanel はシミュレーション画面でもほぼそのまま利用可能。`indirectWorkResultDirty` は常に `true`（計算直後は常に未保存）として渡せば問題ない

### BU選択パターン
- **Context**: BU選択の実装方式を決定
- **Findings**:
  - `indirect-capacity-settings` では URL Search Params（`?bu=`）で管理、単一BU選択
  - `businessUnitsQueryOptions()` で全BU一覧取得、Select コンポーネントで選択
  - BU未指定時は先頭BUを自動選択
- **Implications**: 同一パターンを踏襲。Search Params による BU 管理は画面リロード時の状態維持にも有効

### SidebarNav 構成
- **Context**: ナビゲーションリンクの追加場所を決定
- **Findings**:
  - 既存「案件・間接作業管理」セクションに「間接作業・キャパシティ」（マスタCRUD画面）が存在
  - シミュレーション画面はマスタ管理ではなく分析・シミュレーション用途
- **Implications**: 「案件・間接作業管理」セクションにシミュレーションリンクを追加。マスタ画面と並列配置が自然

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A: 既存拡張 | `ResultPanel` に mode props 追加 | ファイル数最小 | 既存コンポーネント複雑化 | ResultPanel の責務肥大 |
| B: 新規 feature | `features/indirect-simulation/` 新規作成 | 責務分離明確 | features 間依存が発生 | CLAUDE.md 規約に抵触 |
| **C: ハイブリッド** | **フックのみ追加、ページで直接組み立て** | **再利用最大化、既存非破壊** | **index.ts エクスポート増加** | **採用** |

## Design Decisions

### Decision: ResultPanel の再利用方針
- **Context**: ResultPanel をそのまま使うか、ページ側で UI を組み立てるか
- **Alternatives Considered**:
  1. ResultPanel をそのまま利用 — `indirectWorkResultDirty` を常に `true` で渡す
  2. ページ側で CalculationResultTable + アクションボタンを直接配置
- **Selected Approach**: Option 1（ResultPanel をそのまま利用）
- **Rationale**: ResultPanel は Excel エクスポート・インポート・保存のすべてを統合済み。props の差分は `indirectWorkResultDirty` を `true` 固定で渡すだけで解消可能。ページ側でのUI再構成は ResultPanel 内部のロジック（3つの Excel フック利用）を重複させることになる
- **Trade-offs**: ResultPanel の内部実装への依存が強まるが、同一 feature 内なので問題ない

### Decision: useIndirectSimulation フックの責務範囲
- **Context**: 既存 `useIndirectCaseStudyPage` と新規フックの責務分離
- **Selected Approach**: 新規フックは選択・クエリ・計算・結果管理のみを担当
- **Rationale**: CRUD（ケース作成/編集/削除）、dirty tracking（人員数・比率のローカル編集状態）、includeDisabled（論理削除の表示切替）はシミュレーション画面に不要
- **Trade-offs**: 一部のクエリ呼び出しが `useIndirectCaseStudyPage` と重複するが、TanStack Query のキャッシュにより実際のAPI呼び出しは共有される

## Risks & Mitigations
- **ResultPanel の props 変更リスク**: ResultPanel の props が変更された場合、シミュレーション画面も影響を受ける → 同一 feature 内のため変更時に両画面を確認すればよい
- **計算フローの順序依存**: キャパシティ計算 → 間接作業計算の順序を守る必要がある → フック内で canCalculateIndirectWork の条件を明確に定義

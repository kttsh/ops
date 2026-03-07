# Research & Design Decisions

## Summary
- **Feature**: `indirect-settings-deprecation`
- **Discovery Scope**: Extension（既存システムのリファクタリング）
- **Key Findings**:
  - `ResultPanel` はシミュレーション画面（`/indirect/simulation`）で使用中のため削除不可
  - `useIndirectCaseStudyPage` と `SettingsPanel` は旧ルートのみが参照しており安全に削除可能
  - `AppShell.tsx` に旧ルートのパス条件が残っており修正が必要

## Research Log

### 未参照コードの特定
- **Context**: 要件 3 に基づき、`indirect-case-study` feature 内の削除候補を調査
- **Sources Consulted**: `grep` によるコードベース全体の参照検索
- **Findings**:
  - `useIndirectCaseStudyPage`: 旧ルート `index.lazy.tsx` のみが参照。削除安全
  - `SettingsPanel`: 旧ルート `index.lazy.tsx` のみが参照。削除安全
  - `SettingsPanel.stories.tsx`: `SettingsPanel` のストーリーファイル。本体と共に削除
  - `ResultPanel`: 旧ルートに加え `/indirect/simulation/index.lazy.tsx` が参照。**削除不可**
  - `useCapacityCalculation`, `useIndirectWorkCalculation`: `useIndirectSimulation.ts` 等が参照。削除不可
  - `useExcelExport`: `ResultPanel.tsx` が参照。削除不可
- **Implications**: 要件 3 の AC3（ResultPanel 削除条件）は「参照されている」ため不発動

### SidebarNav 構成変更
- **Context**: 現状の2カテゴリ構成を4カテゴリに分割
- **Sources Consulted**: `SidebarNav.tsx` の `menuItems` 定義
- **Findings**:
  - 現在は「ダッシュボード」「案件・間接作業管理」「マスタ管理」の3カテゴリ
  - 「案件・間接作業管理」を「案件管理」と「間接作業管理」に分割
  - マスタ管理系項目（人員計画ケース、キャパシティシナリオ、間接作業ケース）を「マスタ管理」に移動
  - 旧「間接作業・キャパシティ」項目を削除
- **Implications**: `menuItems` 配列の再構成のみで対応可能。コンポーネント構造の変更は不要

### AppShell.tsx パス条件
- **Context**: レイアウトのスタイル適用にパス条件が使用されている
- **Sources Consulted**: `AppShell.tsx` L82-90
- **Findings**:
  - `indirect-capacity-settings` パスが `h-full` クラスの条件に含まれている
  - 削除後も他のパス条件（`/workload`, `/master/headcount-plans` 等）でカバーされる
- **Implications**: 該当行の削除のみで対応

## Design Decisions

### Decision: ResultPanel の存続
- **Context**: 要件 3 では SettingsPanel / ResultPanel / useIndirectCaseStudyPage の削除を検討
- **Alternatives Considered**:
  1. 全て削除 — シミュレーション画面が壊れる
  2. 参照有無で判断 — 要件の条件分岐に従う
- **Selected Approach**: 参照有無で判断し、ResultPanel は存続
- **Rationale**: EARS の If 条件「参照されていない場合」が不成立のため、要件に準拠した判断
- **Trade-offs**: コードベースに ResultPanel が残るが、シミュレーション画面の機能を維持
- **Follow-up**: なし

### Decision: SidebarNav のカテゴリ再構成方式
- **Context**: menuItems 配列を直接編集するか、設定ファイルに外出しするか
- **Alternatives Considered**:
  1. menuItems 配列を直接編集 — 現状のパターンを踏襲
  2. 設定ファイルに外出し — 将来の変更に柔軟
- **Selected Approach**: menuItems 配列を直接編集
- **Rationale**: 既存パターンの踏襲。メニュー構成は安定しており、外出しの複雑さは不要
- **Trade-offs**: シンプルだが、将来のメニュー変更時は直接コード変更が必要

## Risks & Mitigations
- `routeTree.gen.ts` の再生成失敗 — `pnpm dev` 実行で自動再生成を確認
- 未検出の参照残存 — TypeScript コンパイルで検出可能
- SidebarNav の遷移先ルート未存在 — 全メニュー項目の手動遷移テストで確認

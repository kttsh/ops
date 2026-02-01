# Research & Design Decisions

## Summary
- **Feature**: `case-tab-project-settings-sync`
- **Discovery Scope**: Extension（既存コンポーネントの拡張）
- **Key Findings**:
  - `SidePanelSettings` は `selectedProjectIds` を受け取っておらず、`projectsQueryOptions` で全案件を取得して `projOrder` を初期化している
  - `WorkloadPage` は既に `selectedProjectIds` を state 管理しており、`SidePanelProjects` には渡しているが `SidePanelSettings` には渡していない
  - 変更は2ファイルのみで完結し、新規ライブラリやパターンは不要

## Research Log

### selectedProjectIds のデータフロー
- **Context**: 案件タブの選択状態がどのように管理・伝播されているかの調査
- **Sources Consulted**: `routes/workload/index.tsx`, `SidePanelProjects.tsx`, `SidePanelSettings.tsx`
- **Findings**:
  - `WorkloadPage`（L50-61）で `useState<Set<number>>` として管理
  - `useEffect` で `allProjectIds` 変更時に全選択にリセット
  - `SidePanelProjects` には `selectedProjectIds` と `onSelectionChange` を渡している
  - `SidePanelSettings` には渡されていない
- **Implications**: 既存の props パターンを踏襲して `selectedProjectIds` を追加するだけで済む

### projOrder 初期化ロジックの問題
- **Context**: 設定タブが常に全案件を表示する根本原因の調査
- **Sources Consulted**: `SidePanelSettings.tsx` L88-99
- **Findings**:
  - `projects.length > 0 && projOrder.length === 0` の条件で全案件を初期化
  - この条件では `selectedProjectIds` の変更に追従できない
  - 色設定も同タイミングで全案件分を生成
- **Implications**: `useEffect` を使って `selectedProjectIds` の変更に対する差分更新ロジックが必要

### プロファイル適用時の挙動
- **Context**: プロファイル適用が `selectedProjectIds` フィルタリングと整合するかの確認
- **Sources Consulted**: `SidePanelSettings.tsx` L165-207
- **Findings**:
  - `handleProfileApply` は `profile.projectItems` から `projOrder` と `projColors` を復元
  - プロファイルに含まれる案件が `selectedProjectIds` に含まれない可能性がある
  - 安全のため、プロファイル適用時も `selectedProjectIds` でフィルタする必要がある
- **Implications**: プロファイル適用ロジック内でも `selectedProjectIds` のフィルタリングを適用する

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Props 追加 | `SidePanelSettingsProps` に `selectedProjectIds` を追加し、内部でフィルタ | 最小変更、既存パターン踏襲 | 初期化ロジックの複雑化 | **採用** |
| カスタムフック抽出 | フィルタリング・色・並び順をフックに分離 | 関心の分離 | 修正規模に対して過剰 | 不採用 |

## Design Decisions

### Decision: props 追加によるフィルタリング
- **Context**: `SidePanelSettings` が選択中の案件のみを表示する必要がある
- **Alternatives Considered**:
  1. Props 追加 — `selectedProjectIds: Set<number>` を渡し、コンポーネント内でフィルタ
  2. カスタムフック — `useFilteredProjects` を新設し、フィルタリングロジックを分離
  3. Context API — 選択状態を Context で共有
- **Selected Approach**: Props 追加（Option 1）
- **Rationale**: 変更箇所が2ファイルのみで完結。既存の `SidePanelProjects` と同じ props パターンを踏襲。Context は現時点では過剰。
- **Trade-offs**: コンポーネント内のロジックがやや増えるが、管理可能な範囲
- **Follow-up**: `projOrder` の差分更新ロジックが正しく動作するかの手動テスト

### Decision: projOrder の差分更新戦略
- **Context**: `selectedProjectIds` が変更された際、`projOrder` と `projColors` をどう同期するか
- **Alternatives Considered**:
  1. 毎回リセット — 選択変更のたびに `projOrder` を再構築
  2. 差分更新 — 追加は末尾に、削除は除外、既存順序維持
- **Selected Approach**: 差分更新（Option 2）
- **Rationale**: ユーザーが手動で並び替えた順序を保持するため、リセットはUXが悪い
- **Trade-offs**: ロジックがやや複雑になるが、`useEffect` で実現可能
- **Follow-up**: 色設定は既存の色を保持し、新規追加時のみデフォルト色を割り当てる

## Risks & Mitigations
- `projOrder` の差分更新でレンダリングが無限ループする可能性 — `useEffect` の依存配列を適切に設定し、不要な更新を防止
- プロファイル適用時に選択外の案件が含まれる可能性 — プロファイル復元時に `selectedProjectIds` でフィルタ

## References
- GitHub Issue #27 — 案件タブの選択が設定タブの案件設定に連動していない

# Research & Design Decisions

## Summary
- **Feature**: `master-management-screens`
- **Discovery Scope**: Extension
- **Key Findings**:
  - 再利用対象の5コンポーネントは `indirect-case-study/index.ts` から未エクスポート（内部コンポーネント扱い）
  - `useIndirectCaseStudyPage` は3ドメインの状態を一括管理（40+プロパティ）、分離が必要
  - キャパシティシナリオの月別労働時間詳細表示用コンポーネントは未存在だが `fetchMonthlyCapacities` API は既存

## Research Log

### コンポーネントエクスポート状況
- **Context**: 新画面から既存コンポーネントを利用可能か確認
- **Sources Consulted**: `apps/frontend/src/features/indirect-case-study/index.ts`
- **Findings**:
  - エクスポート済み: `SettingsPanel`, `ResultPanel`, `CalculationResultTable`, `CaseFormSheet`, `ScenarioFormSheet`
  - 未エクスポート: `HeadcountPlanCaseList`, `MonthlyHeadcountGrid`, `CapacityScenarioList`, `IndirectWorkCaseList`, `IndirectWorkRatioMatrix`, `BulkInputDialog`
  - ミューテーション・クエリオプション・型は全てエクスポート済み
- **Implications**: `index.ts` にエクスポートを追加するだけで再利用可能。コンポーネント移動は不要

### コンポーネントの自己完結性
- **Context**: 各コンポーネントが親からどの程度のサポートを必要とするか
- **Findings**:
  - CRUD リスト3種: データ（items）と選択状態を props で受け取り、ミューテーションは内部で完結
  - `MonthlyHeadcountGrid`: `caseId + buCode + fiscalYear` で自身がクエリ実行。編集値は `onLocalDataChange` で親に通知、保存は親が担当
  - `IndirectWorkRatioMatrix`: `caseId` で自身がクエリ実行。同様に編集値を親に通知、保存は親が担当
- **Implications**: 各ページフックは選択状態・dirty 管理・保存ロジックのみで済む

### AppShell レイアウト条件
- **Context**: 新ルートのレイアウト適用を確認
- **Findings**:
  - `/master/*` は `h-full px-6 py-8` レイアウト適用（padding あり）
  - `/master/indirect-capacity-settings` と `/workload` は `h-full`（padding なし、フルスクリーン）
  - 新画面は2カラムレイアウトを使用するため、`h-full`（padding なし）が適切
- **Implications**: `AppShell.tsx` の条件分岐に新ルートパスを追加する必要あり

### BU セレクタパターン
- **Context**: BU 依存の画面で BU 選択をどう実装するか
- **Findings**:
  - 既存パターン: URL search params (`?bu=XXX`) + `businessUnitsQueryOptions()` でBUリスト取得
  - BU 未指定時は先頭 BU を自動選択
  - `CapacityScenarioList` は BU 非依存（グローバルマスタ）
- **Implications**: 人員計画・間接作業画面は BU セレクタ必要、キャパシティシナリオ画面は不要

### キャパシティシナリオ詳細表示
- **Context**: Req 2.3「月別労働時間の詳細情報を表示」の実現手段
- **Findings**:
  - `fetchMonthlyCapacities(scenarioId, buCode?)` API は既存
  - `monthlyCapacitiesQueryOptions` クエリオプションも既存
  - `MonthlyCapacity` 型: `{ monthlyCapacityId, capacityScenarioId, businessUnitCode, yearMonth, capacity }`
  - 表示用コンポーネントは未存在（既存の `CalculationResultTable` は計算結果表示用で目的が異なる）
- **Implications**: 月別キャパシティを一覧表示する読み取り専用テーブルコンポーネントを新規作成

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A: feature 内ルート追加 | 新ルートから indirect-case-study を直接インポート | 最小限の変更 | feature 境界が曖昧 | 短期的には有効 |
| B: 3 feature に分離 | 各ドメインを独立 feature に抽出 | 明確な境界 | 大規模リファクタ、既存画面への影響 | 長期的には理想 |
| **C: ハイブリッド** | エクスポート追加 + 新ルート + 軽量フック | バランス良い | feature の肥大化 | **採用** |

## Design Decisions

### Decision: ハイブリッドアプローチ（Option C）の採用
- **Context**: 既存コンポーネントを3つの新画面で再利用する方法
- **Alternatives Considered**:
  1. Option A — feature 境界を無視して直接インポート
  2. Option B — 3つの独立 feature に完全分離
- **Selected Approach**: コンポーネントは `indirect-case-study` に残しエクスポートを追加。各ページは専用の軽量フックを使用
- **Rationale**: 既存画面（`indirect-capacity-settings`）を壊さず、最小限の変更で新画面を追加可能
- **Trade-offs**: feature が肥大化するリスクがあるが、将来的な分離は段階的に行える
- **Follow-up**: feature 分離は別 issue で対応可能

### Decision: ページ単位の軽量フック
- **Context**: `useIndirectCaseStudyPage`（40+プロパティ）を新画面でどう扱うか
- **Selected Approach**: 各画面に専用フック（`useHeadcountPlansPage`, `useCapacityScenariosPage`, `useIndirectWorkCasesPage`）を作成
- **Rationale**: 各画面は1ドメインのみを扱うため、既存フックの1/3程度の責務で十分
- **Trade-offs**: フック数は増えるが、各フックの責務が明確でテストしやすい

### Decision: AppShell レイアウト条件の更新
- **Context**: 新画面のレイアウトをどう制御するか
- **Selected Approach**: `AppShell.tsx` の条件分岐に新ルートパスを追加し `h-full`（padding なし）を適用
- **Rationale**: 2カラムレイアウトの新画面は `indirect-capacity-settings` と同じフルスクリーンレイアウトが適切

## Risks & Mitigations
- **feature 肥大化**: 新フック3つ追加で `indirect-case-study` が大きくなる → 将来的な feature 分離を別 issue で計画
- **既存画面のリグレッション**: コンポーネントエクスポート追加は後方互換 → 既存テストで検証
- **月別キャパシティ表示の仕様不確定**: 読み取り専用テーブルとして最小限の実装 → ユーザーフィードバックで拡張

## References
- `apps/frontend/src/features/indirect-case-study/` — 既存 feature 構造
- `apps/frontend/src/routes/master/indirect-capacity-settings/` — 既存ルートパターン
- `apps/frontend/src/components/layout/AppShell.tsx` — レイアウト条件分岐
- `apps/frontend/src/components/layout/SidebarNav.tsx` — メニュー構造

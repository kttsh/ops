# Research & Design Decisions

---
**Purpose**: ディスカバリフェーズの調査結果、アーキテクチャ検討、設計判断の根拠を記録する。
---

## Summary
- **Feature**: `capacity-scenario-params`
- **Discovery Scope**: Extension（既存システムの拡張）
- **Key Findings**:
  - 既存の `capacity_scenarios` CRUD は標準的なレイヤードパターン（routes → services → data → transform → types）に従っており、`hoursPerPerson` フィールドの追加は各レイヤーへの最小限の変更で実現可能
  - `monthly_capacity` の `bulkUpsert` メソッドが既に SQL MERGE ベースの一括 upsert をサポートしており、自動計算結果の格納にそのまま活用できる
  - `monthly_headcount_plan` の `findAll` は `headcountPlanCaseId` と任意の `businessUnitCode` でフィルタリング可能だが、年月範囲でのフィルタリングは未実装のため、自動計算エンドポイント用に新規クエリが必要

## Research Log

### 既存 capacity_scenarios エンティティの構造

- **Context**: `hoursPerPerson` フィールド追加の影響範囲を特定するため
- **Sources Consulted**: `apps/backend/src/types/capacityScenario.ts`, `data/capacityScenarioData.ts`, `services/capacityScenarioService.ts`, `routes/capacityScenarios.ts`, `transform/capacityScenarioTransform.ts`
- **Findings**:
  - DB Row 型 `CapacityScenarioRow` に `hours_per_person` を追加し、API 型 `CapacityScenario` に `hoursPerPerson` を追加する
  - Zod スキーマ `createCapacityScenarioSchema` に `hoursPerPerson` を optional（デフォルト 160.00）で追加
  - Zod スキーマ `updateCapacityScenarioSchema` に `hoursPerPerson` を optional で追加
  - Data 層の INSERT/UPDATE SQL に `hours_per_person` カラムを追加
  - Transform 層 `toCapacityScenarioResponse` に `hoursPerPerson` マッピングを追加
- **Implications**: 各レイヤーで 1〜数行の追加で完結し、既存のインターフェースを破壊しない

### 自動計算に必要な月別人員計画データの取得

- **Context**: 自動計算エンドポイント `POST /actions/calculate` が人員計画データを取得する方法を決定するため
- **Sources Consulted**: `apps/backend/src/data/monthlyHeadcountPlanData.ts`, `types/monthlyHeadcountPlan.ts`
- **Findings**:
  - 既存の `findAll(headcountPlanCaseId, businessUnitCode?)` は年月範囲フィルタリングをサポートしていない
  - 自動計算では `headcountPlanCaseId` + 任意の `businessUnitCodes[]`（複数）+ 任意の `yearMonthFrom/To` でフィルタリングが必要
  - 新規クエリメソッド `findForCalculation` を `monthlyHeadcountPlanData` に追加するのが適切
- **Implications**: Data 層に新規メソッドを追加。Service 層の自動計算ロジックから呼び出す

### 既存 bulkUpsert の活用可能性

- **Context**: 自動計算結果を `monthly_capacity` に格納する際に既存の `bulkUpsert` を活用できるか確認
- **Sources Consulted**: `apps/backend/src/data/monthlyCapacityData.ts`
- **Findings**:
  - `monthlyCapacityData.bulkUpsert(capacityScenarioId, items[])` が SQL MERGE でトランザクション内の upsert を実行
  - items の型は `Array<{ businessUnitCode, yearMonth, capacity }>` で、計算結果をそのまま渡せる
  - ただし、現在の実装はリクエストから直接受け取った items を処理するため、大量データ時のバッチ分割は考慮されていない
- **Implications**: 既存の `bulkUpsert` をそのまま利用可能。計算結果を `items` 配列に変換して渡す

### ルート登録パターン

- **Context**: 新規 actions エンドポイントのルーティング定義方法を決定するため
- **Sources Consulted**: `apps/backend/src/index.ts`, `routes/capacityScenarios.ts`
- **Findings**:
  - 既存の `capacityScenarios` ルートに `POST /:id/actions/restore` が定義されている
  - 同じパターンで `POST /:id/actions/calculate` を追加可能
  - ルートは `capacityScenarios.ts` 内に定義し、`index.ts` の変更は不要
- **Implications**: 既存パターンに完全に従える

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 既存レイヤード拡張 | routes → services → data の各レイヤーに hoursPerPerson を追加、calculate アクションを同じパターンで追加 | 既存パターンとの一貫性、最小限の変更、レビュー容易 | 特になし | 採用 |
| 別サービス分離 | calculateCapacity を独立した service として切り出す | 関心の分離 | 過剰設計、1メソッドのために新ファイルは不要 | 不採用 |

## Design Decisions

### Decision: hoursPerPerson の配置場所

- **Context**: 労働時間パラメータをどのエンティティに持たせるか
- **Alternatives Considered**:
  1. `capacity_scenarios` テーブルにカラム追加（シナリオ単位の固定値）
  2. 新テーブル `monthly_working_hours` で月別管理
- **Selected Approach**: `capacity_scenarios` テーブルにカラム追加
- **Rationale**: シナリオは「労働時間の前提条件パターン」を表現するエンティティであり、`hours_per_person` はシナリオの本質的属性。月別変動は現時点で不要
- **Trade-offs**: 月ごとの労働時間変動（祝日月など）には対応不可だが、現要件では不要
- **Follow-up**: 将来的に月別管理が必要になった場合は別テーブルを追加

### Decision: 自動計算ロジックの配置

- **Context**: 計算ロジック（headcount × hoursPerPerson）をどこに実装するか
- **Alternatives Considered**:
  1. `capacityScenarioService` に `calculate` メソッドを追加
  2. 新規 `capacityCalculationService` を作成
- **Selected Approach**: `capacityScenarioService` に `calculate` メソッドを追加
- **Rationale**: 計算はシナリオの `hoursPerPerson` を起点とする操作であり、シナリオサービスの責務範囲内。独立サービスにするほどの複雑性はない
- **Trade-offs**: サービスファイルがやや大きくなるが、許容範囲
- **Follow-up**: なし

### Decision: 人員計画データの取得方法

- **Context**: 自動計算で必要な headcount データをどのように取得するか
- **Alternatives Considered**:
  1. `monthlyHeadcountPlanData` に新規クエリメソッドを追加
  2. 既存の `findAll` を使い、アプリケーション側でフィルタリング
- **Selected Approach**: `monthlyHeadcountPlanData` に `findForCalculation` メソッドを追加
- **Rationale**: 年月範囲フィルタリングを SQL で行うことで効率的。複数 BU のフィルタリングも SQL の `IN` 句で処理
- **Trade-offs**: Data 層に新規メソッドが増えるが、クエリの責務は Data 層にあるべき
- **Follow-up**: なし

## Risks & Mitigations

- **大量データ計算時のパフォーマンス** — 計算対象が多い場合（全 BU × 数年分）でも、SQL MERGE のバッチ処理でトランザクション内に収まる。既存の `bulkUpsert` パターンを踏襲
- **後方互換性** — `hoursPerPerson` を Zod スキーマで `optional().default(160.00)` とすることで、フィールドなしのリクエストも正常処理
- **手動入力との競合** — 後勝ちルール（上書き）で対応。自動計算は明示的操作のみで発動し、シナリオ更新時に自動再計算は行わない

## References

- `docs/requirements/capacity-scenario-params-spec.md` — 変更仕様書（本機能の詳細要件）
- `docs/rules/hono/crud-guide.md` — Hono CRUD API 実装パターン
- `docs/rules/api-response.md` — API レスポンス規約（RFC 9457）

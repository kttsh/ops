# Design Document: work-types-display-order

## Overview

**Purpose**: ワークロード画面のコントロールパネル > 間接作業タブで、チャートの間接作業積み上げ順を上下ボタンで入れ替える機能の検証・補完。

**Users**: 業務ユーザーがチャートの層別順を業務上の優先度に合わせて並べ替える。

**Impact**: 既存の `SidePanelIndirect` コンポーネントの↑↓ボタン機能に対し、保存済み順序のページ初期化時ロードと API 失敗時のロールバック処理を補完する。

### Goals

- 保存済み積み上げ順がページリロード後も維持されること
- API 失敗時に UI が操作前の状態にロールバックされること
- 間接作業 Area が案件 Area の下部に固定される制約が維持されること

### Non-Goals

- マスタ管理画面（`/master/work-types`）での表示順入れ替え
- `work_types.display_order` の変更（チャート順序は `chart_stack_order_settings` で管理）
- ドラッグ＆ドロップによる並べ替え
- 案件の積み上げ順の変更（別機能）

## Architecture

### Existing Architecture Analysis

既存実装の状態：

| 機能 | 状態 | 詳細 |
|------|------|------|
| ↑↓ボタン UI | ✅ 実装済み | `SidePanelIndirect.tsx` — `ArrowUp`/`ArrowDown` ボタン |
| 先頭/末尾の無効化 | ✅ 実装済み | `disabled={index === 0}` / `disabled={index === items.length - 1}` |
| moveUp/moveDown ロジック | ✅ 実装済み | 隣接要素スワップ + displayOrder 再計算 |
| 即時保存 | ✅ 実装済み | `useBulkUpsertStackOrderSettings()` |
| 間接 Area の下部固定 | ✅ 保証済み | `sortAreasByIndirectOrder()` が `[...indirect, ...projects]` を返す |
| 保存済み順序のロード | ❌ 未実装 | `indirectOrder` が空配列で初期化、API からロードされない |
| 失敗時ロールバック | ❌ 未実装 | `onError` ハンドラなし |

### Architecture Pattern & Boundary Map

**Selected pattern**: 既存コンポーネントの拡張（新規コンポーネント不要）

**Existing patterns preserved**:
- TanStack Query による data fetching + cache invalidation
- `chart_stack_order_settings` テーブルによる積み上げ順管理
- `useChartData` フック内の `sortAreasByIndirectOrder()` による順序保証

### Technology Stack

| Layer | Choice / Version | Role in Feature | Notes |
|-------|------------------|-----------------|-------|
| Frontend | React 19 + TanStack Query | 順序ロード・保存・キャッシュ管理 | 既存 |
| Frontend | Recharts | チャート Area 積み上げ描画 | 既存 |
| Backend | Hono v4 | `GET/PUT /chart-stack-order-settings` | 既存 API を利用 |
| Data | SQL Server `chart_stack_order_settings` | 積み上げ順の永続化 | 既存テーブル |

## Requirements Traceability

| Requirement | Summary | Components | Interfaces | Flows |
|-------------|---------|------------|------------|-------|
| 1.1 | ↑↓ボタン表示 | SidePanelIndirect | — | — |
| 1.2 | 上移動で入れ替え | SidePanelIndirect | — | — |
| 1.3 | 下移動で入れ替え | SidePanelIndirect | — | — |
| 1.4 | 先頭で上ボタン無効化 | SidePanelIndirect | — | — |
| 1.5 | 末尾で下ボタン無効化 | SidePanelIndirect | — | — |
| 2.1 | 即座に保存 | SidePanelIndirect, useBulkUpsertStackOrderSettings | PUT /chart-stack-order-settings/bulk | 保存フロー |
| 2.2 | 失敗時ロールバック | SidePanelIndirect, useBulkUpsertStackOrderSettings | — | エラーフロー |
| 3.1 | チャートへの即時反映 | useChartData, WorkloadChart | — | データフロー |
| 3.2 | 間接 Area を案件下部に配置 | useChartData（sortAreasByIndirectOrder） | — | — |
| 3.3 | 間接 Area が案件上に出ない | useChartData（sortAreasByIndirectOrder） | — | — |
| 4.1 | TypeScript strict mode | 全コンポーネント | — | — |
| 4.2 | any 型不使用 | 全コンポーネント | — | — |
| 4.3 | Zod バリデーション | API リクエスト/レスポンス | — | — |

## Components and Interfaces

| Component | Domain/Layer | Intent | Req Coverage | Key Dependencies | Status |
|-----------|-------------|--------|--------------|------------------|--------|
| SidePanelIndirect | UI / Workload | 間接作業の順序変更 UI | 1.1-1.5, 2.1-2.2 | useBulkUpsertStackOrderSettings (P0) | 補完が必要 |
| useBulkUpsertStackOrderSettings | API / Workload | 積み上げ順の一括保存 mutation | 2.1-2.2 | TanStack Query (P0) | 補完が必要 |
| workload/index.lazy.tsx | Route / Workload | 保存済み順序の初期ロード | 2.1 | stackOrderSettingsQueryOptions (P0) | 補完が必要 |
| useChartData | Hook / Workload | チャートデータの順序制御 | 3.1-3.3 | — | ✅ 変更不要 |
| WorkloadChart | UI / Workload | Area 積み上げ描画 | 3.1-3.3 | seriesConfig (P0) | ✅ 変更不要 |

### UI Layer

#### SidePanelIndirect（補完）

| Field | Detail |
|-------|--------|
| Intent | 間接作業の↑↓ボタンによる積み上げ順入れ替え + エラー時ロールバック |
| Requirements | 1.1-1.5, 2.1, 2.2 |

**Responsibilities & Constraints**
- moveUp/moveDown で隣接要素をスワップし、mutation を呼び出す（既存）
- mutation 失敗時に前回の state を復元する（**補完**）

**Dependencies**
- Outbound: `useBulkUpsertStackOrderSettings` — 順序の一括保存 (P0)
- Outbound: `onOrderChange` callback — ルートへの順序通知 (P0)

**Contracts**: State [x]

##### State Management（補完箇所）

**エラー時ロールバック**:
- `moveUp` / `moveDown` 実行前に現在の `items` state のスナップショットを保持する
- mutation の `onError` で保持したスナップショットに `setItems` を復元する
- エラー発生時にトースト通知（`sonner`）でユーザーにフィードバックする

```typescript
// moveUp/moveDown 内の補完イメージ
const previousItems = [...prev]; // スナップショット
// ... swap logic ...
orderMutation.mutate(payload, {
  onError: () => {
    setItems(previousItems);
    toast.error("表示順の保存に失敗しました");
  },
});
```

### Route Layer

#### workload/index.lazy.tsx（補完）

| Field | Detail |
|-------|--------|
| Intent | 保存済み積み上げ順のページ初期化時ロード |
| Requirements | 2.1 |

**Responsibilities & Constraints**
- ページ初期化時に `chart_stack_order_settings` から `targetType: "indirect_work_type"` の設定を取得する
- 取得した `stackOrder` 順でソートし、`indirectOrder` state を初期化する
- データ取得完了までは空配列（デフォルト順）で表示する

**Dependencies**
- Outbound: `stackOrderSettingsQueryOptions` — 保存済み順序の取得 (P0)

**Contracts**: State [x]

##### State Management（補完箇所）

```typescript
interface StackOrderSetting {
  targetType: string;
  targetCode: string;
  stackOrder: number;
}
```

- `useQuery(stackOrderSettingsQueryOptions({ targetType: "indirect_work_type" }))` で保存済み順序を取得
- 取得データを `stackOrder` 昇順でソートし、`targetCode` の配列として `setIndirectOrder` に設定する
- `useEffect` で取得完了時に一度だけ state を初期化する

### API Layer

#### useBulkUpsertStackOrderSettings（補完）

| Field | Detail |
|-------|--------|
| Intent | 積み上げ順の一括保存 mutation + エラー通知 |
| Requirements | 2.1, 2.2 |

**Contracts**: API [x]

##### API Contract（既存・変更なし）

| Method | Endpoint | Request | Response | Errors |
|--------|----------|---------|----------|--------|
| PUT | /chart-stack-order-settings/bulk | `{ items: ChartStackOrderSettingInput[] }` | `ChartStackOrderSetting[]` | 400, 422, 500 |

**Implementation Notes**
- `onSuccess` でのキャッシュ無効化は既存のまま維持
- ロールバック処理は呼び出し側（`SidePanelIndirect`）の `mutate` コールバックで実装する（mutation hook 自体は汎用のまま維持）

## Data Models

### 既存テーブル（変更なし）

**`chart_stack_order_settings`**:

| Column | Type | Description |
|--------|------|-------------|
| chart_stack_order_setting_id | INT IDENTITY | PK |
| target_type | NVARCHAR(20) | `"indirect_work_type"` |
| target_code | NVARCHAR(20) | workTypeCode |
| stack_order | INT | 積み上げ順（0 = 最下部） |
| created_at | DATETIME2 | 作成日時 |
| updated_at | DATETIME2 | 更新日時 |

スキーマ変更、新規テーブル、マイグレーションは不要。

## Error Handling

### Error Strategy

| Error Type | Category | Response |
|------------|----------|----------|
| 積み上げ順保存失敗 | System Error (5xx) | UI をロールバック + トースト通知「表示順の保存に失敗しました」 |
| ネットワークエラー | System Error | 同上 |

### エラーフロー

1. ユーザーが↑↓ボタンをクリック
2. UI state を楽観的に更新（即座に反映）
3. `orderMutation.mutate()` で API 呼び出し
4. **成功時**: キャッシュ無効化（既存動作）
5. **失敗時**: スナップショットから state を復元 + `toast.error()` で通知

## Testing Strategy

### Unit Tests

- `sortAreasByIndirectOrder()` が間接作業を必ず案件の前（下部）に配置することの検証
- moveUp/moveDown ロジックで先頭/末尾の境界値が正しく処理されることの検証

### Integration Tests

- 保存済み順序がページリロード後に復元されることの検証
- mutation 失敗時に UI state がロールバックされることの検証
- 順序変更がチャートの Area 積み上げ順に即座に反映されることの検証

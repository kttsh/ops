# Gap Analysis: work-types-display-order

## 1. 現状調査

### 1.1 既存実装: SidePanelIndirect

**ファイル**: `features/workload/components/SidePanelIndirect.tsx`

ワークロード画面のコントロールパネル > 間接作業タブに、既に以下が実装済み：

| 機能 | 状態 | 詳細 |
|------|------|------|
| ↑↓ボタン UI | ✅ 実装済み | `ArrowUp` / `ArrowDown`（lucide-react）、`Button variant="ghost" size="icon"` |
| 先頭/末尾の無効化 | ✅ 実装済み | `disabled={index === 0}` / `disabled={index === items.length - 1}` |
| moveUp / moveDown ロジック | ✅ 実装済み | 隣接要素のスワップ + displayOrder 再計算 |
| 即時保存 | ✅ 実装済み | `useBulkUpsertStackOrderSettings()` で `chart_stack_order_settings` に一括保存 |
| 色選択 | ✅ 実装済み | `INDIRECT_COLORS` パレットから選択 |
| 表示/非表示トグル | ✅ 実装済み | `Switch` コンポーネント |

### 1.2 保存先

- **テーブル**: `chart_stack_order_settings`
- **API**: `PUT /chart-stack-order-settings/bulk`
- **保存データ**: `{ targetType: "indirect_work_type", targetCode: workTypeCode, stackOrder: number }`

### 1.3 チャートでの積み上げ順

**確認が必要**: チャートが `chart_stack_order_settings` の `stackOrder` を参照して間接作業の積み上げ順を制御しているか、また間接作業が必ず案件の下部に配置される制約が実装されているか。

## 2. 要件と現状のギャップ

### Requirement 1: 積み上げ順入れ替え UI → **ギャップなし（実装済み）**

`SidePanelIndirect.tsx` に全機能が実装済み。

### Requirement 2: 積み上げ順の永続化 → **部分的にギャップあり**

| 受入条件 | ギャップ |
|----------|---------|
| 即座に保存 | ✅ 実装済み |
| 失敗時ロールバック | **要確認** — エラー時にUIを元に戻す処理があるか |

### Requirement 3: チャートへの即時反映 → **要確認**

| 受入条件 | ギャップ |
|----------|---------|
| チャートへの即時反映 | **要確認** — 順序変更がチャートの Area 積み上げ順に反映されるか |
| 間接作業が案件の下部 | **要確認** — この制約が実装されているか |
| 案件の上に間接作業が出ない | **要確認** — 順序入れ替え操作でこの制約が破れないか |

### Requirement 4: 型安全性 → **ギャップなし**

既存コードは TypeScript strict mode で動作しており、Zod スキーマも適用済み。

## 3. 実装アプローチ

### 推奨: 既存実装の検証 + 不足分の補完

大部分が実装済みのため、以下を検証・補完する：

1. **チャートの積み上げ順が `stackOrder` に従っているか検証**
2. **間接作業が案件の下部に固定されている制約の検証**
3. **エラー時のロールバック処理の有無を確認**
4. **不足があれば補完実装**

## 4. 複雑度・リスク評価

| 項目 | 評価 | 根拠 |
|------|------|------|
| **工数** | **S（1日以下）** | 大部分が実装済み。検証と軽微な補完のみ |
| **リスク** | **Low** | 既存コードの検証が中心。新規実装がほぼ不要 |

## 5. 設計フェーズで確認すべき項目

1. チャートの Area 積み上げ順が `chart_stack_order_settings.stackOrder` に連動しているか
2. 間接作業 Area が案件 Area の下部に固定されているか（現在の実装を確認）
3. `useBulkUpsertStackOrderSettings` のエラーハンドリング（ロールバック）の有無

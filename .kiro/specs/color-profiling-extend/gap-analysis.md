# Gap Analysis: color-profiling-extend

## 1. 現状調査

### 1.1 バックエンド: ChartViewProjectItem エンティティ

| レイヤー | ファイル | 状態 |
|----------|---------|------|
| 型定義 | `apps/backend/src/types/chartViewProjectItem.ts` | `displayOrder`, `isVisible` は存在するが **`color` フィールドなし** |
| データ層 | `apps/backend/src/data/chartViewProjectItemData.ts` | CRUD + `updateDisplayOrders`（ループ方式）。**bulkUpsert なし** |
| サービス層 | `apps/backend/src/services/chartViewProjectItemService.ts` | バリデーション + CRUD。**一括更新メソッドなし** |
| ルート | `apps/backend/src/routes/chartViewProjectItems.ts` | GET/POST/PUT/DELETE + `PUT /display-order`。**bulk エンドポイントなし** |
| 変換 | `apps/backend/src/transform/chartViewProjectItemTransform.ts` | snake_case → camelCase 変換。**`color` 未対応** |

### 1.2 バックエンド: 既存の色管理（ChartColorSetting）

- `chart_color_settings` テーブルで **グローバルに** 色を管理（`targetType` + `targetId` のユニーク制約）
- `bulkUpsert` が SQL MERGE パターンで実装済み（`chartColorSettingData.ts`）
- **プロファイル（ChartView）とは紐づいていない** — 全プロファイルで同一の色設定を共有

### 1.3 バックエンド: 既存の Bulk Upsert パターン

以下のエンティティで SQL MERGE + Transaction パターンが確立済み:
- `chartColorSettingData.bulkUpsert` — MERGE ON (target_type, target_id)
- `chartStackOrderSettingData.bulkUpsert` — MERGE パターン
- `projectLoadData.bulkUpsert` — 同様のパターン

### 1.4 DB スキーマ（`docs/database/table-spec.md`）

**chart_view_project_items テーブル:**
- `chart_view_project_item_id`, `chart_view_id`, `project_id`, `project_case_id`, `display_order`, `is_visible`, `created_at`, `updated_at`
- **`color` / `color_code` カラムなし**

**chart_color_settings テーブル:**
- `chart_color_setting_id`, `target_type`, `target_id`, `color_code`, `created_at`, `updated_at`
- UNIQUE(target_type, target_id) — **グローバルスコープ**

### 1.5 フロントエンド: ProfileManager

- `handleSave()`: `createChartView` のみ呼び出し — **プロジェクトアイテムは保存しない**
- `handleApply()`: `onApply` コールバックに `{chartViewId, startYearMonth, endYearMonth}` を渡すだけ — **色・並び順・表示状態の復元なし**
- **上書き保存UIなし** — 削除ボタンのみ

### 1.6 フロントエンド: SidePanelSettings

- `projColors: Record<number, string>` — **ローカル state** で色を管理
- `projOrder: number[]` — **ローカル state** で並び順を管理
- `setProjColor()`: `colorMutation` でグローバル `chart_color_settings` に保存
- `moveProjUp()` / `moveProjDown()`: **ローカルのみ、バックエンド同期なし**
- `onProfileApply`: 期間設定のみ反映、色・並び順の復元なし

### 1.7 フロントエンド: API クライアント・Mutations・Queries

- **API クライアント**: `fetchChartViewProjectItems(chartViewId)` のみ。create/update/bulk なし
- **Mutations**: ChartView の CRUD + colorSettings/stackOrderSettings の bulkUpsert。**ChartViewProjectItem の mutation なし**
- **Queries**: `chartViewProjectItemsQueryOptions(chartViewId)` は定義済みだが **コンポーネントで未使用**
- **型定義**: `ChartViewProjectItem` に `color` フィールドなし

---

## 2. 要件−アセット マッピング

| 要件 | 既存アセット | ギャップ |
|------|------------|---------|
| **Req1: color カラム追加** | DB テーブル存在、スキーマ・型・データ層・変換層あり | ❌ Missing: `color` カラム・フィールドが全レイヤーに未実装 |
| **Req2: 一括更新 API** | MERGE パターン確立済み（chartColorSetting 等） | ❌ Missing: ChartViewProjectItem 用の bulkUpsert エンドポイント・データ層 |
| **Req3: 新規保存時の同時保存** | `createChartView` mutation あり | ❌ Missing: 保存後の projectItems 一括登録フロー |
| **Req4: 適用時の完全復元** | `chartViewProjectItemsQueryOptions` 定義済み | ❌ Missing: 取得した items を画面状態に反映するロジック |
| **Req5: 上書き保存機能** | `useUpdateChartView` mutation あり | ❌ Missing: UI（上書きボタン）・確認ダイアログ・items 更新フロー |
| **Req6: フロントエンド型整合性** | 型定義・API クライアント・mutations 構造あり | ❌ Missing: `color` フィールド追加・bulk API 関数・bulk mutation |

---

## 3. 実装アプローチ評価

### Option A: ChartViewProjectItem テーブルに `color` カラム追加（推奨）

**方針**: `chart_view_project_items` テーブルに `color_code VARCHAR(7) NULL` カラムを追加し、プロファイル単位で色を管理する。

**変更対象ファイル（バックエンド）:**
- `docs/database/table-spec.md` — スキーマ定義更新
- `types/chartViewProjectItem.ts` — スキーマ・型に `color` 追加
- `data/chartViewProjectItemData.ts` — create/update SQL に `color` 反映 + `bulkUpsert` 追加
- `services/chartViewProjectItemService.ts` — `bulkUpsert` メソッド追加
- `routes/chartViewProjectItems.ts` — `PUT /bulk` エンドポイント追加
- `transform/chartViewProjectItemTransform.ts` — `color` 変換追加

**変更対象ファイル（フロントエンド）:**
- `features/workload/types/index.ts` — `ChartViewProjectItem` に `color` 追加
- `features/workload/api/api-client.ts` — `bulkUpsertChartViewProjectItems` 追加
- `features/workload/api/mutations.ts` — `useBulkUpsertChartViewProjectItems` 追加
- `features/workload/components/ProfileManager.tsx` — 保存・適用・上書きロジック拡張
- `features/workload/components/SidePanelSettings.tsx` — ProfileManager への props 追加

**トレードオフ:**
- ✅ 1テーブルで色・並び順・表示状態を一元管理（シンプル）
- ✅ 既存の MERGE パターンを再利用可能
- ✅ プロファイルごとに異なる色設定が可能（要件に合致）
- ⚠️ グローバル色設定（`chart_color_settings`）との関係整理が必要
- ⚠️ DB ALTER TABLE が必要

### Option B: 既存の ChartColorSetting を ChartView スコープに拡張

**方針**: `chart_color_settings` テーブルに `chart_view_id` カラムを追加し、プロファイルスコープの色設定を実現する。

**トレードオフ:**
- ✅ 既存の bulkUpsert インフラをそのまま利用
- ❌ 既存のグローバル色設定との互換性が破壊される
- ❌ ユニーク制約の変更が複雑（target_type + target_id + chart_view_id）
- ❌ 色と並び順・表示状態が別テーブルに分散し、一括同期が複雑化

### Option C: ハイブリッド（推奨しない）

**方針**: 色は `chart_color_settings` のまま、並び順・表示状態のみ `chart_view_project_items` で管理。

**トレードオフ:**
- ✅ DB スキーマ変更が最小
- ❌ プロファイルごとの色設定が不可能（Issue #25 の要件を満たさない）
- ❌ 保存・復元フローが2系統に分散し複雑化

---

## 4. 複雑性・リスク評価

| 項目 | 評価 | 根拠 |
|------|------|------|
| **工数** | **M（3〜7日）** | 既存パターン（MERGE bulkUpsert）を踏襲可能。新規エンドポイント1つ + 全レイヤーへの `color` 追加 + フロントエンド保存/適用/上書きフロー |
| **リスク** | **Medium** | DB スキーマ変更あり。グローバル色設定との整合性調整が必要。フロントエンドの状態管理フローの変更範囲が広い |

---

## 5. 設計フェーズへの推奨事項

### 推奨アプローチ: Option A（ChartViewProjectItem に `color` カラム追加）

**理由:**
1. Issue #25 の要件「プロファイルごとに色設定を保存」に最も直接的に対応
2. 1テーブルで色・並び順・表示状態を管理でき、一括 API で完全同期が可能
3. 既存の MERGE パターンを再利用でき、実装の一貫性が保たれる

### 設計フェーズでの検討事項

1. **グローバル色設定との関係**: プロファイル適用時に `chart_color_settings`（グローバル）と `chart_view_project_items.color`（プロファイル固有）のどちらを優先するか
2. **新規プロファイル保存のトランザクション設計**: ChartView 作成 → ProjectItems 一括登録を原子的に行う方法
3. **旧プロファイルとの後方互換性**: `color` が `NULL` の場合のフォールバック挙動
4. **`chart_color_settings` テーブルの将来**: プロファイル固有の色が導入された後、グローバル色設定の役割と用途

### Research Needed（設計フェーズで要調査）

- ProfileManager の props 設計: SidePanelSettings から色・並び順・表示状態をどのように受け渡すか
- 適用時の状態復元フロー: React Query のキャッシュと SidePanelSettings のローカル state をどう同期するか

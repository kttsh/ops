# ギャップ分析: workload-profile-bu-sync

## 1. 現状調査

### 1.1 対象アセットの概要

| レイヤー | ファイル | 役割 |
|---------|---------|------|
| バックエンド型定義 | `apps/backend/src/types/chartView.ts` | ChartView / Create / Update スキーマ（Zod） |
| バックエンドデータ | `apps/backend/src/data/chartViewData.ts` | chart_views テーブルの CRUD |
| バックエンドサービス | `apps/backend/src/services/chartViewService.ts` | バリデーション + エラーハンドリング |
| バックエンドルート | `apps/backend/src/routes/chartViews.ts` | REST エンドポイント定義 |
| バックエンド変換 | `apps/backend/src/transform/chartViewTransform.ts` | DB行 ↔ APIレスポンス変換 |
| フロントエンド型定義 | `apps/frontend/src/features/workload/types/index.ts` | ChartView / Input型定義 |
| フロントエンドAPI | `apps/frontend/src/features/workload/api/api-client.ts` | fetch関数 |
| フロントエンドmutations | `apps/frontend/src/features/workload/api/mutations.ts` | useMutation hooks |
| ProfileManager | `apps/frontend/src/features/workload/components/ProfileManager.tsx` | プロファイル管理UI |
| SidePanelSettings | `apps/frontend/src/features/workload/components/SidePanelSettings.tsx` | 設定パネル |
| WorkloadPage | `apps/frontend/src/routes/workload/index.tsx` | ルートコンポーネント |
| useWorkloadFilters | `apps/frontend/src/features/workload/hooks/useWorkloadFilters.ts` | URL Search Params管理 |

### 1.2 現状のプロファイル保存データ

**chart_views テーブル:**
`chart_view_id`, `view_name`, `chart_type`, `start_year_month`, `end_year_month`, `is_default`, `description`, `created_at`, `updated_at`, `deleted_at`

**保存時のデータフロー:**
```
SidePanelSettings → ProfileManager.handleSave()
  → POST /chart-views (viewName, chartType, startYearMonth, endYearMonth)
  → PUT /chart-views/:id/project-items/bulk (projectItems)
```

**適用時のデータフロー:**
```
ProfileManager.handleApply(view)
  → GET /chart-views/:id/project-items
  → onApply({ chartViewId, startYearMonth, endYearMonth, projectItems })
  → SidePanelSettings: projOrder/projColors復元
  → WorkloadPage: setPeriod(startYearMonth, months)
  → URL: bu=... (変更なし), from=..., months=... (更新)
```

### 1.3 BU選択の現状管理

- `useWorkloadFilters` フックがURL Search Params（`bu`パラメータ）で管理
- `BusinessUnitSelector` コンポーネントがUI操作を担当
- ProfileManagerはBU選択を一切認識していない
- プロファイル適用時にBU選択は変更されない

---

## 2. 要件と既存アセットのマッピング

| 要件 | 既存アセット | ギャップ |
|------|------------|---------|
| **Req 1**: 保存時のBU永続化 | ProfileManager.handleSave() / handleOverwriteConfirm() | **Missing**: BUコードの送信ロジックがない |
| **Req 1**: 保存時のBU永続化 | CreateChartView / UpdateChartView型 | **Missing**: businessUnitCodesフィールドがない |
| **Req 1**: 保存時のBU永続化 | chart_views テーブル | **Missing**: business_unit_codesカラムがない |
| **Req 2**: 適用時のBU復元 | ProfileManager.handleApply() → onApply callback | **Missing**: BUコードの返却がない |
| **Req 2**: 適用時のBU復元 | WorkloadPage.handleProfileApply() | **Missing**: setBusinessUnits呼び出しがない |
| **Req 2**: URL反映 | useWorkloadFilters.setBusinessUnits() | **Exists**: フック自体はBU更新メソッドを持つ |
| **Req 3**: 後方互換 | chartViewTransform | **Constraint**: 既存データのnull対応が必要 |
| **Req 4**: DB拡張 | chartViewData.ts (BASE_SELECT, create, update) | **Missing**: business_unit_codesカラムの操作 |
| **Req 4**: JSON変換 | chartViewTransform.ts | **Missing**: JSON ↔ 配列の変換 |
| **Req 5**: 型安全性 | backend/types/chartView.ts, frontend/types/index.ts | **Missing**: 全型定義にフィールド追加が必要 |

---

## 3. 実装アプローチの評価

### Option A: 既存コンポーネントの拡張（推奨）

**概要:** 既存のchartViewスタック全体（DB→型→データ→サービス→ルート→フロントエンド）にbusinessUnitCodesフィールドを追加する。

**変更対象ファイル:**

| ファイル | 変更内容 |
|---------|---------|
| DB (ALTER TABLE) | `business_unit_codes NVARCHAR(MAX) NULL` カラム追加 |
| `apps/backend/src/types/chartView.ts` | Zodスキーマに `businessUnitCodes` 追加 |
| `apps/backend/src/data/chartViewData.ts` | BASE_SELECT, create, update にカラム追加 |
| `apps/backend/src/transform/chartViewTransform.ts` | JSON文字列 ↔ 配列変換 |
| `apps/backend/src/services/chartViewService.ts` | 変更なし（透過的） |
| `apps/backend/src/routes/chartViews.ts` | Zodスキーマが自動的に反映 |
| `apps/frontend/src/features/workload/types/index.ts` | 型定義にフィールド追加 |
| `apps/frontend/src/features/workload/api/api-client.ts` | API呼び出しにフィールド追加 |
| `apps/frontend/src/features/workload/api/mutations.ts` | 変更なし（型が自動追従） |
| `apps/frontend/src/features/workload/components/ProfileManager.tsx` | Props追加 + 保存/適用ロジック更新 |
| `apps/frontend/src/features/workload/components/SidePanelSettings.tsx` | BUコードの受け渡し追加 |
| `apps/frontend/src/routes/workload/index.tsx` | handleProfileApplyでBU復元追加 |

**トレードオフ:**
- ✅ 既存パターンに完全準拠（レイヤードアーキテクチャ、Transform層のJSON変換）
- ✅ 新規ファイル不要、最小限の変更
- ✅ Issue #26の修正方針と完全一致
- ✅ 後方互換性が自然に確保（NULL許容カラム）
- ❌ 既存テスト（6ファイル）の更新が必要

### Option B: 新規テーブルで関連管理

**概要:** `chart_view_business_units` のような中間テーブルを作成し、プロファイルとBUの関連を正規化して管理する。

**トレードオフ:**
- ✅ データベース設計としてはより正規化
- ✅ BUごとのクエリが容易
- ❌ 新規テーブル・新規CRUD・新規テスト一式が必要（大幅な工数増）
- ❌ chart_view_project_items と同じ二重管理パターンの追加（複雑化）
- ❌ 要件（BUコードの保存/復元）に対してオーバーエンジニアリング
- ❌ Issue #26の方針と乖離

### Option C: フロントエンドのみで管理（localStorage）

**概要:** BU選択状態をlocalStorageにプロファイルIDと紐づけて保存し、バックエンド変更なしで対応。

**トレードオフ:**
- ✅ バックエンド変更ゼロ
- ❌ デバイス間で共有不可
- ❌ localStorage消去で状態喪失
- ❌ プロファイルの「完全な再現」という要件を満たさない
- ❌ Issue #26の方針と大きく乖離

---

## 4. 複雑性とリスクの評価

### 工数: S（1–3日）

**根拠:**
- 既存のchartView CRUDパターンが確立されており、フィールド追加のみ
- chart_view_project_items の bulkUpsert 実装でJSON変換パターンが存在（参照可能）
- フロントエンドはProps追加 + コールバック修正のみ
- 新規コンポーネント・新規API不要

### リスク: Low

**根拠:**
- 既存パターンの拡張であり、新規技術・アーキテクチャ変更なし
- NULL許容カラム追加のため、既存データへの影響なし
- ProfileManagerのonApplyコールバックパターンが確立済み
- テストが包括的に存在し、回帰確認が容易

---

## 5. 設計フェーズへの推奨事項

### 推奨アプローチ: Option A（既存コンポーネントの拡張）

Issue #26の修正方針と完全一致し、既存パターンに準拠した最も効率的なアプローチ。

### 設計時に検討すべき事項

1. **DB変更**: ALTER TABLE文の作成（マイグレーションスクリプト or 手動実行）
2. **Transform層**: JSON文字列 ↔ 配列の変換は `chartViewTransform.ts` に追加。既存の chartViewProjectItemTransform にも類似パターンがあるため参考にできる
3. **ProfileManager Props**: `businessUnitCodes: string[]` を追加し、保存時に含める。onApplyコールバックの戻り値にも `businessUnitCodes` を追加
4. **useWorkloadFilters連携**: `setBusinessUnits()` メソッドが既に存在するため、handleProfileApply内で呼び出すだけ
5. **テスト更新**: 6つの既存テストファイルのうち、chartViewData / chartViewService / chartViews ルートテストが更新対象

### Research Needed

- なし（すべて既存パターンの拡張で対応可能）

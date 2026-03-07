# ギャップ分析: standard-effort-masters-ui

## 1. 現状調査

### 1.1 既存アセットマップ

| カテゴリ | 既存アセット | 状態 |
|---------|-------------|------|
| **型定義** | `features/case-study/types/index.ts` に `StandardEffortMaster`, `StandardEffortWeight`, `StandardEffortMasterDetail` が定義済み | 再利用可能（ただし専用 feature に移動が望ましい） |
| **API クライアント** | `features/case-study/api/api-client.ts` に `fetchStandardEffortMasters`, `fetchStandardEffortMaster` が実装済み | 参照のみ使用。CRUD 全操作をカバーする専用クライアントが必要 |
| **クエリ** | `features/case-study/api/queries.ts` に `standardEffortMastersQueryOptions`, `standardEffortMasterQueryOptions` が存在 | case-study 内のカスタムキー体系。ファクトリパターンで再実装が必要 |
| **ミューテーション** | なし | **Missing** — 新規作成が必要 |
| **カラム定義** | なし | **Missing** — 新規作成が必要 |
| **フォーム** | なし | **Missing** — 新規作成が必要（重みテーブル入力は新規パターン） |
| **チャート** | `features/case-study/components/WorkloadChart.tsx` に Recharts AreaChart パターンあり | パターン参考。専用の WeightDistributionChart を新規作成 |
| **ルート** | なし | **Missing** — 3 ルート新規作成が必要 |
| **サイドバー** | `components/layout/SidebarNav.tsx` にマスタ管理セクションあり | 1 行追加で対応可能 |
| **共通コンポーネント** | DataTable, DataTableToolbar, PageHeader, FormTextField, FieldWrapper, QuerySelect, DeleteConfirmDialog, RestoreConfirmDialog, StatusBadge, column-helpers, DetailRow, SortableHeader | すべて再利用可能 |
| **API ファクトリ** | `lib/api/` に createQueryKeys, createCrudClient, createCrudMutations, createListQueryOptions, createDetailQueryOptions | すべて再利用可能 |

### 1.2 既存コーディングパターン

- **Feature 構造**: `api/api-client.ts` → `api/queries.ts` → `api/mutations.ts` + `types/index.ts` + `components/` + `index.ts`
- **ファクトリパターン**: `createCrudClient` → `createQueryKeys` → `createListQueryOptions` / `createDetailQueryOptions` → `createCrudMutations`
- **ルートパターン**: `validateSearch` + `useQuery` + DataTable（一覧）、`useQuery` + DetailRow（詳細）、`useForm` + mutation（作成/編集）
- **エラーハンドリング**: `ApiError` + `problemDetails.status` による分岐 + `toast` 通知
- **フォームパターン**: `useForm` + `form.Field` + `FormTextField` / `QuerySelect` + Zod バリデーション

### 1.3 統合ポイント

- **バックエンド API**: 全エンドポイント実装済み（GET, POST, PUT, DELETE, RESTORE）
- **BU / 案件タイプ Select**: `businessUnitsForSelectQueryOptions`, `projectTypesForSelectQueryOptions` が projects feature に定義済み → 再利用可能
- **case-study feature との関係**: 現在 case-study 内に標準工数マスタの型定義と読み取り専用 API が存在。新 feature 作成後も case-study は自身の API を引き続き使用（feature 間依存禁止の原則）

## 2. 要件実現性分析

### 2.1 技術要件の分類

| 要件 | 複雑度 | 既存パターン |
|------|--------|-------------|
| 一覧画面（DataTable + 検索 + フィルタ + ページネーション） | 低 | projects master と同一パターン |
| 新規作成画面（フォーム + BU/PT Select） | 低 | ProjectForm と同一パターン |
| 重みテーブル入力（21行の数値入力） | **中** | **新規パターン** — 固定行数のテーブル形式数値入力 |
| エリアチャート（リアルタイムプレビュー） | 低〜中 | WorkloadChart の AreaChart パターン参考 |
| 詳細/編集画面（モード切替） | **中** | projects は別ページ（detail + edit）。同一コンポーネント内モード切替は**新規パターン** |
| 論理削除/復元 | 低 | DeleteConfirmDialog / RestoreConfirmDialog 再利用 |
| サイドバーメニュー追加 | 低 | 1 行追加 |

### 2.2 ギャップと制約

#### Missing（未実装）
1. **重みテーブル入力コンポーネント**: 21 行固定の進捗率 × 重みテーブル。TanStack Form の配列フィールドパターンまたは固定オブジェクトフィールドで実装
2. **WeightDistributionChart**: Recharts AreaChart による重み分布可視化。WorkloadChart のパターンを簡素化して実装
3. **詳細/編集モード切替**: projects master は detail ページと edit ページが分離。Issue #43 では同一コンポーネント内でのモード切替を要求

#### Constraint（制約）
1. **Feature 間依存禁止**: case-study 内の既存 StandardEffortMaster 型を直接参照できない → 新 feature で独自に型定義
2. **BU/PT Select クエリ**: projects feature に定義済みだが、feature 間依存禁止のため新 feature で独自に定義するか、lib/ に共通化が必要
3. **重み値の固定構造**: 進捗率 0-100（5%刻み・21区間）は固定であり、フォーム初期値として全21行を事前生成する必要がある

### 2.3 Research Needed
- **TanStack Form 配列フィールド**: 21行固定の重みテーブルを `form.Field` name=`weights[i].weight` で管理する場合のパフォーマンス。ドキュメント `docs/rules/tanstack-form/arrays-dynamic-fields.md` を設計時に確認

## 3. 実装アプローチ

### Option A: 既存パターン完全踏襲（推奨）

**方針**: 既存マスタ画面（projects）のファクトリパターンを踏襲し、新規 feature + ルートを作成。詳細/編集はモード切替パターンで実装。

**新規作成ファイル**:
- `features/standard-effort-masters/types/index.ts`
- `features/standard-effort-masters/api/api-client.ts`
- `features/standard-effort-masters/api/queries.ts`
- `features/standard-effort-masters/api/mutations.ts`
- `features/standard-effort-masters/components/columns.tsx`
- `features/standard-effort-masters/components/StandardEffortMasterForm.tsx`
- `features/standard-effort-masters/components/StandardEffortMasterDetail.tsx`
- `features/standard-effort-masters/components/WeightDistributionChart.tsx`
- `features/standard-effort-masters/index.ts`
- `routes/master/standard-effort-masters/index.tsx`
- `routes/master/standard-effort-masters/new.tsx`
- `routes/master/standard-effort-masters/$standardEffortId/index.tsx`

**変更ファイル**:
- `components/layout/SidebarNav.tsx`（メニュー項目追加）

**トレードオフ**:
- 既存パターンとの一貫性が最大化される
- ファクトリ関数の再利用でボイラープレート最小
- 新規パターンは重みテーブル入力とモード切替のみ
- case-study 内の既存コードとの重複は許容（feature 間依存禁止の原則）

### Option B: 共通ユーティリティ抽出型

**方針**: BU/PT Select クエリや StandardEffortMaster 型定義を `lib/` や `packages/` に共通化してから実装。

**トレードオフ**:
- 長期的な DRY 原則には適合
- スコープ拡大（リファクタリングが必要）
- 本 issue の目的（UI 実装）から逸脱するリスク
- case-study feature の変更も必要

### Option C: 詳細/編集ページ分離型

**方針**: projects master と同様に詳細ページと編集ページを分離（`$standardEffortId/index.tsx` + `$standardEffortId/edit.tsx`）。

**トレードオフ**:
- 既存パターン（projects）との完全一貫性
- Issue #43 の「同一コンポーネント内モード切替」要件と矛盾
- ページ遷移コスト（チャート再描画等）

## 4. 工数・リスク評価

| 項目 | 評価 | 根拠 |
|------|------|------|
| **工数** | **M（3-7日）** | 既存パターン踏襲で大部分は定型作業。新規パターン（重みテーブル入力 + エリアチャート + モード切替）に中程度の工数 |
| **リスク** | **Low** | 既存ファクトリパターン・共通コンポーネントの再利用。バックエンド API 実装済み。新規パターンも Recharts / TanStack Form のドキュメント化されたパターンの範囲内 |

## 5. 設計フェーズへの推奨事項

### 推奨アプローチ: Option A（既存パターン完全踏襲）

1. **API / クエリ / ミューテーション層**: `createCrudClient` + `createQueryKeys` + `createCrudMutations` ファクトリを使用。BU/PT Select クエリは feature 内で独自定義
2. **一覧画面**: projects master の一覧パターンをそのまま踏襲
3. **重みテーブル入力**: TanStack Form の配列フィールドパターンを調査し、21行固定のテーブル入力を設計
4. **エリアチャート**: WorkloadChart の AreaChart パターンを簡素化。props で `weights` データを受け取る純粋な表示コンポーネント
5. **詳細/編集画面**: Issue #43 の要件に従い、同一コンポーネント内でのモード切替を採用。`isEditing` state で閲覧/編集を切替

### 設計時の調査事項
- TanStack Form 配列フィールドの最適パターン（`docs/rules/tanstack-form/arrays-dynamic-fields.md`）
- Recharts AreaChart の props 設計（グラデーション・ツールチップ）
- モード切替時のフォーム初期値設定とリセット処理

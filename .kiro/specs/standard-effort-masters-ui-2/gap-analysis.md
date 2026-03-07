# Gap Analysis: standard-effort-masters-ui-2

## 分析サマリー

**結論: 要件に記載された全機能は既に実装済みである。**

前回のスペック `standard-effort-masters-ui`（phase: implemented）に基づき、ルート・features・コンポーネント・サイドバーメニューのすべてが実装完了している。GitHub Issue #43 のスコープに対する未実装ギャップは存在しない。

---

## 1. 要件-アセット対応マップ

| 要件 | 既存アセット | ギャップ |
|------|------------|---------|
| Req 1: 一覧画面 | `routes/master/standard-effort-masters/index.tsx` — DataTable・検索・BU/PTフィルタ・無効データ切替・ページネーション・行クリック遷移・新規作成ボタン、すべて実装済み | なし |
| Req 2: 新規作成画面 | `routes/master/standard-effort-masters/new.tsx` — QuerySelect（BU/PT）・パターン名入力・21行重みテーブル・リアルタイムチャートプレビュー・バリデーション・API送信・トースト通知、すべて実装済み | なし |
| Req 3: 詳細/編集画面 | `routes/master/standard-effort-masters/$standardEffortId/index.tsx` + `StandardEffortMasterDetail.tsx` — 閲覧/編集モード切替・保存/キャンセル・削除確認ダイアログ・復元確認ダイアログ・APIエラー通知、すべて実装済み | なし |
| Req 4: エリアチャート | `WeightDistributionChart.tsx` — Recharts AreaChart、新規作成・詳細/編集画面で再利用、リアルタイム更新、すべて実装済み | なし |
| Req 5: ナビゲーション | `SidebarNav.tsx:56-57` — 「標準工数パターン」メニュー項目、実装済み | なし |
| Req 6: 既存パターン一貫性 | createCrudClient / createQueryKeys / createListQueryOptions / createDetailQueryOptions / createCrudMutations / column-helpers すべて使用済み | なし |

## 2. 既存実装の詳細

### ルート（3ファイル — すべて実装済み）
- `src/routes/master/standard-effort-masters/index.tsx` — 267行、フル機能の一覧画面（エクスポート/インポート含む）
- `src/routes/master/standard-effort-masters/new.tsx` — 65行、新規作成画面
- `src/routes/master/standard-effort-masters/$standardEffortId/index.tsx` — 199行、詳細/編集画面

### Features（10ファイル — すべて実装済み）
- `types/index.ts` — Zodスキーマ・型定義・定数（PROGRESS_RATES, DEFAULT_WEIGHTS）
- `api/api-client.ts` — createCrudClient + カスタムfetchList（BU/PTフィルタ対応）
- `api/queries.ts` — createQueryKeys / createListQueryOptions / createDetailQueryOptions + BU/PT Select用queryOptions
- `api/mutations.ts` — createCrudMutations（CRUD全操作）
- `components/columns.tsx` — createSortableColumn / createStatusColumn / createDateTimeColumn / createRestoreActionColumn
- `components/StandardEffortMasterDetail.tsx` — 閲覧/編集モード切替コンポーネント
- `components/StandardEffortMasterForm.tsx` — TanStack Form + 重みテーブル + チャートプレビュー
- `components/WeightDistributionChart.tsx` — Recharts AreaChart
- `api/bulk-client.ts` + `hooks/useStandardEffortBulkExport.ts` + `hooks/useStandardEffortBulkImport.ts` — 一括エクスポート/インポート（Issue #43 スコープ外だが実装済み）
- `index.ts` — パブリックAPIエクスポート

### サイドバー（実装済み）
- `SidebarNav.tsx` に「標準工数パターン」メニュー項目追加済み

## 3. 実装アプローチ評価

### Option A: 既存実装をそのまま利用（推奨）
- **説明**: 全要件が実装済みのため、追加の開発作業は不要
- **Trade-offs**:
  - ✅ 開発工数ゼロ
  - ✅ 既にテスト済み・動作確認済み
  - ❌ 既存実装に改善点がある場合は別途対応が必要

### Option B: 品質改善・リファクタリング
- **説明**: 既存実装のコード品質・UX を見直し、改善が必要な箇所をリファクタリング
- **潜在的な改善ポイント**（要確認）:
  - TypeScript 型安全性の確認
  - バリデーションエラーメッセージの統一
  - アクセシビリティ対応
- **Trade-offs**:
  - ✅ コード品質の向上
  - ❌ 追加の開発工数が必要

## 4. 工数・リスク

- **工数**: S（追加開発不要 / 改善のみの場合は 1-2 日）
- **リスク**: Low — 既に確立されたパターンで実装完了、影響範囲が明確

## 5. 設計フェーズへの推奨事項

- **推奨アプローチ**: Option A（既存実装の活用）
- **アクション**: Issue #43 のすべての受け入れ条件を既存実装に対してチェックし、未達成項目がないか確認する
- **Research Needed**: なし（技術的な未知要素は存在しない）

> **注意**: このスペックの前身 `standard-effort-masters-ui` が `implemented` フェーズで完了しており、その成果物がそのまま残っている状態です。新たな設計・タスク生成を行う前に、既存実装が要件を満たしているかの動作確認を推奨します。

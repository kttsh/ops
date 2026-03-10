# Gap Analysis: indirect-monthly-loads-view

## 要件からアセットへのマッピング

### Requirement 1: 間接工数一覧表示

| 技術ニーズ | 既存アセット | ギャップ |
|-----------|-------------|---------|
| `/indirect/monthly-loads` ルート | `routes/indirect/simulation/` パターンあり | **Missing**: 新規ルートファイル作成が必要 |
| BU セレクタ（URL 連動） | `BusinessUnitSingleSelector` + Zod search schema パターン確立済み | なし — そのまま再利用可能 |
| ケース一覧（左パネル） | `IndirectWorkCaseList` コンポーネント既存 | **要調査**: 直接再利用可能か、props 拡張が必要か |
| 月次データテーブル（右パネル） | `CalculationResultTable` は表示専用・階層型 | **Missing**: 編集可能なフラットテーブルが必要 |
| `source` バッジ表示 | プロジェクト内にバッジパターンあり（shadcn/ui Badge） | **Missing**: source 用バッジコンポーネント |
| 空状態表示 | 他画面に空状態パターンあり | なし — パターン踏襲 |
| API: GET 一覧 | `fetchMonthlyIndirectWorkLoads` + `monthlyIndirectWorkLoadsQueryOptions` 既存 | なし — そのまま再利用可能 |

### Requirement 2: 手動編集

| 技術ニーズ | 既存アセット | ギャップ |
|-----------|-------------|---------|
| インライン編集 | `IndirectWorkRatioMatrix` の Input パターン確立済み | **Missing**: 月次工数用の編集テーブルコンポーネント |
| 編集行ハイライト | なし（RatioMatrix は行単位ではなくセル単位） | **Missing**: 行レベルの dirty 状態追跡 |
| `source: 'manual'` 自動設定 | バックエンド型に `source` フィールドあり | なし — フロントエンドで設定するだけ |
| 保存（bulk upsert） | `useBulkSaveMonthlyIndirectWorkLoads` mutation 既存 | なし — そのまま再利用可能 |
| トースト通知 | `sonner` による toast パターン確立済み | なし |
| calculated 上書き警告 | プロジェクト内に確認ダイアログパターンあり | **Missing**: 専用の警告ダイアログ or 汎用 ConfirmDialog 活用 |
| 未保存警告 | `useUnsavedChanges` hook 既存（useBlocker ベース） | なし — そのまま再利用可能 |

### Requirement 3: バリデーション

| 技術ニーズ | 既存アセット | ギャップ |
|-----------|-------------|---------|
| 数値入力制限 | `normalizeNumericInput` ユーティリティ既存 | なし — 再利用可能 |
| フィールドバリデーション | Zod スキーマ（`manhour: z.number().int().min(0).max(99999999)`）既存 | なし — バックエンド型を参照 |
| 保存ボタン無効化 | `isDirty` パターン確立済み | なし — パターン踏襲 |

### Requirement 4: ナビゲーション統合

| 技術ニーズ | 既存アセット | ギャップ |
|-----------|-------------|---------|
| サイドナビメニュー追加 | `SidebarNav.tsx` の `menuItems` 配列 | **Missing**: 「月次間接工数」項目の追加（1行） |

### Requirement 5: レイアウト・操作性

| 技術ニーズ | 既存アセット | ギャップ |
|-----------|-------------|---------|
| 2カラムレイアウト | `/master/indirect-work-cases` のレイアウトパターン | なし — パターン踏襲 |
| URL params 永続化 | Zod search schema + `Route.useSearch()` パターン | なし |
| ローディング表示 | Skeleton / Spinner パターン既存 | なし |

## 実装アプローチの選択肢

### Option A: 既存 feature を拡張

`features/indirect-case-study/` に新しいコンポーネント・hooks を追加する。

- **拡張対象**:
  - `components/` に `MonthlyLoadsTable.tsx`（編集可能テーブル）を追加
  - `hooks/` に `useMonthlyLoadsPage.ts`（画面状態管理）を追加
  - 既存の `api/indirect-work-client.ts` と `api/mutations.ts` はそのまま利用
  - 既存の `IndirectWorkCaseList` を再利用（props 調整の可能性）

- **メリット**:
  - ✅ API クライアント・mutation・型定義・Query Key Factory がすべて既存
  - ✅ `IndirectWorkCaseList` や `BusinessUnitSingleSelector` を直接 import 可能
  - ✅ 間接工数ドメインのコードが一箇所に凝集
  - ✅ 最小限のファイル追加で済む

- **デメリット**:
  - ❌ `indirect-case-study` feature が肥大化する（既にシミュレーション＋マスタ管理の2機能を持つ）

### Option B: 新規 feature として作成

`features/indirect-monthly-loads/` を新規作成する。

- **新規作成**:
  - `features/indirect-monthly-loads/api/` — API クライアント
  - `features/indirect-monthly-loads/components/` — テーブル等
  - `features/indirect-monthly-loads/hooks/` — 画面ロジック
  - `features/indirect-monthly-loads/types/` — 型定義

- **メリット**:
  - ✅ 責務が明確に分離される
  - ✅ 独立してテスト・メンテ可能

- **デメリット**:
  - ❌ 既存の API クライアント・mutation・型を複製 or 再 export が必要
  - ❌ `IndirectWorkCaseList` 等のコンポーネント共有が複雑化（features 間依存禁止ルール）
  - ❌ Query Key の統一が困難

### Option C: ハイブリッド（推奨）

`features/indirect-case-study/` を拡張しつつ、新規画面用のコンポーネントは明確に分離する。

- **拡張**:
  - 既存の api, types, mutations はそのまま利用
  - `IndirectWorkCaseList`, `BusinessUnitSingleSelector` を再利用

- **新規作成**:
  - `features/indirect-case-study/components/MonthlyLoadsTable.tsx` — 編集可能テーブル
  - `features/indirect-case-study/hooks/useMonthlyLoadsPage.ts` — 画面状態管理
  - `routes/indirect/monthly-loads/index.tsx` + `index.lazy.tsx` — ルート定義

- **メリット**:
  - ✅ 既存アセットの最大限活用（API, mutation, types, Query Keys, コンポーネント）
  - ✅ features 間依存禁止ルールに抵触しない
  - ✅ コンポーネント粒度で責務分離

- **デメリット**:
  - ❌ `indirect-case-study` feature がやや大きくなる（許容範囲）

## 実装の複雑度とリスク

### Effort: **S（1–3日）**
- 既存パターン（2カラムレイアウト、BU セレクタ、インライン編集、未保存警告）がすべて確立済み
- API・mutation・型定義がすべて既存
- 新規作成は画面コンポーネント（テーブル + ページ hook）とルートファイルのみ

### Risk: **Low**
- 使い慣れた技術スタック内で完結
- 既存パターンの踏襲が主体
- 外部統合なし
- `calculated` 上書き警告は UI レベルの実装で完結

## 設計フェーズへの推奨事項

### 推奨アプローチ
**Option C（ハイブリッド）**: `features/indirect-case-study/` を拡張し、既存アセットを最大限活用する。

### 設計フェーズでの検討事項
1. `IndirectWorkCaseList` の再利用可否 — 現在の props インターフェースで新画面に適合するか確認
2. 編集テーブルの実装方式 — `IndirectWorkRatioMatrix` の Input パターンを踏襲するか、TanStack Table のカスタムセルを使うか
3. `calculated` → `manual` 上書き時の確認ダイアログ — 既存の `AlertDialog` パターンを活用

### Research Needed（設計フェーズで調査）
- なし（既存パターンで全要件カバー可能）

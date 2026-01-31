# Gap Analysis: project-types-master-ui

## 1. 現状調査

### 既存アセット

| 領域 | 状態 | 詳細 |
|------|------|------|
| バックエンド API | **実装済み** | `apps/backend/src/routes/projectTypes.ts` — CRUD + restore 全エンドポイント稼働中 |
| バックエンド型定義 | **実装済み** | `apps/backend/src/types/projectType.ts` — Zod スキーマ・TypeScript 型完備 |
| フロントエンド routes | **未実装** | `apps/frontend/src/routes/master/project-types/` ディレクトリ不在 |
| フロントエンド feature | **未実装** | `apps/frontend/src/features/project-types/` ディレクトリ不在 |
| 参考実装 | **存在** | `features/business-units/` + `routes/master/business-units/` が同一パターンで実装済み |

### 既存パターン・規約

- **feature モジュール構成**: `api/`（api-client, queries, mutations）、`components/`、`types/`、`index.ts`
- **API クライアント**: fetch + `VITE_API_BASE_URL` 環境変数、`ApiError` クラスで RFC 9457 ラップ
- **Query Key Factory**: `entityKeys` オブジェクト（`all`, `lists`, `list(params)`, `details`, `detail(code)`）
- **Mutation フック**: `useCreateX`, `useUpdateX`, `useDeleteX`, `useRestoreX` — 成功時にキャッシュ無効化
- **フォームパターン**: 単一コンポーネントで `create` / `edit` モード切替、TanStack Form + Zod バリデーション
- **テーブルパターン**: `DataTable` + `DataTableToolbar` + `columns` + `DebouncedSearchInput`（IME対応）
- **確認ダイアログ**: shadcn/ui `AlertDialog` ベースの `DeleteConfirmDialog` / `RestoreConfirmDialog`
- **Search Params**: Zod スキーマ + `.catch()` でURL パラメータの型安全パース
- **エラーハンドリング**: 409/422/404 を区別し、Toast（sonner）で通知

### API レスポンス型（バックエンド定義済み）

```typescript
type ProjectType = {
  projectTypeCode: string
  name: string
  displayOrder: number
  createdAt: string
  updatedAt: string
}
```

APIエンドポイント:
- `GET /project-types` — 一覧（ページネーション + `filter[includeDisabled]`）
- `GET /project-types/:projectTypeCode` — 単一取得
- `POST /project-types` — 作成
- `PUT /project-types/:projectTypeCode` — 更新
- `DELETE /project-types/:projectTypeCode` — 論理削除
- `POST /project-types/:projectTypeCode/actions/restore` — 復元

## 2. 要件フィージビリティ分析

### Requirement-to-Asset マップ

| 要件 | 必要な技術要素 | 現状 | ギャップ |
|------|--------------|------|---------|
| Req 1: 一覧画面 | TanStack Table + Query | business-units 参考あり | **Missing**: project-types 用のルート・コンポーネント |
| Req 2: 検索・フィルタ | グローバルフィルタ + includeDisabled トグル | business-units で同一パターン実装済み | **Missing**: project-types 用 toolbar・search schema |
| Req 3: 詳細表示 | 単一取得 API + 詳細カード | business-units で同一パターン実装済み | **Missing**: project-types 用の詳細ルート |
| Req 4: 新規登録 | TanStack Form + Zod + POST API | business-units で同一パターン実装済み | **Missing**: project-types 用フォーム・ルート |
| Req 5: 編集 | TanStack Form + PUT API | business-units で同一パターン実装済み | **Missing**: project-types 用編集ルート |
| Req 6: 削除 | DELETE API + 確認ダイアログ | business-units で同一パターン実装済み | **Missing**: project-types 用ダイアログ |
| Req 7: 復元 | restore API + 確認ダイアログ | business-units で同一パターン実装済み | **Missing**: project-types 用ダイアログ |
| Req 8: ルーティング | TanStack Router ファイルベース | business-units で同一パターン実装済み | **Missing**: route ファイル群 |
| Req 9: ビジュアルデザイン | shadcn/ui + Tailwind | business-units のデザイン踏襲 | ギャップなし（パターン転用） |
| Req 10: フィードバック | Toast + Badge + スピナー | business-units で同一パターン実装済み | ギャップなし（パターン転用） |
| Req 11: feature 構成 | feature モジュールパターン | business-units で同一構成実装済み | **Missing**: ディレクトリ・ファイル群 |

### 複雑性シグナル

- **Simple CRUD**: 全要件がマスタデータの CRUD 操作であり、複雑なワークフローやアルゴリズムロジックは不要
- **同一パターン**: business-units マスタUI と完全に同一の構造・パターン・技術スタック
- **エンティティの差異**: フィールド名が `businessUnitCode` → `projectTypeCode` に変わるのみで、データ構造（code, name, displayOrder, createdAt, updatedAt, deletedAt）は同一

## 3. 実装アプローチオプション

### Option A: business-units からの複製・リネーム（推奨）

**概要**: `features/business-units/` と `routes/master/business-units/` のコードを `project-types` 用にコピーし、エンティティ名・API パス・ラベルを置換する。

**変更対象**:
- `features/project-types/api/api-client.ts` — エンドポイントを `/project-types` に変更
- `features/project-types/api/queries.ts` — `projectTypeKeys` に変更
- `features/project-types/api/mutations.ts` — `useCreateProjectType` 等に変更
- `features/project-types/types/index.ts` — `ProjectType` 型・Zod スキーマ定義
- `features/project-types/components/` — 6コンポーネントのリネーム
- `routes/master/project-types/` — 4ルートファイル

**トレードオフ**:
- ✅ 実装確実性が高い（実績のあるパターンの転用）
- ✅ business-units と完全に一貫したUX
- ✅ 各 feature が独立し、features 間依存禁止の規約を遵守
- ❌ コードの重複が発生（DataTable, DataTableToolbar, DebouncedSearchInput 等）
- ❌ 将来的なパターン変更時に複数箇所の修正が必要

### Option B: 共通コンポーネントを抽出して再利用

**概要**: DataTable, DataTableToolbar, DebouncedSearchInput, DeleteConfirmDialog, RestoreConfirmDialog 等の汎用コンポーネントを `components/` や `packages/` に抽出し、project-types と business-units で共有する。

**トレードオフ**:
- ✅ コードの重複を最小化
- ✅ 将来のマスタ画面追加が容易
- ❌ 既存の business-units コードのリファクタリングが必要
- ❌ 汎用化のための抽象化コストが発生
- ❌ スコープが requirements の範囲を超える

### Option C: ハイブリッド（推奨候補としてのサブオプション）

**概要**: 今回は Option A で project-types を実装し、将来的に共通コンポーネント抽出を検討する。DebouncedSearchInput のように既に汎用性の高いコンポーネントは、今後の3つ目のマスタ画面追加時にリファクタリングの判断材料とする。

**トレードオフ**:
- ✅ 今回のスコープを最小限に保てる
- ✅ 3回目のパターン出現時にリファクタリング判断が可能（Rule of Three）
- ❌ 当面はコード重複を許容する必要がある

## 4. 実装複雑性とリスク

| 項目 | 評価 | 根拠 |
|------|------|------|
| **Effort** | **S（1-3日）** | 全要件が既存パターンの転用。新規のアーキテクチャ判断不要。バックエンド API 実装済み。 |
| **Risk** | **Low** | 確立済みパターンの複製。フロントエンド技術スタックは全て既存で使用実績あり。 |

## 5. 設計フェーズへの推奨事項

### 推奨アプローチ

**Option A（business-units からの複製・リネーム）** を推奨。理由:
1. エンティティ構造が完全に同一（code, name, displayOrder）
2. features 間依存禁止の規約を遵守
3. 最小スコープで requirements をすべてカバー

### 設計フェーズで確認すべき事項

- `DebouncedSearchInput` を feature 内にコピーするか、`components/` に共通化するか
- サイドバーメニューへの「案件タイプ」リンクの追加方法
- `routeTree.gen.ts` の自動生成への影響確認

### Research Needed 項目

なし — 全技術要素は既存コードベースで実証済み。

# Gap Analysis: project-case-study-ui

## 1. 現状調査（Current State）

### 1.1 関連アセット

| カテゴリ | 状態 | パス / 詳細 |
|----------|:----:|-------------|
| Feature モジュール `case-study/` | ❌ 未存在 | `features/case-study/` を新規作成する必要あり |
| ルートファイル（case-study 関連） | ❌ 未存在 | `routes/master/projects/$projectId/case-study/` を新規作成する必要あり |
| プロジェクト詳細画面 | ✅ 存在 | `routes/master/projects/$projectId/index.tsx` — ケーススタディへのリンク追加が必要 |
| プロジェクトFeature | ✅ 存在 | `features/projects/` — プロジェクト情報の参照に利用可能 |
| 間接ケーススタディFeature | ✅ 存在 | `features/indirect-case-study/` — UIパターン・API設計の参考 |
| バックエンドAPI（ProjectCase） | ✅ 実装済み | CRUD + restore 全エンドポイント実装済み |
| バックエンドAPI（ProjectLoad） | ✅ 実装済み | CRUD + bulk upsert 全エンドポイント実装済み |
| バックエンドAPI（StandardEffortMaster） | ✅ 実装済み | CRUD + restore + weights取得 実装済み |
| 共有UIコンポーネント | ✅ 存在 | alert-dialog, button, badge, input, label, select, table, separator, sheet 等 |
| DeleteConfirmDialog | ✅ 存在 | `components/shared/DeleteConfirmDialog.tsx` |
| API基盤（handleResponse, ApiError） | ✅ 存在 | `lib/api/` |
| チャートライブラリ | ❓ 未確認 | recharts の導入状況を要確認（Requirement 8 用） |
| AppShellメニュー | 🔧 変更必要 | `components/layout/AppShell.tsx` — ケーススタディ関連の追加は不要（案件詳細画面からの遷移のため） |

### 1.2 抽出された規約

| 規約 | 詳細 |
|------|------|
| Feature構成 | `api/`, `components/`, `hooks/`, `types/`, `index.ts` |
| Query Key Factory | 階層的キー定義（`all → lists → list(params) → details → detail(id)`） |
| Mutation パターン | `useMutation` + `queryClient.invalidateQueries` + `toast` |
| フォーム | TanStack Form + Zod バリデーション（`onChange` validators） |
| エラーハンドリング | `ApiError` + `problemDetails.status` で分岐 |
| トースト通知 | `sonner` — 成功: `toast.success`、失敗: `toast.error` (duration: Infinity) |
| パンくずリスト | `Link` + `ChevronRight` の手動構成 |
| 削除ダイアログ | `DeleteConfirmDialog` 共有コンポーネント |
| ルーティング | TanStack Router ファイルベース（`$param` で動的セグメント） |

### 1.3 統合面

| 統合ポイント | 説明 |
|-------------|------|
| プロジェクト詳細 → ケーススタディ | `projects/$projectId/index.tsx` に「ケーススタディ」リンクを追加 |
| URLパスパラメータ | `$projectId` は既存ルート構造に準拠、`$caseId` を追加 |
| APIレスポンス形式 | RFC 9457 準拠の共通形式（`data`, `meta`, `ProblemDetails`） |
| 標準工数マスタ参照 | 既存API（`/standard-effort-masters`）の参照のみ（変更不要） |

---

## 2. 要件実現性分析

### 2.1 技術ニーズ一覧

| 要件 | データモデル | API | UIコンポーネント | ビジネスルール |
|------|:----------:|:---:|:---------------:|:-----------:|
| Req 1: ケース一覧 | ProjectCase型 | GET list | サイドバーリスト | 論理削除フィルタ |
| Req 2: ケース作成 | CreateInput型 | POST | 専用ページフォーム | STANDARD/MANUAL分岐 |
| Req 3: 標準工数プレビュー | StandardEffort型 | GET detail | プレビューテーブル | weights表示 |
| Req 4: ケース編集 | UpdateInput型 | PUT | 専用ページフォーム | 部分更新 |
| Req 5: ケース削除 | - | DELETE | AlertDialog | 参照チェック(409) |
| Req 6: 月別工数テーブル | ProjectLoad型 | GET list | 水平スクロールテーブル | 表示範囲決定ロジック |
| Req 7: 工数インライン編集 | bulk upsert | PUT bulk | 入力フィールド群 | 変更追跡Map |
| Req 8: 月別工数チャート | - | - | エリアチャート | リアルタイム反映 |
| Req 9: バリデーション | Zodスキーマ | - | エラー表示 | STANDARD時必須条件 |
| Req 10: ルーティング | - | - | レイアウト | 3ルート構成 |
| Req 11: 状態管理 | QueryKey定義 | - | - | キャッシュ無効化 |
| Req 12: フィードバック | - | - | トースト | 送信中制御 |

### 2.2 ギャップ一覧

| ギャップ | 種類 | 影響 | 詳細 |
|----------|------|------|------|
| `features/case-study/` 未存在 | Missing | 高 | feature全体を新規作成（api, components, hooks, types） |
| ルートファイル未存在 | Missing | 高 | `case-study/` 配下に3ルート + レイアウト新規作成 |
| エリアチャートコンポーネント | Missing | 中 | recharts（または他チャートライブラリ）の導入が必要。workload featureにチャートがあるため参考可能 |
| サイドバー + メインの2カラムレイアウト | Missing | 中 | ケーススタディ画面固有のレイアウト新規作成。indirect-case-study（2パネル構成）を参考可能 |
| 水平スクロールテーブル | Missing | 中 | 月別工数の全期間表示用。既存のTableコンポーネントを拡張 |
| インライン編集機能 | Missing | 中 | テーブルセル内の編集モード切替 + 変更追跡 + bulk保存。indirect-case-studyのMonthlyHeadcountGridを参考可能 |
| プロジェクト詳細からのリンク | Constraint | 低 | 既存ファイルへの軽微な変更のみ |
| recharts依存 | Research Needed | 中 | workload featureでチャートライブラリが使われているか、新規導入が必要か要確認 |

### 2.3 複雑性シグナル

| シグナル | レベル | 該当要件 |
|----------|:------:|---------|
| CRUD操作 | 低 | Req 1-5（ケースCRUD） |
| フォーム分岐ロジック | 中 | Req 2-3（STANDARD/MANUAL分岐 + プレビュー） |
| インライン編集 | 中 | Req 7（変更追跡 + bulk upsert） |
| チャート描画 | 中 | Req 8（エリアチャート + リアルタイム反映） |
| 表示範囲決定 | 低 | Req 6（startYearMonth / durationMonths 条件分岐） |

---

## 3. 実装アプローチの選択肢

### Option A: 既存コンポーネント拡張

**該当**: 不適合

プロジェクトケーススタディUIは独立した画面・機能であり、既存のfeatureに収まらない。`features/projects/` の拡張では責務が肥大化する。

### Option B: 新規Feature作成（推奨）

**該当**: 最適

**理由**:
- ケーススタディは案件（projects）とは独立した機能ドメイン
- 独自のAPI群（project-cases, project-loads）を持つ
- 独自のUI構成（サイドバー + メイン2カラム）を持つ
- `features/case-study/` として独立feature化することで関心の分離が達成される

**作成するもの**:

| パス | 内容 |
|------|------|
| `features/case-study/api/api-client.ts` | ProjectCase + ProjectLoad APIクライアント |
| `features/case-study/api/queries.ts` | queryOptions + QueryKey Factory |
| `features/case-study/api/mutations.ts` | useMutation hooks（CRUD + bulk upsert） |
| `features/case-study/types/index.ts` | Zodスキーマ + TypeScript型定義 |
| `features/case-study/components/CaseSidebar.tsx` | ケース一覧サイドバー |
| `features/case-study/components/CaseForm.tsx` | 作成/編集共通フォーム |
| `features/case-study/components/StandardEffortPreview.tsx` | 標準工数プレビュー |
| `features/case-study/components/WorkloadCard.tsx` | 工数テーブル + インライン編集 |
| `features/case-study/components/WorkloadChart.tsx` | 月別工数エリアチャート |
| `features/case-study/components/DeleteCaseDialog.tsx` | ケース削除確認ダイアログ |
| `features/case-study/index.ts` | パブリックAPIエクスポート |
| `routes/master/projects/$projectId/case-study/index.tsx` | メイン画面 |
| `routes/master/projects/$projectId/case-study/new.tsx` | ケース新規作成 |
| `routes/master/projects/$projectId/case-study/$caseId/edit.tsx` | ケース編集 |

**既存ファイルへの変更**:

| パス | 変更内容 |
|------|---------|
| `routes/master/projects/$projectId/index.tsx` | 「ケーススタディ」リンクボタン追加 |

**トレードオフ**:
- ✅ 関心の完全分離
- ✅ 既存パターンに準拠した一貫性
- ✅ 独立テスト可能
- ✅ indirect-case-studyのパターンを参考にできる
- ❌ 新規ファイル数が多い（約12ファイル）
- ❌ チャートライブラリの導入判断が必要

### Option C: ハイブリッド

**該当**: 不要

単一featureとして十分に収まるため、ハイブリッドアプローチは過剰。

---

## 4. 要件-アセットマッピング

| 要件 | 既存アセット | ギャップ |
|------|-------------|---------|
| Req 1: サイドバー一覧 | Tableコンポーネント, Badge | **Missing**: CaseSidebar新規作成 |
| Req 2: ケース作成 | TanStack Form, Input, Select, Label | **Missing**: CaseForm新規作成, STANDARD/MANUAL分岐ロジック |
| Req 3: 標準工数プレビュー | Table, GET API | **Missing**: StandardEffortPreview新規作成 |
| Req 4: ケース編集 | Req 2のフォーム再利用 | **Missing**: 編集ルート新規作成 |
| Req 5: ケース削除 | DeleteConfirmDialog | ギャップなし（既存コンポーネント利用可能） |
| Req 6: 月別工数テーブル | Table | **Missing**: 水平スクロール + 動的列生成 |
| Req 7: インライン編集 | Input | **Missing**: 編集モード切替 + 変更追跡Map + bulk保存 |
| Req 8: チャート表示 | **Research Needed**: recharts | **Missing**: WorkloadChart新規作成 |
| Req 9: バリデーション | Zod, TanStack Form | ギャップなし（既存パターン適用） |
| Req 10: ルーティング | TanStack Router | **Missing**: ルートファイル3つ新規作成 |
| Req 11: 状態管理 | TanStack Query | ギャップなし（既存パターン適用） |
| Req 12: フィードバック | sonner, toast | ギャップなし（既存パターン適用） |

---

## 5. 実装複雑性・リスク評価

### 工数見積: **M（3〜7日）**

**理由**: 新規featureの作成だが、既存パターン（CRUD, フォーム, テーブル, クエリ）がすべて確立されており、それに準拠して構築できる。チャート部分とインライン編集がやや工数を要する。

### リスク: **Low**

**理由**:
- バックエンドAPI完全実装済みのためAPI連携リスクなし
- 既存パターン（TanStack Query, Form, Router）の延長で実装可能
- indirect-case-studyという非常に近いアナログが参考にできる
- チャートライブラリの導入のみ未確認だが、workload featureに既存実装がある可能性が高い

### Research Needed

| 項目 | 理由 | 設計フェーズでの対応 |
|------|------|---------------------|
| チャートライブラリ | recharts / Rechartsの導入状況と使い方を確認 | workload featureの`WorkloadChart`を調査 |
| TanStack Router レイアウトルート | `case-study/` 配下の共通レイアウト（サイドバー）をルートレベルで定義する方法 | `_layout.tsx` パターンの適用可否を確認 |

---

## 6. 設計フェーズへの推奨事項

### 推奨アプローチ: **Option B（新規Feature作成）**

### 主要な設計判断

1. **Feature構成**: `features/case-study/` を新規作成し、既存パターンに完全準拠
2. **フォーム共通化**: CaseForm を `mode: 'create' | 'edit'` で作成/編集を共有
3. **インライン編集**: 専用のWorkloadCard内で編集モード状態を管理
4. **チャート**: recharts（workload feature参照）でAreaChartを実装
5. **サイドバーレイアウト**: ケーススタディメイン画面のルートコンポーネントで2カラム構成

### 設計フェーズで持ち越す調査項目

- workload featureのチャート実装の詳細調査
- TanStack Routerのレイアウトルート（`_layout.tsx`）の適用方針
- indirect-case-studyの MonthlyHeadcountGrid パターンの再利用可否

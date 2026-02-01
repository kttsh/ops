# Research & Design Decisions

## Summary
- **Feature**: `project-case-study-ui`
- **Discovery Scope**: Extension（既存コードベースへのUI機能追加）
- **Key Findings**:
  - recharts v3.7.0 が既に導入済み。workload featureの `WorkloadChart` で `ComposedChart`, `Area`, `Line` 等を使用しており、AreaChart実装のパターンが確立されている
  - indirect-case-study featureが構造的に最も近いアナログであり、Sheet形式のフォーム、bulk操作、変更追跡のパターンをすべて参考にできる
  - TanStack Router のファイルベースルーティングで `$projectId` 配下のネストルートが既に存在し、`case-study/` サブディレクトリを追加するだけでルーティングが機能する

## Research Log

### recharts AreaChart 実装パターン
- **Context**: Requirement 8 の月別工数チャートにエリアチャートが必要
- **Sources Consulted**: `apps/frontend/src/features/workload/components/WorkloadChart.tsx`, `apps/frontend/package.json`
- **Findings**:
  - recharts v3.7.0 が `apps/frontend/package.json` に依存として存在
  - `WorkloadChart` は `ComposedChart` + `Area` + `Line` + `ResponsiveContainer` を使用
  - グラデーション定義は `<defs><linearGradient>` で実装
  - ツールチップはカスタム `Tooltip` コンポーネント
  - レスポンシブ対応は `ResponsiveContainer` でラップ
- **Implications**: 新規ライブラリ導入不要。recharts の `AreaChart` + `Area` でシンプルに実装可能

### インライン編集パターン
- **Context**: Requirement 7 の月別工数インライン編集に参考パターンが必要
- **Sources Consulted**: `features/indirect-case-study/components/MonthlyHeadcountGrid.tsx`
- **Findings**:
  - `useState` で `localData: Record<string, number>` を管理
  - サーバーデータとローカル編集データを分離管理
  - `onDirtyChange` コールバックで変更状態を親に通知
  - `onLocalDataChange` で編集データを親に伝播
  - Bulk upsert APIで一括保存
- **Implications**: 同様のパターンで実装可能。ただしケーススタディUIでは編集モード切替（読み取り/編集）が必要であり、MonthlyHeadcountGridよりやや複雑

### TanStack Router ネストルート構造
- **Context**: `/master/projects/$projectId/case-study/` 配下のルーティング設計
- **Sources Consulted**: `routes/master/projects/$projectId/index.tsx`, `routes/master/projects/$projectId/edit.tsx`
- **Findings**:
  - `$projectId` 配下に `index.tsx`（詳細）、`edit.tsx`（編集）が既存
  - `createFileRoute('/master/projects/$projectId/')` でルート定義
  - `Route.useParams()` でパスパラメータ取得
  - `Route.useNavigate()` でプログラム的遷移
- **Implications**: `case-study/index.tsx`, `case-study/new.tsx`, `case-study/$caseId/edit.tsx` を追加する標準パターンで実装可能

### API クライアントパターン
- **Context**: ProjectCase / ProjectLoad API クライアントの設計
- **Sources Consulted**: `features/projects/api/api-client.ts`, `features/indirect-case-study/api/`
- **Findings**:
  - `API_BASE_URL` + `fetch` + `handleResponse` の統一パターン
  - URLSearchParams でクエリパラメータ構築
  - `ApiError` で RFC 9457 ProblemDetails をラップ
  - bulk操作は `PUT` + `/bulk` エンドポイント
- **Implications**: 完全に既存パターンに準拠して実装

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 新規Feature（選択） | `features/case-study/` を独立featureとして新規作成 | 関心の分離、独立テスト、既存パターン準拠 | 新規ファイル数が多い | Gap分析のOption Bと一致 |
| Projects Feature拡張 | `features/projects/` にケーススタディ機能を追加 | ファイル数削減 | 責務肥大化、project CRUDとの混在 | 不採用 |

## Design Decisions

### Decision: サイドバー + メインの2カラムレイアウト
- **Context**: ケーススタディ画面はケース一覧と工数詳細を同時表示する必要がある
- **Alternatives Considered**:
  1. タブ切替方式 — ケース一覧と工数表示をタブで切替
  2. サイドバー + メイン — 左にケース一覧、右に工数表示
- **Selected Approach**: サイドバー + メイン2カラムレイアウト
- **Rationale**: ケース切替時に即座に工数情報を表示でき、比較ワークフローに適している。要件定義書のレイアウト仕様にも合致
- **Trade-offs**: 画面幅が狭い場合にサイドバーが圧迫されるが、レスポンシブ対応は現スコープ外
- **Follow-up**: サイドバー幅を固定（250px程度）とし、メインエリアは残りを占有

### Decision: フォーム共通化（CaseForm mode: create | edit）
- **Context**: ケース作成フォームと編集フォームが同一入力項目を持つ
- **Alternatives Considered**:
  1. 作成・編集で別コンポーネント
  2. mode prop で共通化
- **Selected Approach**: mode prop で共通化（`CaseForm`）
- **Rationale**: 既存パターン（ProjectForm, WorkTypeForm）と一致。メンテナンスコスト削減
- **Trade-offs**: 条件分岐がやや増えるが、入力項目が完全に同一のため影響は軽微

### Decision: 編集モード切替方式（読み取り/編集）
- **Context**: 月別工数テーブルは通常時は表示のみ、「編集」ボタンで編集モードに切替
- **Alternatives Considered**:
  1. 常時編集可能（MonthlyHeadcountGridパターン）
  2. モード切替方式
- **Selected Approach**: モード切替方式
- **Rationale**: 要件定義書（F-CS-009）の明確な仕様。意図しない変更を防止し、保存操作を明示的にする
- **Trade-offs**: モード管理の状態が増えるが、UXの明確さが勝る

## Risks & Mitigations
- recharts v3.7.0 のAreaChart APIは安定しており、既存WorkloadChartで実績あり → リスク低
- TanStack Router のネストルート追加は既存パターンの延長 → リスク低
- 標準工数マスタ取得APIが大量データの場合にセレクトボックスのパフォーマンス懸念 → ページネーション対応で緩和

## References
- recharts v3 ドキュメント — AreaChart API
- TanStack Router File-Based Routing ドキュメント
- 既存実装: `features/indirect-case-study/` — 最も近いアナログ
- 既存実装: `features/workload/components/WorkloadChart.tsx` — rechartsパターン

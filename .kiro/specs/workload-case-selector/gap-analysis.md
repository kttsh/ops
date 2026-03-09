# Gap Analysis: workload-case-selector

## 要約

`/workload` ダッシュボードに案件ごとのケース選択機能を追加するための実装ギャップ分析。既存コードベースは ChartView（プロファイル）経由でケース指定を既にサポートしているが、アドホックなケース選択（ChartView を使わない動的選択）は未対応。

---

## 1. 現状の資産マップ

### フロントエンド

| ファイル | 役割 | 現状 |
|----------|------|------|
| `SidePanelProjects.tsx` | サイドパネルの案件一覧 | 案件のチェック選択のみ。ケース情報は未表示 |
| `useChartData.ts` | チャートデータ取得・変換 | `ChartDataParams` を受け取り API を叩く。ケース指定なし |
| `useWorkloadFilters.ts` | URL Search Params ベースのフィルタ管理 | `chartDataParams` を構築。ケースパラメータなし |
| `workload/types/index.ts` | 型定義 | `ChartDataParams` に `projectIds?` はあるが案件ケースのマッピングなし |
| `workload/api/api-client.ts` | API クライアント | `fetchChartData` にケース指定パラメータなし |
| `workload/api/queries.ts` | TanStack Query 定義 | `chartDataQueryOptions` は `ChartDataParams` をそのまま渡す |
| `workload/index.lazy.tsx` | ワークロードページ本体 | `selectedProjectIds: Set<number>` で案件選択を管理。ケース状態なし |
| `case-study/api/queries.ts` | ケーススタディの TanStack Query | `projectCasesQueryOptions(projectId)` で案件別ケース取得可能（再利用候補） |

### バックエンド

| ファイル | 役割 | 現状 |
|----------|------|------|
| `routes/chartData.ts` | `GET /chart-data` ルート | `chartDataQuerySchema` でバリデーション。ケースマッピングパラメータなし |
| `types/chartData.ts` | スキーマ・型定義 | `ChartDataServiceParams` にケースマッピングなし |
| `services/chartDataService.ts` | ビジネスロジック | `chartViewId` 有無で分岐。デフォルトモードは `isPrimary = 1` 固定 |
| `data/chartDataData.ts` | SQL クエリ | `getProjectDetailsByDefault`: `pc.is_primary = 1` がハードコード |
| `routes/projectCases.ts` | `GET /projects/:projectId/project-cases` | 案件別ケース一覧 API（既存・再利用可能） |
| `types/projectCase.ts` | ProjectCase スキーマ・型 | `caseName`, `isPrimary`, `projectCaseId` 等完備 |

### DBスキーマ

| テーブル | 関連カラム | 備考 |
|----------|-----------|------|
| `project_cases` | `project_case_id`, `project_id`, `is_primary`, `case_name` | 案件と1:N の関係 |
| `project_load` | `project_case_id`, `year_month`, `manhour` | ケース単位の月別工数 |
| `chart_view_project_items` | `project_case_id` (nullable) | ChartView 経由のケース指定は既存 |

---

## 2. 要件とのギャップ

### Requirement 1: ケースセレクタUIの表示

| 技術ニーズ | 状態 | 詳細 |
|-----------|------|------|
| 案件カード内のケース選択UI | **Missing** | `SidePanelProjects.tsx` にケース関連の要素なし |
| 案件ごとのケース一覧データ取得 | **既存（部分的）** | `GET /projects/:projectId/project-cases` は存在するが、案件ごとに個別リクエストが必要。一括取得APIなし |
| ケースが1件のみの場合の非表示ロジック | **Missing** | ケース数の判定ロジックなし |

### Requirement 2: デフォルトケースの自動選択

| 技術ニーズ | 状態 | 詳細 |
|-----------|------|------|
| `isPrimary` ケースの特定 | **既存** | バックエンド側で `is_primary` カラムあり。ただしフロントエンドの案件一覧レスポンスには含まれていない |
| 初期表示時のデフォルト選択ロジック | **Missing** | フロントエンドにケース選択状態の管理機構なし |
| `isPrimary` なしのフォールバック | **Missing** | |

### Requirement 3: ケース選択によるチャート反映

| 技術ニーズ | 状態 | 詳細 |
|-----------|------|------|
| ケース選択状態→APIパラメータへの変換 | **Missing** | `ChartDataParams` にケースマッピングなし |
| APIレスポンス→チャート描画の変換 | **既存** | `useChartData.ts` の変換ロジックは案件単位で動作し、ケース変更に対して透過的に動作する見込み |

### Requirement 4: バックエンドAPIのケース指定対応

| 技術ニーズ | 状態 | 詳細 |
|-----------|------|------|
| API パラメータ拡張 | **Missing** | `chartDataQuerySchema` にケースマッピングパラメータなし |
| SQL クエリのケース指定対応 | **Missing** | `getProjectDetailsByDefault` は `is_primary = 1` がハードコード |
| 後方互換性 | **Constraint** | ケース未指定時は既存動作（`isPrimary`）を維持する必要あり |

### Requirement 5: 状態管理とデータ整合性

| 技術ニーズ | 状態 | 詳細 |
|-----------|------|------|
| 案件ごとのケース選択状態管理 | **Missing** | `selectedProjectIds: Set<number>` はあるが、ケースマッピング `Map<number, number>` は未実装 |
| 案件チェック解除時のクリア | **Missing** | `toggleProject` は `Set` の add/delete のみ |
| 再チェック時のデフォルト復元 | **Missing** | |

---

## 3. 実装アプローチの検討

### Option A: 既存コンポーネント拡張

**概要**: 既存のファイルに最小限の変更を加える

**変更ファイル**:
- `SidePanelProjects.tsx`: ケースセレクタUI追加
- `workload/types/index.ts`: `ChartDataParams` にケースマッピング追加
- `workload/api/api-client.ts`: `fetchChartData` のパラメータ構築拡張
- `workload/index.lazy.tsx`: ケース選択状態 (`Map<number, number>`) を追加
- バックエンド `types/chartData.ts`: `chartDataQuerySchema` と `ChartDataServiceParams` 拡張
- バックエンド `data/chartDataData.ts`: `getProjectDetailsByDefault` のSQLを動的ケースID対応に変更
- バックエンド `services/chartDataService.ts`: パラメータ受け渡し

**ケースデータ取得戦略**:
- 案件一覧API（`GET /projects`）のレスポンスにケース情報（`cases: { caseId, caseName, isPrimary }[]`）を追加
- または workload feature 内で案件IDごとに `projectCasesQueryOptions` を呼ぶ（N+1問題あり）

**トレードオフ**:
- ✅ 変更ファイル数が最小限
- ✅ 既存パターンとの整合性が高い
- ❌ `SidePanelProjects.tsx` (219行) が肥大化する可能性
- ❌ `workload/index.lazy.tsx` (408行) がさらに複雑化

### Option B: 新規コンポーネント分離

**概要**: ケース選択ロジックを専用のコンポーネント・フックに分離

**新規ファイル**:
- `workload/components/ProjectCaseSelector.tsx`: ケース選択UIコンポーネント
- `workload/hooks/useProjectCaseSelection.ts`: ケース選択状態管理フック

**変更ファイル**:
- `SidePanelProjects.tsx`: `ProjectCaseSelector` を案件カード内に配置
- `workload/types/index.ts`: ケースマッピング型追加
- `workload/api/api-client.ts`: パラメータ構築拡張
- バックエンド側は Option A と同じ

**トレードオフ**:
- ✅ 責務の分離が明確
- ✅ `SidePanelProjects` の肥大化を防止
- ✅ ケース選択ロジックのテストが容易
- ❌ ファイル数が増加
- ❌ コンポーネント間のデータフローが若干複雑化

### Option C: ハイブリッド（推奨）

**概要**: フロントエンドは Option B（分離）、バックエンドは Option A（最小拡張）

**フロントエンド**:
- `ProjectCaseSelector.tsx`: 案件カード内のドロップダウンUI
- `useProjectCaseSelection.ts`: ケース選択状態 + デフォルト初期化ロジック
- `SidePanelProjects.tsx` に新 props（`selectedCases`, `onCaseChange`）を追加

**バックエンド**:
- `chartDataQuerySchema` に `projectCaseIds` パラメータ追加（`"projectId:caseId,..."` のCSV形式）
- `getProjectDetailsByDefault` を拡張し、ケースID指定時は `is_primary = 1` の代わりに指定ケースIDで絞り込み

**ケースデータ取得**:
- プロジェクト一覧APIのレスポンスにケースサマリを含める（`cases: { projectCaseId, caseName, isPrimary }[]`）のが最も効率的
- 既存の `GET /projects/:projectId/project-cases` をワークロード feature から直接使用することも可能だが、案件数分のリクエスト発生が課題

**トレードオフ**:
- ✅ フロントエンド側は責務分離で保守性高
- ✅ バックエンド側は最小変更
- ✅ 後方互換性を自然に維持
- ❌ フロントエンドのファイル数増加（2ファイル）

---

## 4. API パラメータ設計の選択肢

### 選択肢 A: projectCaseIds (CSV)
```
GET /chart-data?...&projectCaseIds=101,102,105
```
- ✅ シンプル
- ❌ どの案件のケースか明示されない（バックエンド側で projectCaseId → projectId を解決可能だが）

### 選択肢 B: projectCaseMappings (key-value CSV)
```
GET /chart-data?...&projectCaseMappings=1:101,2:102,3:105
```
- ✅ 案件とケースの対応が明示的
- ❌ パース処理が必要

### 選択肢 C: projectCaseIds のみ（バックエンド解決）
`projectCaseIds` だけを送信し、バックエンドが `project_cases` テーブルから `project_id` を逆引き。未指定案件は `isPrimary` にフォールバック。

- ✅ フロントエンドは単純にケースIDのリストを送るだけ
- ✅ 後方互換性が自然（パラメータ未指定 = 全案件 isPrimary）
- ❌ バックエンドSQL の変更がやや複雑

**推奨**: 選択肢 C が最もシンプル。`projectCaseIds` は既存の `projectIds` と同じCSV形式で一貫性がある。

---

## 5. ケースデータ取得の課題

### 現状
- 案件ケース取得: `GET /projects/:projectId/project-cases` （案件ごとに個別リクエスト）
- 案件一覧: `GET /projects` のレスポンスにケース情報なし

### 選択肢

1. **案件一覧レスポンスにケースサマリを追加**（推奨）
   - `GET /projects` のレスポンスに `cases: { projectCaseId, caseName, isPrimary }[]` を追加
   - 1回のリクエストで全案件のケース情報を取得
   - 既存のプロジェクト一覧クエリに LEFT JOIN を追加

2. **バッチケース取得API を新設**
   - `GET /project-cases?projectIds=1,2,3` のような一括取得API
   - 既存APIに影響なし

3. **フロントエンドで案件ごとに個別取得**
   - 既存の `projectCasesQueryOptions(projectId)` を `useQueries` で並列実行
   - N+1 問題（案件数に比例するリクエスト数）

**推奨**: 選択肢 1。案件数が多い場合のパフォーマンスを考慮すると、1回のリクエストで済む方式が望ましい。

---

## 6. 複雑度・リスク評価

| 項目 | 評価 | 根拠 |
|------|------|------|
| **工数** | **M (3–7日)** | フロントエンド2–3ファイル新規、3–4ファイル変更。バックエンド3–4ファイル変更。既存パターンに沿った実装 |
| **リスク** | **Low–Medium** | 既存 ChartView のケース指定パターンが参考になる。API パラメータ設計とケースデータ取得方式の選定が主な設計判断 |

---

## 7. 設計フェーズへの引き継ぎ事項

### 主要な設計判断（設計フェーズで確定が必要）
1. **API パラメータ形式**: `projectCaseIds` CSV vs `projectCaseMappings` key-value — 選択肢 C（projectCaseIds のみ）を推奨
2. **ケースデータ取得方式**: 案件一覧レスポンス拡張 vs バッチAPI vs 個別取得 — 選択肢 1（レスポンス拡張）を推奨
3. **フロントエンド状態管理**: `Map<projectId, projectCaseId>` の管理場所（`workload/index.lazy.tsx` のローカル state vs 専用フック）

### Research Needed
- `GET /projects` のバックエンド SQL に `project_cases` の LEFT JOIN を追加する際のパフォーマンス影響（案件数 × ケース数）
- ケース選択状態のURL永続化の必要性（Issue #64 の Q5-3「ケース選択状態のプロファイル保存」は Open で将来対応の可能性）

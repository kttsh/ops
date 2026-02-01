# Research & Design Decisions

## Summary
- **Feature**: `workload-profile-bu-sync`
- **Discovery Scope**: Extension（既存システムの拡張）
- **Key Findings**:
  - chart_views の CRUD スタック（型→データ→Transform→サービス→ルート）にフィールド追加するパターンが確立済み
  - BU コードは複数選択可能（string[]）であり、NVARCHAR(MAX) に JSON 文字列として格納する方式が最適
  - `useWorkloadFilters.setBusinessUnits()` が既に存在し、フロントエンドの BU 復元はコールバック接続のみで完了

## Research Log

### JSON 配列の DB 格納方式
- **Context**: BU コードは複数選択可能であり、chart_views テーブルに格納する方式を決定する必要がある
- **Sources Consulted**: 既存コードベースの chartViewProjectItem パターン、SQL Server の NVARCHAR(MAX) 仕様
- **Findings**:
  - SQL Server は JSON 型を持たないため、NVARCHAR(MAX) に JSON 文字列として格納するのが標準的
  - 既存の chart_view_project_items は中間テーブルで管理しているが、BU コードはマスタ参照キーであり正規化の必要性が低い
  - `JSON.stringify()` / `JSON.parse()` で変換し、Transform 層で吸収するのがプロジェクトパターンに合致
- **Implications**: 新規テーブル不要。chartViewTransform.ts にシリアライズ/デシリアライズを追加

### ProfileManager の拡張ポイント
- **Context**: ProfileManager の Props と onApply コールバックに BU コードを追加する方法を検討
- **Sources Consulted**: ProfileManager.tsx、SidePanelSettings.tsx、workload/index.tsx のソースコード
- **Findings**:
  - ProfileManagerProps に `businessUnitCodes: string[]` を追加し、保存時に送信する
  - onApply コールバックの戻り値オブジェクトに `businessUnitCodes: string[] | null` を追加する
  - SidePanelSettings は親から受け取った `businessUnitCodes` を ProfileManager に透過的に渡す
  - WorkloadPage の handleProfileApply で `setBusinessUnits()` を呼び出す
- **Implications**: 3 ファイルの Props/コールバック型の変更が必要だが、ロジックの追加は最小限

### 後方互換性の確保
- **Context**: 既存の chart_views レコードには business_unit_codes が存在しない
- **Sources Consulted**: chartViewData.ts の findAll/findById、chartViewTransform.ts の toChartViewResponse
- **Findings**:
  - NULL 許容カラムとして追加すれば既存レコードへの影響なし
  - Transform 層で null → null（または undefined）として返却
  - フロントエンドで null/undefined の場合は BU 復元をスキップ
  - 既存プロファイルの上書き保存時に現在の BU 選択が自動的に追加される
- **Implications**: マイグレーション不要（ALTER TABLE ADD のみ）、データ移行不要

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A: フィールド追加 | chart_views に JSON カラム追加 | 最小変更、パターン準拠 | JSON 検索が非効率（不要だが） | **推奨** |
| B: 中間テーブル | chart_view_business_units テーブル新設 | 正規化、BU 別クエリ可 | CRUD 一式追加で工数増大 | オーバーエンジニアリング |
| C: localStorage | クライアント側のみで管理 | バックエンド変更なし | デバイス間共有不可、永続性なし | 要件不達 |

## Design Decisions

### Decision: BU コードの格納方式
- **Context**: 複数選択可能な BU コードをプロファイルに保存する方式
- **Alternatives Considered**:
  1. NVARCHAR(MAX) に JSON 配列文字列として格納
  2. 中間テーブル chart_view_business_units で正規化管理
  3. カンマ区切り文字列として格納
- **Selected Approach**: Option 1 — JSON 配列文字列
- **Rationale**: BU コードの検索・フィルタリングは不要。保存と復元のみが要件。JSON は TypeScript との親和性が高く、Transform 層で自然に変換できる
- **Trade-offs**: DB 内での直接検索は困難だが、要件上不要。カンマ区切りより堅牢（コード内にカンマを含む可能性を排除）
- **Follow-up**: Transform 層のテストで null / 空配列 / 複数要素のケースをカバー

### Decision: onApply コールバックの BU コード型
- **Context**: プロファイル適用時の BU コード受け渡し型
- **Alternatives Considered**:
  1. `businessUnitCodes: string[] | null` — DB の値をそのまま返す
  2. `businessUnitCodes?: string[]` — undefined で「BU 情報なし」を表現
- **Selected Approach**: Option 1 — `string[] | null`
- **Rationale**: DB の nullable カラムを忠実に表現。null と空配列の意味が異なる（null = 未保存の旧データ、[] = BU 未選択で保存）
- **Trade-offs**: 呼び出し側で null チェックが必要だが、後方互換の意図が明確
- **Follow-up**: null 時は BU 復元をスキップ、空配列時は BU 選択をクリア

## Risks & Mitigations
- 既存テストの更新漏れ → テスト対象ファイルリストを tasks.md で明示
- ALTER TABLE の手動実行忘れ → SQL スクリプトを design.md に明記
- BU コードが不正値の場合 → Zod スキーマで z.array(z.string()) バリデーション

## References
- GitHub Issue #26 — 要件の元情報
- `apps/backend/src/types/chartView.ts` — 既存 Zod スキーマパターン
- `apps/backend/src/transform/chartViewTransform.ts` — 既存 Transform パターン
- `apps/backend/src/data/chartViewData.ts` — 既存 CRUD SQL パターン

# Requirements Document

## Introduction

操業山積ダッシュボードのチャート描画に必要な集約データを、単一のAPIエンドポイント（`GET /chart-data`）で提供する。案件工数（ProjectLoad）、間接工数（MonthlyIndirectWorkLoad）、キャパシティ（MonthlyCapacity）の3種類のデータを、BU・期間・チャートビュー条件に基づいて月別に集約して返却する。間接工数については、間接作業比率マスタから種類別内訳を動的に導出して含める。

本APIは読み取り専用であり、既存のCRUD APIを置き換えるものではない。フロントエンドのN+1リクエスト問題、クライアント側集約処理の負荷、複数APIレスポンス間のデータ不整合リスクを解消する。

参照仕様:
- `docs/requirements/chart-data-api-spec.md`
- `docs/requirements/indirect-work-type-breakdown-spec.md`

## Requirements

### Requirement 1: 集約チャートデータの一括取得

**Objective:** As a フロントエンド開発者, I want 案件工数・間接工数・キャパシティを1回のAPIリクエストで月別集約データとして取得したい, so that N+1リクエスト問題を解消し、ダッシュボードチャートの描画パフォーマンスを向上させる

#### Acceptance Criteria
1. When `GET /chart-data` に必須パラメータ（`businessUnitCodes`, `startYearMonth`, `endYearMonth`）を指定してリクエストした場合, the Chart Data API shall `projectLoads`、`indirectWorkLoads`、`capacities` の3セクションを含むレスポンスを返却する
2. The Chart Data API shall レスポンスの `data` オブジェクト内にメタ情報（`period.startYearMonth`, `period.endYearMonth`, `businessUnitCodes`）を含める
3. The Chart Data API shall 読み取り専用のGETエンドポイントとして動作し、データの変更操作を一切行わない
4. The Chart Data API shall ソフトデリートされたレコード（`deleted_at IS NOT NULL`）を集約対象から除外する

### Requirement 2: 案件工数の集約

**Objective:** As a ダッシュボード利用者, I want 案件工数を案件タイプ単位で月別に集約して取得したい, so that 積み上げチャートに案件タイプ別のデータシリーズを描画できる

#### Acceptance Criteria
1. The Chart Data API shall 案件工数を `projectTypeCode` 単位で集約し、各案件タイプの `projectTypeCode`、`projectTypeName`、月別の `manhour` 合計を返却する
2. The Chart Data API shall 月別データを `yearMonth`（YYYYMM形式）と `manhour`（DECIMAL）のペアの配列として返却する
3. The Chart Data API shall 集約結果を `displayOrder` の昇順でソートする
4. When `projectTypeCode` が未設定（NULL）の案件が存在する場合, the Chart Data API shall 当該案件の工数も集約対象に含め、`projectTypeCode` を `null`、`projectTypeName` を `null` として返却する

### Requirement 3: 間接工数の取得と種類別内訳の導出

**Objective:** As a ダッシュボード利用者, I want 間接工数をケース単位で取得し、作業種類別の内訳も含めて表示したい, so that 間接作業の構成を種別ごとに色分けして積み上げ表示できる

#### Acceptance Criteria
1. The Chart Data API shall 間接工数を `indirectWorkCaseId` × `businessUnitCode` 単位で返却し、各エントリに `caseName`、月別の `manhour`（合計工数）、`source` を含める
2. The Chart Data API shall 各月のデータに `breakdown` 配列を含め、`indirect_work_type_ratios` テーブルの比率を適用して作業種類別の工数内訳を動的に導出する
3. The Chart Data API shall 年度の判定を日本の会計年度基準（4月〜翌3月）で行い、`yearMonth` の月が4以上なら当年、4未満なら前年を年度として比率を参照する
4. The Chart Data API shall `breakdown` 内の各エントリに `workTypeCode`、`workTypeName`、`manhour`（= 合計工数 × 比率、DECIMAL(10,2)で丸め）を含める
5. The Chart Data API shall 各月のデータに `breakdownCoverage`（比率合計値、0.0〜N.0）を含め、内訳がどの程度カバーしているかを示す
6. If 当該年度の比率が `indirect_work_type_ratios` に未登録の場合, the Chart Data API shall `breakdown` を空配列、`breakdownCoverage` を `0` として返却する
7. If 比率合計が1.0を超える場合, the Chart Data API shall エラーとせず、そのまま計算結果を返却し、`breakdownCoverage` で1.0超過を通知する
8. The Chart Data API shall `breakdown` 内のエントリを `work_types.display_order` の昇順でソートする

### Requirement 4: キャパシティの取得

**Objective:** As a ダッシュボード利用者, I want キャパシティをシナリオ単位で月別に取得したい, so that 需要との比較線をチャート上に描画できる

#### Acceptance Criteria
1. The Chart Data API shall キャパシティを `capacityScenarioId` 単位で返却し、各エントリに `scenarioName` と月別の `capacity` を含める
2. When `capacityScenarioIds` が指定された場合, the Chart Data API shall 指定されたシナリオのみのキャパシティを返却する
3. When `capacityScenarioIds` が未指定の場合, the Chart Data API shall キャパシティセクションを空配列で返却する

### Requirement 5: チャートビューによるフィルタリング

**Objective:** As a ダッシュボード利用者, I want 保存されたチャートビュー設定に基づいてデータを取得したい, so that ビューごとにカスタマイズされた表示項目でチャートを描画できる

#### Acceptance Criteria
1. When `chartViewId` が指定された場合, the Chart Data API shall `chart_view_project_items` から `isVisible = true` の案件項目を取得し、それらに紐づく案件ケースの工数のみを集約する
2. When `chartViewId` が指定された場合, the Chart Data API shall `chart_view_indirect_work_items` から `isVisible = true` の間接作業項目を取得し、それらに紐づくケースの間接工数のみを返却する
3. When `chartViewId` が指定され、かつ `capacityScenarioIds` が未指定の場合, the Chart Data API shall キャパシティセクションを空配列で返却する

### Requirement 6: デフォルト動作（chartViewId未指定時）

**Objective:** As a フロントエンド開発者, I want chartViewIdを指定しなくても合理的なデフォルトデータを取得したい, so that チャートビュー未作成時やクイックプレビュー時にもダッシュボードを表示できる

#### Acceptance Criteria
1. When `chartViewId` が未指定の場合, the Chart Data API shall 指定BUに属する全案件のうち、各案件の `isPrimary = true` のケースを自動選択して工数を集約する
2. When `chartViewId` が未指定で `indirectWorkCaseIds` が指定された場合, the Chart Data API shall 指定されたケースの間接工数を返却する
3. When `chartViewId` が未指定で `indirectWorkCaseIds` も未指定の場合, the Chart Data API shall `isPrimary = true` の間接作業ケースを自動選択して返却する

### Requirement 7: クエリパラメータのバリデーション

**Objective:** As a API利用者, I want 不正なパラメータに対して明確なエラーメッセージを受け取りたい, so that リクエストの修正箇所を迅速に特定できる

#### Acceptance Criteria
1. If `businessUnitCodes` が未指定または空の場合, the Chart Data API shall HTTP 400エラーをRFC 9457 Problem Details形式で返却する
2. If `startYearMonth` または `endYearMonth` がYYYYMM形式でない場合, the Chart Data API shall HTTP 400エラーをRFC 9457 Problem Details形式で返却する
3. If `startYearMonth` が `endYearMonth` より後の場合, the Chart Data API shall HTTP 400エラーをRFC 9457 Problem Details形式で返却する
4. If `startYearMonth` から `endYearMonth` までの期間が60ヶ月を超える場合, the Chart Data API shall HTTP 400エラーをRFC 9457 Problem Details形式で返却する
5. If `startYearMonth` または `endYearMonth` の月部分が01〜12の範囲外の場合, the Chart Data API shall HTTP 400エラーをRFC 9457 Problem Details形式で返却する
6. The Chart Data API shall `businessUnitCodes` の各コードを1〜20文字の範囲でバリデーションする

### Requirement 8: レスポンス構造の準拠

**Objective:** As a フロントエンド開発者, I want APIレスポンスがプロジェクト規約に準拠した一貫した構造であってほしい, so that 既存のAPIクライアントパターンを再利用できる

#### Acceptance Criteria
1. The Chart Data API shall 成功時のレスポンスを `{ data: { projectLoads, indirectWorkLoads, capacities, period, businessUnitCodes } }` 構造で返却する
2. The Chart Data API shall エラー時のレスポンスをRFC 9457 Problem Details形式（`type`, `title`, `status`, `detail`）で返却する
3. The Chart Data API shall レスポンスのフィールド名をcamelCaseで統一する

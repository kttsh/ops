# Implementation Plan

- [x] 1. バックエンド型定義とオンザフライ計算クエリ
- [x] 1.1 キャパシティライン関連の型定義を追加する
  - チャートデータの型定義ファイルに、キャパシティラインの行データ型（ケースID、ケース名、シナリオID、シナリオ名、事業部コード、年月、キャパシティ値）を追加する
  - キャパシティラインの集約型（ケース情報、シナリオ情報、ライン名称、月別キャパシティ配列）を追加する
  - チャートデータのレスポンス型で `capacities` フィールドを `capacityLines` に変更し、新しい集約型の配列とする
  - 既存の `CapacityAggregation` 型は他の参照箇所のために残す
  - _Requirements: 1.1, 1.4, 2.1_

- [x] 1.2 CROSS JOIN によるオンザフライ計算クエリを実装する
  - チャートデータのデータアクセス層に、人員計画ケースとキャパシティシナリオの CROSS JOIN で全組み合わせのキャパシティを動的計算するクエリ関数を新規追加する
  - 月別人員数テーブルと結合し、`人員数 × 1人あたり稼働時間` を SQL 内で計算する
  - 削除済み（soft delete）のケースとシナリオを WHERE 条件で除外する
  - 事業部コードと期間（開始年月〜終了年月）でフィルタリングする
  - パラメータ化クエリを使用し、既存のデータアクセスパターンに従う
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.3, 6.1, 6.2, 6.3_

- [x] 2. バックエンドサービス層の統合
- [x] 2.1 行データの集約・命名変換関数を実装する
  - サービス層に、キャパシティライン行データを（ケースID、シナリオID）の複合キーでグルーピングし月別に集計する変換関数を追加する
  - 同一キーの複数事業部のキャパシティ値を月ごとに合算する
  - 各ラインの名称を `{人員計画ケース名}({キャパシティシナリオ名})` の形式で生成する
  - 既存の `transformCapacities()` と同じパターン（Map ベースのグルーピング）に準拠する
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2_

- [x] 2.2 chart-data API のレスポンスをキャパシティラインに切り替える
  - `getChartData()` 内のキャパシティ取得処理を、既存の `getCapacities()`（monthly_capacity テーブル読み取り）から新しいオンザフライ計算関数に切り替える
  - `capacityScenarioIds` パラメータの有無に関わらず、常に全ケース × 全シナリオの組み合わせを計算・返却するようにする
  - レスポンスのフィールド名を `capacities` から `capacityLines` に変更する
  - 既存の `getCapacities()` メソッドは削除せず残す（既存 calculate API との互換性維持）
  - _Requirements: 1.1, 5.1, 5.2, 5.3_

- [x] 3. バックエンドテスト
- [x] 3.1 (P) 変換関数のユニットテストを作成する
  - 複数事業部の月別キャパシティが正しく合算されることを検証する
  - ライン名称が `{ケース名}({シナリオ名})` 形式で生成されることを検証する
  - 空入力（行データ 0 件）で空配列が返却されることを検証する
  - ケース 2 × シナリオ 3 の入力で 6 本の集約結果が生成されることを検証する
  - _Requirements: 1.2, 1.3, 1.4, 2.1, 2.2_

- [x] 3.2 (P) chart-data API の統合テストを作成する
  - n×m 本のキャパシティラインがレスポンスの `capacityLines` フィールドに含まれることを検証する
  - 削除済みのケース・シナリオがキャパシティラインに含まれないことを検証する
  - ケースまたはシナリオが 0 件の場合に空の `capacityLines` が返却されることを検証する
  - キャパシティ値が `人員数 × 1人あたり稼働時間` で正しく計算されることを既知の入力値で検証する
  - _Requirements: 1.1, 1.2, 1.3, 5.3, 6.1, 6.2, 6.3_

- [ ] 4. フロントエンド型定義とデータ変換
- [ ] 4.1 (P) フロントエンドの型定義をキャパシティライン対応に更新する
  - `ChartDataResponse` 型の `capacities` フィールドを `capacityLines` に変更し、バックエンドの新レスポンス型と一致させる
  - `CapacityLineAggregation` 型（ケースID、ケース名、シナリオID、シナリオ名、ライン名称、月別配列）を追加する
  - `AvailableCapacityLine` 型（複合キー、ケース情報、シナリオ情報、ライン名称）を追加する
  - `LegendMonthData` 型の `capacities` を `capacityLines` に変更し、ケースID・シナリオID・ライン名称・キャパシティ値の構造にする
  - `UseChartDataOptions` の `capacityColors` を `capLineColors`（string キー）に、`UseChartDataReturn` に `availableCapacityLines` を追加する
  - _Requirements: 1.1, 2.1, 3.4_

- [ ] 4.2 チャートデータ変換フックをキャパシティライン対応に更新する
  - `capacityLines` を `capacity_{ケースID}_{シナリオID}` の複合キーで `LineSeriesConfig` に変換する処理に書き換える
  - 全キャパシティラインに `strokeDasharray: "6 3"` を設定し破線で描画されるようにする
  - `capLineVisible` 状態に基づき、ON のラインのみ `seriesConfig.lines` に含めるフィルタリングを実装する
  - `capLineVisible` に存在しないキーはデフォルト `false`（OFF）として扱う
  - `rawResponse.capacityLines` から一意なライン一覧を抽出し `availableCapacityLines` として返却する
  - `legendDataByMonth` のキャパシティセクションを新しい `capacityLines` 構造に対応させ、visible なラインのみを含める
  - 色の割り当ては `capLineColors` を優先し、未設定の場合は `CAPACITY_COLORS` パレットからローテーションする
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

- [ ] 5. フロントエンド設定UIと互換性対応
- [ ] 5.1 キャパシティライン設定UIをn×m対応に更新する
  - 設定パネルのキャパシティセクションで、`availableCapacityLines` を受け取り n×m 本全てのラインを一覧表示する
  - 各ラインに Switch（ON/OFF トグル）と ColorPickerPopover を配置し、ラベルに `lineName`（`{ケース名}({シナリオ名})`）を表示する
  - `capLineVisible` / `capLineColors` の状態を複合キー `{ケースID}_{シナリオID}` で管理し、変更時にコールバックで親コンポーネントに通知する
  - 既存の `capVisible` / `capColors` / `onCapVisibleChange` / `onCapColorsChange` props を新しい props に置き換える
  - ワークロードページのルートコンポーネントで `availableCapacityLines` を設定パネルに渡す配線を行う
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 5.2 チャートビュープロファイルの後方互換性を確保する
  - プロファイル読み込み時に旧形式（`capacity_scenario_id` 単独キー）のキャパシティ設定を検出した場合、当該設定を無視しデフォルト全 OFF にフォールバックする
  - プロファイル適用処理で新形式の複合キーが存在しない場合もエラーにせず、デフォルト状態で動作することを確認する
  - _Requirements: 3.1_

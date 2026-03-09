# Requirements Document

## Introduction
`/workload` ダッシュボードにおいて、各案件（Project）に紐づく複数のケース（ProjectCase）から表示対象を個別に選択できる機能を追加する。現状では `isPrimary = true` のケースが自動選択されるのみだが、ユーザーが案件ごとにケースを切り替え、what-if 分析を柔軟に行えるようにする。

**GitHub Issue**: #64

## Requirements

### Requirement 1: ケースセレクタUIの表示
**Objective:** As a 事業部リーダー, I want サイドパネルの各案件カードでケースを選択したい, so that 案件ごとに異なるシナリオでの工数を比較できる

#### Acceptance Criteria
1. When ユーザーがワークロードダッシュボードのサイドパネルで案件タブを表示する, the ケースセレクタ shall 各案件カード内にケース選択UIを表示する
2. The ケースセレクタ shall 案件に紐づくすべてのケース（ProjectCase）を選択肢として表示する
3. The ケースセレクタ shall 各ケースのケース名を選択肢のラベルとして表示する
4. While 案件に紐づくケースが1件のみの場合, the ケースセレクタ shall ケース選択UIを非表示にする

### Requirement 2: デフォルトケースの自動選択
**Objective:** As a ユーザー, I want ダッシュボード表示時に主要ケースが自動選択されていてほしい, so that 追加操作なしで標準的な工数状況を確認できる

#### Acceptance Criteria
1. When ワークロードダッシュボードが初期表示される, the システム shall 各案件について `isPrimary = true` のケースをデフォルトで選択する
2. When 案件がサイドパネルで新たにチェック（有効化）される, the システム shall その案件の `isPrimary = true` のケースを自動選択する
3. If 案件に `isPrimary = true` のケースが存在しない場合, the システム shall 最初のケースをデフォルトとして選択する

### Requirement 3: ケース選択によるチャート反映
**Objective:** As a 事業部リーダー, I want ケース選択の変更がチャートに即座に反映されてほしい, so that シナリオ比較をリアルタイムで行える

#### Acceptance Criteria
1. When ユーザーがケースセレクタで別のケースを選択する, the チャート shall 選択されたケースの工数データで積み上げグラフを更新する
2. When 複数の案件でそれぞれ異なるケースが選択されている, the チャート shall 各案件の選択されたケースの工数データを組み合わせて表示する
3. While チャートデータの取得中, the システム shall 適切なローディング状態を表示する

### Requirement 4: バックエンドAPIのケース指定対応
**Objective:** As a フロントエンドアプリケーション, I want chart-data APIにケースを指定してリクエストしたい, so that 選択されたケースのデータのみを取得できる

#### Acceptance Criteria
1. The `GET /chart-data` API shall 案件ごとのケースID指定パラメータを受け付ける
2. When ケースIDが指定された案件がある場合, the API shall 指定されたケースIDのデータを返却する
3. When ケースIDが指定されていない案件がある場合, the API shall 従来通り `isPrimary = true` のケースのデータを返却する（後方互換性の維持）
4. If 指定されたケースIDが存在しない、または指定された案件に属さない場合, the API shall 該当案件のデータを `isPrimary` のケースにフォールバックする

### Requirement 5: 状態管理とデータ整合性
**Objective:** As a ユーザー, I want ケース選択状態が操作中に適切に維持されてほしい, so that 意図しないリセットなく分析を続けられる

#### Acceptance Criteria
1. While ユーザーが他の案件のケースを変更している間, the システム shall 既に選択済みの他の案件のケース選択状態を維持する
2. When ユーザーがサイドパネルで案件のチェックを外す, the システム shall その案件のケース選択状態をクリアする
3. When チェックを外した案件を再度チェックする, the システム shall デフォルトケース（`isPrimary`）で再選択する

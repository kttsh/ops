# Requirements Document

## Introduction

本仕様は「間接作業・キャパシティ設定画面」の要件を定義する。ビジネスユニット（BU）ごとのキャパシティ（生産能力）と間接作業工数を計算・管理し、複数のケース・シナリオによるwhat-if分析を可能にする画面である。

参照ドキュメント: `docs/requirements/indirect-requirements.md`

## Requirements

### Requirement 1: ビジネスユニット選択

**Objective:** As a 事業部リーダー, I want ヘッダーでビジネスユニットを切り替えてデータをフィルタリングしたい, so that 自分の担当BUのデータに集中して作業できる

#### Acceptance Criteria

1. The 間接作業・キャパシティ設定画面 shall ヘッダー右側にBU選択ドロップダウンを表示する
2. When BUが選択される, the 画面 shall サーバーサイドで `filter[businessUnitCode]` を各一覧APIに送信し、該当BUのデータのみを取得・表示する
3. The 画面 shall 初期表示時にユーザーの所属BUまたは先頭のBUを選択状態にする
4. The BU選択ドロップダウン shall `GET /business-units` から取得したBU一覧を選択肢として表示する
5. While BU切替中, the 画面 shall 全体にローディングオーバーレイを表示する
6. The 画面 shall キャパシティシナリオ一覧をBUフィルタの対象外とする（グローバルマスタのため）

### Requirement 2: 人員計画ケース管理

**Objective:** As a 事業部リーダー, I want 人員計画のケースを複数作成・管理したい, so that 楽観・標準・悲観などの異なる人員計画を比較検討できる

#### Acceptance Criteria

1. The 画面 shall 人員計画ケース一覧をリスト形式で表示する（`GET /headcount-plan-cases`、BUフィルタ・ページネーション対応）
2. When [+ 新規作成]ボタンがクリックされる, the 画面 shall ケース名（必須、1〜100文字）・説明（任意、0〜500文字）・プライマリフラグを入力するオーバーレイフォームを表示する
3. When ケースのラジオボタンがクリックされる, the 画面 shall 該当ケースを選択状態にし、対応する月次人員数データを読み込む
4. When [編集]ボタンがクリックされる, the 画面 shall 選択されたケースの情報を編集するオーバーレイフォームを表示する
5. When [削除]ボタンがクリックされる, the 画面 shall 確認ダイアログを表示し、確認後に `DELETE /headcount-plan-cases/:id` で論理削除する
6. When [復元]ボタンがクリックされる, the 画面 shall `POST /headcount-plan-cases/:id/actions/restore` で論理削除されたケースを復元する
7. When ケースの作成・更新フォームで保存される, the 画面 shall `POST` または `PUT /headcount-plan-cases/:id` でサーバーに送信する
8. If ケース名が空または100文字超の場合, the 画面 shall 「名前を入力してください」とバリデーションエラーを表示する
9. While ケース切替中, the 画面 shall 対象セクションのみにスケルトンローディングを表示する

### Requirement 3: 月次人員数入力

**Objective:** As a 事業部リーダー, I want 年度ごとに月次の人員数を入力したい, so that 月単位の人員計画を正確に設定できる

#### Acceptance Criteria

1. When 人員計画ケースが選択される, the 画面 shall `GET /headcount-plan-cases/:id/monthly-headcount-plans?businessUnitCode=XXX` で月次人員数を取得し、年度ごとの12ヶ月グリッド形式で表示する
2. The 月次人員数グリッド shall 年度選択ドロップダウンによるページング切替に対応する（4月〜翌3月の年度単位）
3. The 各月の入力フィールド shall 0以上の整数のみを受け付ける
4. If 人員数に負の数または小数が入力された場合, the 画面 shall 「0以上の整数を入力してください」とバリデーションエラーを表示する
5. When [一括入力]ボタンがクリックされる, the 画面 shall 対象年度と人員数を入力するダイアログを表示する
6. When 一括入力ダイアログで[設定]がクリックされる, the 画面 shall 選択した年度の全月（4月〜翌3月）に同じ人員数を設定する
7. When [人員計画を保存]ボタンがクリックされる, the 画面 shall `PUT /headcount-plan-cases/:id/monthly-headcount-plans/bulk` で月次人員数を一括保存する
8. The 月次人員数 shall 最大120ヶ月（10年分）の期間に対応する

### Requirement 4: キャパシティシナリオ管理

**Objective:** As a 事業部リーダー, I want 労働時間の異なるキャパシティシナリオを複数作成したい, so that 定時・残業あり等の条件でキャパシティを比較できる

#### Acceptance Criteria

1. The 画面 shall キャパシティシナリオ一覧をリスト形式で表示する（`GET /capacity-scenarios`、BUフィルタなし・ページネーション対応）
2. When [+ 新規作成]ボタンがクリックされる, the 画面 shall シナリオ名（必須、1〜100文字）・説明（任意、0〜500文字）・1人当たり月間労働時間（hours_per_person）・プライマリフラグを入力するオーバーレイフォームを表示する
3. When シナリオのラジオボタンがクリックされる, the 画面 shall 該当シナリオを選択状態にする
4. When [編集]ボタンがクリックされる, the 画面 shall 選択されたシナリオの情報を編集するオーバーレイフォームを表示する
5. When [削除]ボタンがクリックされる, the 画面 shall 確認ダイアログを表示し、確認後に `DELETE /capacity-scenarios/:id` で論理削除する
6. When [復元]ボタンがクリックされる, the 画面 shall `POST /capacity-scenarios/:id/actions/restore` で論理削除されたシナリオを復元する
7. If 労働時間（hoursPerPerson）が0以下または744超の場合, the 画面 shall 「0超〜744の範囲で入力してください」とバリデーションエラーを表示する
8. The 画面 shall 労働時間のデフォルト値を160.00（時間/月）とする

### Requirement 5: キャパシティ計算

**Objective:** As a 事業部リーダー, I want 人員計画とキャパシティシナリオに基づいてキャパシティを自動計算したい, so that 月別の生産能力を定量的に把握できる

#### Acceptance Criteria

1. When [キャパシティ計算]ボタンがクリックされる, the 画面 shall 選択中のキャパシティシナリオIDと人員計画ケースIDを使って `POST /capacity-scenarios/:id/actions/calculate` を呼び出す
2. The キャパシティ計算API shall `キャパシティ[月][BU] = 人員数[月][BU] × hoursPerPerson` の計算式で月次キャパシティを算出する
3. When 計算が完了する, the 画面 shall 計算結果エリアにキャパシティの月次テーブルを表示する
4. While 計算実行中, the 画面 shall 計算結果エリアにローディングインジケータを表示する
5. If 人員計画ケースまたはキャパシティシナリオが未選択の場合, the 画面 shall 計算ボタンを非活性にする
6. The 計算APIリクエスト shall 任意で `businessUnitCodes`（対象BU絞り込み）、`yearMonthFrom`・`yearMonthTo`（期間範囲）を指定可能とする

### Requirement 6: 間接作業ケース管理

**Objective:** As a 事業部リーダー, I want 間接作業の比率パターンをケースとして管理したい, so that 異なる間接作業の想定で工数影響を比較できる

#### Acceptance Criteria

1. The 画面 shall 間接作業ケース一覧をリスト形式で表示する（`GET /indirect-work-cases`、BUフィルタ・ページネーション対応）
2. When [+ 新規作成]ボタンがクリックされる, the 画面 shall ケース名（必須、1〜100文字）・説明（任意、0〜500文字）・プライマリフラグを入力するオーバーレイフォームを表示する
3. When ケースのラジオボタンがクリックされる, the 画面 shall 該当ケースを選択状態にし、対応する間接作業比率データを読み込む
4. When [編集]ボタンがクリックされる, the 画面 shall 選択されたケースの情報を編集するオーバーレイフォームを表示する
5. When [削除]ボタンがクリックされる, the 画面 shall 確認ダイアログを表示し、確認後に `DELETE /indirect-work-cases/:id` で論理削除する
6. When [復元]ボタンがクリックされる, the 画面 shall `POST /indirect-work-cases/:id/actions/restore` で論理削除されたケースを復元する

### Requirement 7: 間接作業比率入力

**Objective:** As a 事業部リーダー, I want 年度と作業種類のマトリクスで間接作業比率を入力したい, so that 教育・会議・見積等の間接作業割合を年度ごとに細かく設定できる

#### Acceptance Criteria

1. When 間接作業ケースが選択される, the 画面 shall `GET /indirect-work-cases/:id/indirect-work-type-ratios` で間接作業比率を取得し、年度（列）×作業種類（行）のマトリクス形式で表示する
2. The 作業種類 shall `GET /work-types` から取得したマスタデータを使用する
3. The 比率入力 shall UI上で0〜100%の範囲で入力し、API送信時に0〜1（DECIMAL(5,4)）に変換する
4. If 比率が0%未満または100%超の場合, the 画面 shall 「0〜100%の範囲で入力してください」とバリデーションエラーを表示する
5. The マトリクス shall 各年度の全作業種類比率の合計行を表示する
6. When [間接作業設定を保存]ボタンがクリックされる, the 画面 shall `PUT /indirect-work-cases/:id/indirect-work-type-ratios/bulk` で間接作業比率を一括保存する

### Requirement 8: 間接作業工数計算

**Objective:** As a 事業部リーダー, I want キャパシティと間接作業比率から間接工数を自動計算したい, so that 間接作業に消費される工数の見通しを立てられる

#### Acceptance Criteria

1. When [間接作業計算]ボタンがクリックされる, the 画面 shall フロントエンドで `間接工数[月] = キャパシティ[月] × Σ(比率[年度][種類])` の計算を実行する
2. The 計算 shall 年度判定を日本の会計年度（4月〜翌3月）に基づいて行う
3. When 計算が完了する, the 画面 shall 計算結果を `source: 'calculated'` として計算結果エリアに表示する
4. If キャパシティが未計算の場合, the 画面 shall 間接作業計算ボタンを非活性にするか、エラーメッセージを表示する
5. If 間接作業ケースが未選択の場合, the 画面 shall 間接作業計算ボタンを非活性にする

### Requirement 9: 計算結果表示

**Objective:** As a 事業部リーダー, I want キャパシティと間接作業の計算結果を一覧で確認したい, so that 月別の生産能力と間接作業工数の関係を把握できる

#### Acceptance Criteria

1. The 計算結果エリア shall 年度選択ドロップダウンで年度を切り替えて表示する（4月〜翌3月）
2. The 計算結果テーブル shall 以下の行を含む：人員数（人）、キャパシティ（時間）、間接内訳（作業種類ごと）、間接合計、直接作業可能時間
3. The 間接内訳 shall 折りたたみ可能とする（デフォルト: 展開状態）
4. The 間接内訳の各種類 shall `キャパシティ × 該当年度の該当種類比率` でフロントエンド側で按分計算して表示する（DBに保存しない）
5. The 直接作業可能時間 shall `キャパシティ − 間接作業工数合計` でフロントエンド側で算出して表示する（DBに保存しない）
6. The 計算結果テーブル shall 年間合計列を含む
7. The 計算結果エリア上部 shall 選択中の条件（人員計画ケース名・シナリオ名・間接作業ケース名）を表示する
8. The 人員数行 shall `monthly_headcount_plans` から参照して表示する

### Requirement 10: 間接作業工数保存

**Objective:** As a 事業部リーダー, I want 間接作業工数の計算結果をDBに保存したい, so that 計算結果を他の画面やダッシュボードから参照できる

#### Acceptance Criteria

1. The 画面 shall キャパシティ計算API（`POST /capacity-scenarios/:id/actions/calculate`）の実行時にキャパシティ結果がDB自動保存されるため、キャパシティの手動保存ボタンを設けない
2. When [間接作業工数を保存]ボタンがクリックされる, the 画面 shall 間接作業工数結果を `PUT /indirect-work-cases/:id/monthly-indirect-work-loads/bulk` で一括保存する
3. When 保存が成功する, the 画面 shall トースト通知「保存しました」を表示する
4. If 保存が失敗する, the 画面 shall トースト通知（エラー）「保存に失敗しました」を表示する
5. While 保存中, the 画面 shall ボタンにスピナーを表示する

### Requirement 11: レスポンシブレイアウト

**Objective:** As a ユーザー, I want 異なる画面サイズで適切に表示されたい, so that デスクトップでもタブレットでも快適に操作できる

#### Acceptance Criteria

1. While 画面幅が1200pxを超える, the 画面 shall 2カラムレイアウト（設定50%:結果50%）で表示する
2. While 画面幅が768px以上1200px以下, the 画面 shall 2カラムレイアウト（設定60%:結果40%）で表示する
3. While 画面幅が768px未満, the 画面 shall 1カラムレイアウト（縦積み）で表示する

### Requirement 12: 未保存変更の警告

**Objective:** As a ユーザー, I want 未保存の変更がある場合に警告を受けたい, so that 意図せず変更を失うことを防げる

#### Acceptance Criteria

1. When 未保存の変更がある状態でBU切替を試みる, the 画面 shall 「変更が保存されていません」ダイアログを表示する
2. When 未保存の変更がある状態でケース切替を試みる, the 画面 shall 「変更が保存されていません」ダイアログを表示する
3. When 未保存の変更がある状態で画面遷移を試みる, the 画面 shall 「変更が保存されていません」ダイアログを表示する
4. When 未保存の変更がある状態でブラウザタブを閉じようとする, the 画面 shall ブラウザネイティブの離脱警告を表示する
5. The 未保存警告ダイアログ shall [キャンセル]・[保存せず移動]・[保存] の3つの選択肢を提供する

### Requirement 13: Excelエクスポート

**Objective:** As a 事業部リーダー, I want 計算結果をExcelファイルでエクスポートしたい, so that 報告書や他のツールで結果を活用できる

#### Acceptance Criteria

1. When [Excelエクスポート]ボタンがクリックされる, the 画面 shall 計算結果テーブルの内容をExcelファイル（.xlsx）としてダウンロードする
2. The エクスポートファイル shall 選択中の条件（人員計画ケース名・シナリオ名・間接作業ケース名）をヘッダーに含む
3. The エクスポートファイル shall 人員数・キャパシティ・間接内訳・間接合計・直接作業可能時間の全行を含む

### Requirement 14: 操作フィードバック

**Objective:** As a ユーザー, I want 操作結果のフィードバックを即座に受けたい, so that 操作が成功したか失敗したかを確認できる

#### Acceptance Criteria

1. When 保存が成功する, the 画面 shall トースト通知「保存しました」を表示する
2. If 保存が失敗する, the 画面 shall トースト通知（エラー）「保存に失敗しました」を表示する
3. When 削除が成功する, the 画面 shall トースト通知「削除しました」を表示する
4. When 復元が成功する, the 画面 shall トースト通知「復元しました」を表示する
5. When 計算が完了する, the 画面 shall 計算結果エリアの内容を更新する
6. While 保存処理中, the 画面 shall 該当ボタンにスピナーを表示する

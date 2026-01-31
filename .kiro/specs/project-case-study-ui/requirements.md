# Requirements Document

## Introduction

本仕様は「プロジェクトケーススタディUI」の要件を定義する。案件（プロジェクト）の工数見積を複数のパターン（ケース）で作成・比較するためのフロントエンド画面であり、案件詳細画面のサブ画面として位置づけられる。STANDARDモード（標準工数マスタ活用）とMANUALモード（手動入力）の2つの計算モードに対応し、月別工数の可視化・編集を行う。

参照ドキュメント: `docs/requirements/case-study-requirements.md`

## Requirements

### Requirement 1: ケース一覧表示（サイドバー）

**Objective:** As a プロジェクトマネージャー, I want 案件に紐づくケースをサイドバーで一覧表示したい, so that 複数のケースを素早く切り替えて確認・比較できる

#### Acceptance Criteria

1. The ケーススタディ画面 shall 左サイドバーに案件に紐づくケース一覧をリスト形式で表示する（`GET /projects/:projectId/project-cases`、ページネーション対応）
2. The 各ケースアイテム shall ケース名（太字・truncate）、計算モードバッジ（STANDARD: プライマリカラー / MANUAL: セカンダリカラー）、プライマリバッジ（isPrimary=true時）、説明（1行省略）、編集ボタン、削除ボタンを表示する
3. When ケースアイテムがクリックされる, the 画面 shall 当該ケースを選択状態にし、右側メインエリアに工数情報を表示する
4. The 選択中のアイテム shall プライマリカラーの左ボーダーと背景色変化で視覚的に区別する
5. When ケースが0件の場合, the 画面 shall 「ケースが見つかりませんでした」メッセージを表示する
6. While データ読み込み中, the サイドバー shall 「読み込み中...」を表示する
7. The サイドバー shall 論理削除済みケースをデフォルトで非表示とする（`filter[includeDisabled]=false`）
8. The サイドバー上部 shall 「新規作成」ボタン（+アイコン付き）を表示する

### Requirement 2: ケース新規作成

**Objective:** As a 計画担当者, I want STANDARD/MANUALモードでケースを新規作成したい, so that 標準パターン適用または手動入力による工数見積を開始できる

#### Acceptance Criteria

1. When 「新規作成」ボタンがクリックされる, the 画面 shall ケース新規作成ページ（`/master/projects/$projectId/case-study/new`）に遷移する
2. The 作成ページ shall パンくずリスト（案件一覧 > 案件詳細 > ケーススタディ > 新規作成）、ページタイトル「新規ケース作成」、説明テキストを表示する
3. The 作成フォーム shall ケース名（必須、1〜100文字）、計算モード（ラジオ: STANDARD/MANUAL、初期値: MANUAL）、標準工数マスタ（STANDARDモード時必須）、説明（任意、500文字以内）、プライマリフラグ、開始年月（YYYYMM形式）、期間月数（正の整数）、総工数（0以上の整数）を入力項目として表示する
4. When 計算モードで「STANDARD」が選択される, the フォーム shall 標準工数マスタセレクトボックスを入力可能にする
5. When 計算モードで「MANUAL」が選択される, the フォーム shall 標準工数マスタセレクトボックスを入力不可にし、情報パネル「MANUALモードでは、月別工数を手動で入力します。工数データはケーススタディ画面で入力してください。」を表示する
6. When 「作成」ボタンがクリックされる, the 画面 shall バリデーション実行後に `POST /projects/:projectId/project-cases` でケースを作成し、成功時にトースト通知「ケースを作成しました」を表示してケーススタディ画面に遷移する
7. If 作成に失敗した場合, the 画面 shall エラートースト通知「ケースの作成に失敗しました」を表示する
8. When 「キャンセル」ボタンがクリックされる, the 画面 shall 入力内容を破棄してケーススタディ画面に戻る
9. While 送信中, the 画面 shall 「作成」ボタンのテキストを「作成中...」に変更し、ボタンを無効化する

### Requirement 3: 標準工数プレビュー

**Objective:** As a 計画担当者, I want STANDARDモード選択時に標準工数の重み付け分布を確認したい, so that 適切な標準工数パターンを選択できる

#### Acceptance Criteria

1. When STANDARDモードで標準工数マスタが選択される, the フォーム shall `GET /standard-effort-masters/:id` で標準工数詳細（weights含む）を取得し、フォーム内にプレビューを表示する
2. The プレビュー shall タイトル「{name} - 工数配分プレビュー」、進捗率(%)と重みの2列テーブルを表示する
3. The プレビューテーブル shall 最大高さ256pxでオーバーフロー時にスクロール可能とする
4. The 重み値 shall 整数で表示する
5. While 標準工数マスタが未選択, the プレビューエリア shall 「標準工数マスタを選択してください」メッセージを表示する
6. While 標準工数データ読み込み中, the プレビューエリア shall 「読み込み中...」メッセージを表示する

### Requirement 4: ケース編集

**Objective:** As a プロジェクトマネージャー, I want 既存ケースのメタ情報を編集したい, so that ケース名・計算モード・パラメータを修正できる

#### Acceptance Criteria

1. When サイドバーの「編集」ボタンがクリックされる, the 画面 shall ケース編集ページ（`/master/projects/$projectId/case-study/$caseId/edit`）に遷移する（イベント伝搬停止）
2. The 編集ページ shall パンくずリスト（案件一覧 > 案件詳細 > ケーススタディ > ケース編集）、ページタイトル「ケース編集」、説明テキストを表示する
3. The 編集フォーム shall ケース作成ページと同一の入力項目を表示し、現在値をプリセットする
4. The 編集フォーム shall 全項目をオプショナルとし、部分更新に対応する
5. When 「更新」ボタンがクリックされる, the 画面 shall バリデーション実行後に `PUT /projects/:projectId/project-cases/:projectCaseId` でケースを更新し、成功時にトースト通知「ケースを更新しました」を表示してケーススタディ画面に遷移する
6. If 更新に失敗した場合, the 画面 shall エラートースト通知「ケースの更新に失敗しました」を表示する
7. When 「キャンセル」ボタンがクリックされる, the 画面 shall 変更内容を破棄してケーススタディ画面に戻る
8. While 送信中, the 画面 shall 「更新」ボタンのテキストを「更新中...」に変更し、ボタンを無効化する

### Requirement 5: ケース削除

**Objective:** As a プロジェクトマネージャー, I want 不要なケースを削除したい, so that ケース一覧を整理できる

#### Acceptance Criteria

1. When サイドバーの「削除」ボタンがクリックされる, the 画面 shall 削除確認AlertDialog（タイトル「ケースを削除しますか？」、本文にケース名（太字）と「この操作により、ケースが無効化されます。」）を表示する（イベント伝搬停止）
2. When ダイアログの「削除」ボタンがクリックされる, the 画面 shall `DELETE /projects/:projectId/project-cases/:projectCaseId` でケースを論理削除する
3. When 削除が成功する, the 画面 shall トースト通知「ケースを削除しました」を表示し、削除されたケースが選択中の場合は選択状態をクリアする
4. If 削除に失敗した場合, the 画面 shall エラートースト通知「ケースの削除に失敗しました」を表示する
5. If 他リソース（project_load / chart_view_project_items）から参照されている場合, the API shall 409 Conflictを返却する
6. While 削除中, the 画面 shall 「削除」ボタンのテキストを「削除中...」に変更し、ボタンを無効化する

### Requirement 6: 月別工数テーブル表示

**Objective:** As a プロジェクトマネージャー, I want 選択ケースの月別工数を全期間テーブルで確認したい, so that 工数分布の全体像を把握できる

#### Acceptance Criteria

1. When ケースが選択される, the 画面 shall `GET /project-cases/:projectCaseId/project-loads` で月別工数データを取得し、工数カード内に全期間水平スクロールテーブルで表示する
2. The 工数カード shall タイトル「工数」、サブタイトル「{ケース名}」、右上に「編集」ボタンを表示する
3. The テーブルヘッダー shall YYYY/MM形式の年月ラベルを表示する
4. The テーブル shall ケースの `startYearMonth` と `durationMonths` が設定されている場合はその範囲、未設定の場合はデータが存在する月の範囲、データ0件の場合は現在年の12ヶ月をデフォルト表示する
5. The 数値 shall 日本語ロケール（カンマ区切り）で表示する
6. The データが存在しない月 shall 0として表示する
7. While ケース未選択, the メインエリア shall 「ケースを選択してください」メッセージを表示する

### Requirement 7: 月別工数インライン編集

**Objective:** As a プロジェクトマネージャー, I want テーブル上で月別工数を直接編集・保存したい, so that 効率的に工数を調整できる

#### Acceptance Criteria

1. When 「編集」ボタンがクリックされる, the テーブル shall 全月の値を数値入力フィールド（幅80px、高さ32px、中央揃え、最小0、最大99,999,999、ステップ1、スピンボタン非表示）に切り替える
2. The 編集モード shall 「保存」ボタンと「キャンセル」ボタンを表示する
3. The 変更追跡 shall 元の値と編集後の値をMap（key: YYYYMM、value: 工数値）で管理する
4. When 「保存」ボタンがクリックされる, the 画面 shall `PUT /project-cases/:projectCaseId/project-loads/bulk` で変更内容を一括送信し、成功時にトースト通知「工数データを保存しました」を表示する
5. If 保存に失敗した場合, the 画面 shall エラートースト通知「工数データの保存に失敗しました」を表示する
6. If 変更がない状態で保存がクリックされる, the 画面 shall 情報トースト通知「変更がありません」を表示する
7. When 「キャンセル」ボタンがクリックされる, the テーブル shall 編集内容を破棄し、読み取りモードに復帰する
8. When 入力フィールドからフォーカスアウトする, the 画面 shall 入力値をバリデーションし、不正値（非整数・範囲外）の場合は元の値に復元する
9. While 保存中, the 画面 shall 「保存」ボタンのテキストを「保存中...」に変更する

### Requirement 8: 月別工数チャート表示

**Objective:** As a プロジェクトマネージャー, I want 月別工数をエリアチャートで視覚的に確認したい, so that 工数分布のトレンドを直感的に把握できる

#### Acceptance Criteria

1. When ケースが選択される, the 画面 shall 工数カードの下部にエリアチャート（AreaChart、monotone曲線、高さ256px）で月別工数を表示する
2. The チャート shall X軸にYYYY/MM形式の年月ラベル、Y軸に工数値（日本語ロケール・カンマ区切り）を表示する
3. The エリア shall 上部60%から下部5%へのグラデーション、線幅2px、アクティブドットサイズ半径4pxで描画する
4. The ツールチップ shall 値を「{工数値} 工数」、ラベルを「年月 {YYYY/MM}」の形式で表示する
5. The チャート shall テーブルの表示期間と連動する
6. When 月次工数データが0件の場合, the 画面 shall 「月次工数データがありません」メッセージを表示する
7. While 編集モード中, the チャート shall 変更をリアルタイムで反映する

### Requirement 9: フォームバリデーション

**Objective:** As a ユーザー, I want 入力値が不正な場合にエラーメッセージを確認したい, so that 正しいデータでケースを作成・更新できる

#### Acceptance Criteria

1. If ケース名が空の場合, the フォーム shall 必須エラーメッセージを表示する
2. If ケース名が100文字超の場合, the フォーム shall 最大長エラーメッセージを表示する
3. If STANDARDモードで標準工数マスタが未選択の場合, the フォーム shall 「STANDARDモードの場合、標準工数マスタの選択は必須です」エラーメッセージを表示する
4. If 説明が500文字超の場合, the フォーム shall 最大長エラーメッセージを表示する
5. If 開始年月がYYYYMM形式でない場合, the フォーム shall 形式エラーメッセージを表示する
6. If 期間月数が正の整数でない場合, the フォーム shall 数値エラーメッセージを表示する
7. If 総工数が0未満の場合, the フォーム shall 数値エラーメッセージを表示する

### Requirement 10: 画面ルーティング・レイアウト

**Objective:** As a ユーザー, I want 案件詳細画面からケーススタディ画面にアクセスしたい, so that 案件コンテキストを維持したままケース管理を行える

#### Acceptance Criteria

1. The ケーススタディ画面 shall `/master/projects/$projectId/case-study` をメインルートとする
2. The ケース新規作成ページ shall `/master/projects/$projectId/case-study/new` をルートとする
3. The ケース編集ページ shall `/master/projects/$projectId/case-study/$caseId/edit` をルートとする
4. The メイン画面 shall 左にケース一覧サイドバー、右にケース詳細（工数テーブル＋チャート）の2カラムレイアウトで構成する
5. The 画面 shall パンくずリスト（案件一覧 > {案件名} > ケーススタディ）をヘッダーに表示する
6. The 全入力フィールド shall Label要素をhtmlFor+idで紐付け、必須フィールドには赤色アスタリスク（*）を表示する
7. The 編集・削除ボタン shall title属性でアクション名を付与する

### Requirement 11: サーバー状態管理

**Objective:** As a 開発者, I want TanStack Queryでサーバー状態を適切に管理したい, so that データの整合性とキャッシュ制御を担保できる

#### Acceptance Criteria

1. The 画面 shall ケース一覧に `["project-cases", projectId]` クエリキーを使用する
2. The 画面 shall ケース詳細に `["project-case", projectId, projectCaseId]` クエリキーを使用する
3. The 画面 shall 月別工数一覧に `["project-loads", projectCaseId]` クエリキーを使用する
4. The 画面 shall 標準工数マスタ一覧に `["standard-effort-masters"]` クエリキーを使用する
5. The 画面 shall 標準工数マスタ詳細に `["standard-effort-master", id]` クエリキーを使用する
6. When ケースが作成・更新・削除・復元される, the 画面 shall 関連するクエリキーのキャッシュを無効化する
7. When 月別工数がbulk upsertされる, the 画面 shall `["project-loads", projectCaseId]` のキャッシュを無効化する

### Requirement 12: 操作フィードバック

**Objective:** As a ユーザー, I want 操作結果のフィードバックを即座に受けたい, so that 操作が成功したか失敗したかを確認できる

#### Acceptance Criteria

1. When ケース作成が成功する, the 画面 shall トースト通知「ケースを作成しました」を表示する
2. When ケース更新が成功する, the 画面 shall トースト通知「ケースを更新しました」を表示する
3. When ケース削除が成功する, the 画面 shall トースト通知「ケースを削除しました」を表示する
4. When 工数保存が成功する, the 画面 shall トースト通知「工数データを保存しました」を表示する
5. If いずれかの操作が失敗した場合, the 画面 shall エラートースト通知を表示する
6. While フォーム送信中, the 画面 shall 送信ボタンとキャンセルボタンを無効化し、ボタンテキストを処理状態に変更する

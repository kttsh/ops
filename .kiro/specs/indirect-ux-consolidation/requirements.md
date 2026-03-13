# Requirements Document

## Introduction
GitHub Issue #70 に基づき、間接工数管理画面のUXを抜本的に改善する。現状の2画面構成（simulation / monthly-loads）を1画面に統合し、「BUの間接工数の今を見る。変えたければマスタを直して再計算する」というシンプルな操作フローを実現する。不要機能（エクスポート/インポート、手動編集、差分プレビュー、2段階計算）を廃止し、primaryケースの自動選択・1ボタン再計算・読み取り専用テーブルによる簡潔なインターフェースに再設計する。

## Requirements

### Requirement 1: BU選択によるデータ表示
**Objective:** As a 事業部リーダー, I want BUを選択するだけで保存済みの間接工数データを確認したい, so that 操作手順を最小限にして迅速に工数状況を把握できる

#### Acceptance Criteria
1. The 間接工数画面 shall BU一覧を横並びタブとして表示する
2. When ユーザーがBUタブを選択した時, the 間接工数画面 shall 選択されたBUの保存済み間接工数データをテーブルに表示する
3. The 間接工数画面 shall 画面初期表示時に先頭のBUを自動選択してデータを表示する
4. While BUが選択されている間, the 間接工数画面 shall 選択中のBUタブをハイライト表示する

### Requirement 2: 計算条件パネルのprimaryケース自動表示
**Objective:** As a 事業部リーダー, I want 計算条件（人員計画・稼働時間・間接作業）のprimaryケースが自動表示されてほしい, so that 毎回ドロップダウンから選択する手間を省きたい

#### Acceptance Criteria
1. The 計算条件パネル shall 選択中BUの人員計画・稼働時間・間接作業それぞれのprimaryケース名をテキストとして表示する
2. The 計算条件パネル shall 各ケース名の横にマスタ画面への遷移リンク（→アイコン）を配置する
3. When ユーザーがマスタ遷移リンクをクリックした時, the 間接工数画面 shall 対応するマスタ管理画面に遷移する
4. If いずれかのエンティティでprimaryケースが未設定の場合, the 計算条件パネル shall 「未設定 →」を警告色で表示する
5. While 3項目すべてにprimaryケースが設定されている間, the 再計算ボタン shall 有効状態で表示される
6. While いずれかの項目でprimaryケースが未設定の間, the 再計算ボタン shall 無効状態で表示される

### Requirement 3: 統合テーブルによる読み取り専用データ表示
**Objective:** As a 事業部リーダー, I want 人員・キャパシティ・作業種類別内訳・間接計・直接工数を1つのテーブルで確認したい, so that 画面遷移なしで間接工数の全体像を把握できる

#### Acceptance Criteria
1. The 統合テーブル shall 月別カラム（4月〜3月）と年合計カラムを持つ
2. The 統合テーブル shall 入力セクション（人員数・キャパシティ）を表示する
3. The 統合テーブル shall 内訳セクション（間接作業の種類ごとの工数）を表示する
4. The 統合テーブル shall 集計セクション（間接計・直接）を表示する
5. The 統合テーブル shall 人員数行の年合計を「-」として表示する
6. The 統合テーブル shall すべてのセルを読み取り専用で表示する
7. The 統合テーブル shall 「直接」行にキャパシティから間接計を差し引いた値を表示する

### Requirement 4: 年度切り替えチップセレクタ
**Objective:** As a 事業部リーダー, I want 年度を横並びのチップで素早く切り替えたい, so that セレクトボックスより直感的に年度間を移動できる

#### Acceptance Criteria
1. The 年度セレクタ shall データが存在する年度のみチップとして横並び表示する
2. The 年度セレクタ shall アクティブな年度のチップをハイライト表示する
3. When ユーザーが年度チップをクリックした時, the 統合テーブル shall 選択された年度のデータに切り替えて表示する
4. The 年度セレクタ shall テーブル上部に配置される

### Requirement 5: 1ボタン再計算
**Objective:** As a 事業部リーダー, I want 再計算を1回のボタン操作で完了させたい, so that 2段階の計算ステップを意識せずに最新の計算結果を得られる

#### Acceptance Criteria
1. When ユーザーが再計算ボタンをクリックした時, the 間接工数画面 shall 確認ダイアログ「現在の間接工数データを再計算した値で上書きします。この操作は元に戻せません。」を表示する
2. When ユーザーが確認ダイアログで「確認」を選択した時, the 間接工数画面 shall キャパシティ計算と間接工数計算を連続実行し結果を保存する
3. When 再計算が正常完了した時, the 間接工数画面 shall テーブルを更新しトースト通知「間接工数を再計算しました」を表示する
4. When ユーザーが確認ダイアログで「キャンセル」を選択した時, the 間接工数画面 shall 何も変更せずダイアログを閉じる
5. While 再計算処理が実行中の間, the 再計算ボタン shall 無効状態でローディング表示する
6. If 再計算処理が失敗した場合, the 間接工数画面 shall エラートースト通知を表示する

### Requirement 6: サイドバーメニュー統合
**Objective:** As a ユーザー, I want 間接工数関連のメニューが1つに集約されてほしい, so that ナビゲーションがシンプルになり迷わない

#### Acceptance Criteria
1. The サイドバー shall 「間接作業管理」配下に「間接工数」メニュー項目を1つだけ表示する
2. When ユーザーが「間接工数」メニューをクリックした時, the サイドバー shall `/indirect` に遷移する
3. The サイドバー shall 旧メニュー項目「間接工数計算」「月次間接工数」を表示しない

### Requirement 7: 不要機能・ルートの廃止
**Objective:** As a 開発者, I want 運用上不要な機能とルートを廃止したい, so that コードベースが簡素化され保守性が向上する

#### Acceptance Criteria
1. The アプリケーション shall `/indirect/monthly-loads` ルートを廃止する
2. The 間接工数画面 shall エクスポート機能を提供しない
3. The 間接工数画面 shall インポート機能を提供しない
4. The 間接工数画面 shall 計算結果の手動編集機能を提供しない
5. The 間接工数画面 shall ケース選択ドロップダウンを提供しない
6. The 間接工数画面 shall 差分プレビュー機能を提供しない
7. The 間接工数画面 shall 2段階の計算ボタン（キャパシティ計算・間接作業計算の個別ボタン）を提供しない

### Requirement 8: 最終計算日時の表示
**Objective:** As a 事業部リーダー, I want いつ計算が行われたかを確認したい, so that データの鮮度を判断できる

#### Acceptance Criteria
1. The 間接工数画面 shall テーブル下部に最終計算日時を「ⓘ 最終計算: YYYY-MM-DD HH:mm」形式で表示する
2. If 計算が一度も実行されていない場合, the 間接工数画面 shall 最終計算日時を表示しない

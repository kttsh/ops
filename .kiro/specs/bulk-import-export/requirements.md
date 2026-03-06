# Requirements Document

## Introduction

案件（projects）、ケース（cases）、年月データの一括出力（エクスポート）および一括入力（インポート）機能を新規実装する。現行の個別画面での手入力・ケース単位のインポート/エクスポートに加え、システム全体の案件工数データを横断的に Excel ファイルで入出力する機能を提供する。

既存の `excel-import-export`（ケーススタディ画面内での個別ケース単位のインポート/エクスポート）とは異なり、本機能は**全案件・全ケースを横断した一括データ入出力**を目的とする。バックエンドに専用のエクスポート/インポート API を新設し、Excel ファイルの生成・解析はサーバーサイドで行う。

**対象データ:**
- 案件工数（project loads）: 案件ケースに紐づく月別工数データ
- Excel フォーマット: 行=ケース、列=年月、セル=工数。案件名・ケース名・キーコードを含む

**GitHub Issue:** #42

## Requirements

### Requirement 1: 案件工数の一括エクスポート

**Objective:** As a プロジェクトマネージャー, I want 全案件・全ケースの月別工数データを Excel ファイルとして一括ダウンロードしたい, so that データの一括確認・外部資料への転記・バックアップが効率的に行える

#### Acceptance Criteria

1. When ユーザーがエクスポートボタンをクリックする, the エクスポート API shall 全案件・全ケースに紐づく月別工数データを含む Excel ファイルを生成しレスポンスとして返却する
2. The エクスポート API shall Excel ファイルのシート構成を「行=ケース、列=年月（YYYY-MM）、セル=工数（manhour）」とする
3. The エクスポート API shall 各行に案件名（project name）、ケース名（case name）、インポート用キーコード（project case ID 等の一意識別子）を含める
4. The エクスポート API shall ヘッダー行に列の意味（案件名、ケース名、キーコード、各年月）を明記する
5. The エクスポート API shall 年月列を時系列順（昇順）で並べる
6. While エクスポート処理が進行中, the フロントエンド shall ローディング状態を表示しボタンの二重クリックを防止する
7. If エクスポート対象のデータが存在しない, the エクスポート API shall 空データである旨をレスポンスで通知する

### Requirement 2: エクスポート API

**Objective:** As a 開発者, I want バックエンドに案件工数の一括エクスポート API を実装したい, so that Excel ファイルの生成をサーバーサイドで安全かつ効率的に処理できる

#### Acceptance Criteria

1. The バックエンド shall `GET /api/projects/export` エンドポイントを提供する
2. When エクスポートリクエストを受信する, the バックエンド shall 全案件・全ケース・全月別工数データを DB から取得し Excel ファイルを生成する
3. The バックエンド shall レスポンスの Content-Type を `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` に設定する
4. The バックエンド shall レスポンスの Content-Disposition に適切なファイル名（例: `projects_export_YYYYMMDD.xlsx`）を含める
5. If DB からのデータ取得に失敗する, the バックエンド shall RFC 9457 準拠のエラーレスポンスを返却する

### Requirement 3: 案件工数の一括インポート

**Objective:** As a プロジェクトマネージャー, I want Excel ファイルから全案件・全ケースの工数データを一括更新したい, so that 大量データの一括編集・反映を効率的に行える

#### Acceptance Criteria

1. When ユーザーがインポートボタンをクリックする, the フロントエンド shall Excel ファイルをアップロードするダイアログを表示する
2. When ユーザーが Excel ファイルを選択しアップロードする, the インポート API shall ファイル内容を解析しバリデーション結果をレスポンスとして返却する
3. The フロントエンド shall バリデーション結果に基づきインポートプレビュー（対象データの件数・変更内容）を表示する
4. When ユーザーがプレビュー画面でインポートを確定する, the インポート API shall キーコードに基づきデータを一括更新する
5. When インポートが成功する, the フロントエンド shall 成功通知を表示し関連する画面データを最新状態に更新する
6. If インポート API の呼び出しが失敗する, the フロントエンド shall エラー内容をユーザーに通知する

### Requirement 4: インポート API

**Objective:** As a 開発者, I want バックエンドに案件工数の一括インポート API を実装したい, so that Excel ファイルの解析・バリデーション・データ更新をサーバーサイドで安全に処理できる

#### Acceptance Criteria

1. The バックエンド shall `POST /api/projects/import` エンドポイントを提供する
2. When インポートリクエストを受信する, the バックエンド shall アップロードされた Excel ファイルを解析しデータを抽出する
3. The バックエンド shall 抽出データに対してバリデーション（フォーマット・値範囲・FK 制約・キーコード存在チェック）を実施する
4. If バリデーションエラーが存在する, the バックエンド shall エラー情報を行単位で返却しデータ更新を行わない
5. When バリデーションが成功しインポート確定リクエストを受信する, the バックエンド shall トランザクション内でデータを一括更新する
6. If データ更新中にエラーが発生する, the バックエンド shall トランザクションをロールバックし RFC 9457 準拠のエラーレスポンスを返却する

### Requirement 5: インポートバリデーション

**Objective:** As a システム管理者, I want インポート時にデータの整合性が厳密に検証されたい, so that 不正データによるシステム障害や業務上の混乱を防止できる

#### Acceptance Criteria

1. The インポート API shall Excel ファイルの必須列（案件名、ケース名、キーコード、年月列）の存在を検証する
2. The インポート API shall キーコードが DB 上の既存レコードに対応することを検証する
3. The インポート API shall yearMonth フィールドが YYYY-MM 形式であることを検証する
4. The インポート API shall manhour フィールドが 0 以上の数値であることを検証する
5. If バリデーションエラーが存在する, the インポート API shall エラーを行番号・列名・エラー内容を含む構造化データとして返却する
6. The フロントエンド shall バリデーションエラーがある場合にインポート確定ボタンを無効化する

### Requirement 6: Excel フォーマット仕様

**Objective:** As a ユーザー, I want エクスポートされた Excel ファイルの構造が明確で、編集後にそのままインポートに使用できるようにしたい, so that ラウンドトリップ（エクスポート→編集→インポート）がシームレスに行える

#### Acceptance Criteria

1. The システム shall エクスポートとインポートで同一の Excel フォーマットを使用する（ラウンドトリップ互換性）
2. The システム shall Excel の固定列として「キーコード」「案件名」「ケース名」を配置する
3. The システム shall 固定列の後に年月列（YYYY-MM 形式）を時系列順で配置する
4. The システム shall 各データ行の年月セルに工数値（manhour）を配置する
5. The システム shall 将来の年月列追加に対応可能な拡張性のあるフォーマットとする（列数が動的に変化する）
6. The システム shall `.xlsx` 形式のファイルを入出力の対象とする

### Requirement 7: フロントエンド UI

**Objective:** As a ユーザー, I want エクスポート・インポートの操作が直感的に行えるUIが提供されたい, so that 技術的知識がなくても一括データ操作ができる

#### Acceptance Criteria

1. The フロントエンド shall 案件一覧画面にエクスポートボタンを配置する
2. The フロントエンド shall 案件一覧画面にインポートボタンを配置する
3. When ユーザーがインポートボタンをクリックする, the フロントエンド shall ファイル選択ダイアログを表示する
4. The フロントエンド shall ドラッグ＆ドロップまたはファイル選択ボタンによる Excel ファイルのアップロードに対応する
5. If 対応していないファイル形式がアップロードされる, the フロントエンド shall ファイル形式エラーを表示する
6. The フロントエンド shall インポートプレビュー画面でバリデーションエラーを行単位で表示する
7. While インポート API の呼び出しが進行中, the フロントエンド shall ローディング状態を表示し操作を無効化する

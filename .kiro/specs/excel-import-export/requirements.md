# Requirements Document

## Introduction

間接工数（monthlyIndirectWorkLoad）と案件工数（projectLoad）のデータを Excel ファイルでインポート・エクスポートする機能を実装する。現状では画面上での手入力のみで大量データの投入や外部連携が困難であり、Excel ベースのデータ入出力によって運用効率を大幅に改善する。

フロントエンドで `xlsx` パッケージを使い Excel の読み書きを完結させ、既存の Bulk API（`PUT /bulk`）経由でデータを永続化する方針とする。エクスポートしたファイルをそのままインポートできるラウンドトリップ対応を前提とする。

**対象画面・データ:**
- 案件ケーススタディ画面 → 案件工数（projectLoad）
- 間接作業ケーススタディ画面 → 間接工数（monthlyIndirectWorkLoad）

## Requirements

### Requirement 1: 案件工数エクスポート

**Objective:** As a プロジェクトマネージャー, I want 案件ケースに紐づく月別工数データを Excel ファイルとしてダウンロードしたい, so that 外部資料への転記やデータバックアップが容易になる

#### Acceptance Criteria

1. When ユーザーが案件ケーススタディ画面でエクスポートボタンをクリックする, the システム shall 選択中のプロジェクトケースに紐づくすべての月別工数データを含む Excel ファイルを生成しダウンロードする
2. The システム shall エクスポートファイルのシート構成を「行＝ケース名（1データ行）、列＝年月（YYYY-MM）、値＝工数（manhour）」とする
3. The システム shall エクスポートファイルにヘッダー行（ケース名列 + 年月列）を含める
4. While エクスポート処理が進行中, the システム shall ローディング状態を表示しボタンの二重クリックを防止する
5. If エクスポート対象のデータが存在しない, the システム shall エクスポート不可であることをユーザーに通知する

### Requirement 2: 間接工数エクスポート（入力データ）

**Objective:** As a 事業部リーダー, I want 間接作業ケースに紐づく月別間接工数の入力データを Excel ファイルとしてダウンロードしたい, so that データの確認・共有・バックアップが容易になる

#### Acceptance Criteria

1. When ユーザーが間接作業ケーススタディ画面でエクスポートボタンをクリックする, the システム shall 選択中の間接作業ケースに紐づくすべての月別間接工数データを含む Excel ファイルを生成しダウンロードする
2. The システム shall エクスポートファイルのシート構成を「行＝BU名、列＝年月（YYYY-MM）、値＝工数（manhour）」とする
3. The システム shall エクスポートファイルにヘッダー行（BU名列 + 年月列）を含める
4. While エクスポート処理が進行中, the システム shall ローディング状態を表示しボタンの二重クリックを防止する
5. If エクスポート対象のデータが存在しない, the システム shall エクスポート不可であることをユーザーに通知する
6. The システム shall 既存の計算結果エクスポート機能（useExcelExport）に影響を与えない

### Requirement 3: 案件工数インポート

**Objective:** As a プロジェクトマネージャー, I want Excel ファイルから案件工数データを一括登録・更新したい, so that 大量データの投入や外部システムからのデータ移行が効率的に行える

#### Acceptance Criteria

1. When ユーザーが案件ケーススタディ画面でインポートボタンをクリックする, the システム shall Excel ファイルをアップロードするダイアログを表示する
2. When ユーザーが Excel ファイルを選択する, the システム shall ファイル内容を解析しインポートプレビューを表示する
3. The システム shall プレビュー画面でインポート対象データの件数・内容をユーザーが確認できるようにする
4. When ユーザーがプレビュー画面でインポートを確定する, the システム shall 画面上で選択中のプロジェクトケースに対して既存の `PUT /project-cases/:projectCaseId/project-loads/bulk` API を使用してデータを一括更新する
5. If Excel ファイルのフォーマットが不正（必須列の欠損・不正な値等）, the システム shall バリデーションエラーの箇所と内容を明示的に表示する
6. If manhour の値が許容範囲外（0 ～ 99,999,999）, the システム shall 該当セルのエラーを表示する
7. When インポートが成功する, the システム shall 成功通知を表示し画面データを最新状態に更新する
8. If API 呼び出しが失敗する, the システム shall エラー内容をユーザーに通知する

### Requirement 4: 間接工数インポート

**Objective:** As a 事業部リーダー, I want Excel ファイルから間接工数データを一括登録・更新したい, so that 大量データの投入や計算ツールからのデータ移行が効率的に行える

#### Acceptance Criteria

1. When ユーザーが間接作業ケーススタディ画面でインポートボタンをクリックする, the システム shall Excel ファイルをアップロードするダイアログを表示する
2. When ユーザーが Excel ファイルを選択する, the システム shall ファイル内容を解析しインポートプレビューを表示する
3. The システム shall プレビュー画面でインポート対象データの件数・内容をユーザーが確認できるようにする
4. When ユーザーがプレビュー画面でインポートを確定する, the システム shall 既存の `PUT /indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads/bulk` API を使用してデータを一括更新する
5. If Excel ファイルのフォーマットが不正（必須列の欠損・不正な値等）, the システム shall バリデーションエラーの箇所と内容を明示的に表示する
6. If manhour の値が許容範囲外（0 ～ 99,999,999）, the システム shall 該当セルのエラーを表示する
7. If BU コードが存在しない, the システム shall 該当行のエラーを表示する
8. When インポートが成功する, the システム shall 成功通知を表示し画面データを最新状態に更新する
9. If API 呼び出しが失敗する, the システム shall エラー内容をユーザーに通知する
10. The システム shall インポート時の source フィールドを "manual" として設定する

### Requirement 5: ラウンドトリップ互換性

**Objective:** As a ユーザー, I want エクスポートした Excel ファイルをそのままインポートに使用したい, so that データの再投入やテンプレートとしての利用がシームレスに行える

#### Acceptance Criteria

1. The システム shall 案件工数のエクスポートファイルをそのまま案件工数インポートに使用できる
2. The システム shall 間接工数のエクスポートファイルをそのまま間接工数インポートに使用できる
3. The システム shall エクスポート・インポートで同一の Excel フォーマット（シート構成・ヘッダー・データ配置）を使用する

### Requirement 6: 共通インポート UI

**Objective:** As a 開発者, I want インポート機能の UI コンポーネントを共通化したい, so that 案件工数と間接工数で一貫したユーザー体験を提供できる

#### Acceptance Criteria

1. The システム shall ファイル選択・プレビュー・バリデーション結果表示・インポート確定を含む共通ダイアログコンポーネントを提供する
2. The システム shall ドラッグ＆ドロップまたはファイル選択ボタンによる Excel ファイルのアップロードに対応する
3. The システム shall `.xlsx` および `.xls` 形式のファイルを受け付ける
4. If 対応していないファイル形式がアップロードされた, the システム shall ファイル形式エラーを表示する
5. While インポート API の呼び出しが進行中, the システム shall ローディング状態を表示し操作を無効化する
6. The システム shall 100行以上の大量データのインポートを正常に処理できる

### Requirement 7: データ整合性

**Objective:** As a システム管理者, I want インポート時にデータの整合性が保証されたい, so that 不正データによるシステム障害を防止できる

#### Acceptance Criteria

1. The システム shall インポート前にフロントエンドでバリデーション（フォーマット・値範囲・必須項目）を実施する
2. The システム shall yearMonth フィールドが YYYY-MM 形式であることを検証する
3. The システム shall manhour フィールドが 0 以上 99,999,999 以下の数値であることを検証する
4. If 重複する yearMonth データが存在する（案件工数の場合）, the システム shall 重複エラーを表示する
5. If 重複する businessUnitCode + yearMonth の組み合わせが存在する（間接工数の場合）, the システム shall 重複エラーを表示する
6. The システム shall バリデーションエラーがある場合にインポート確定ボタンを無効化する

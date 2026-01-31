# Requirements Document

## Introduction

`project_types` マスターデータの管理画面を実装する。既存の `project-types` CRUD API（Hono バックエンド）を呼び出し、案件タイプの検索・一覧表示・詳細表示・新規登録・編集・削除・復元を行うフロントエンド画面を提供する。TanStack Router によるファイルベースルーティング、TanStack Table によるデータテーブル、TanStack Query によるデータフェッチ、TanStack Form によるフォーム管理、shadcn/ui によるUI コンポーネントを使用する。機能は `features/project-types/` に凝集し、ディレクトリ構成規約に準拠する。

UI/UX デザインは既存の business-units マスタ管理画面と同一のデザイン言語を踏襲し、ゆとりのある余白・大きな角丸・控えめなシャドウ・スムーズなアニメーション・即時フィードバックといった特徴を管理画面に適用する。

## Requirements

### Requirement 1: 案件タイプ一覧画面

**Objective:** As a 管理者, I want 案件タイプの一覧をテーブル形式で閲覧したい, so that 登録済みの案件タイプを俯瞰できる

#### Acceptance Criteria

1. When ユーザーが案件タイプ一覧画面（`/master/project-types`）にアクセスした場合, the 管理画面 shall `GET /project-types` API を呼び出し、案件タイプ一覧を TanStack Table で表示する
2. The 管理画面 shall テーブルに案件タイプコード・名称・表示順・作成日時・更新日時のカラムを表示する
3. The 管理画面 shall TanStack Table のソート機能を提供し、各カラムの昇順・降順を切り替え可能にする
4. While API からデータを取得中の場合, the 管理画面 shall ローディング状態を表示する
5. If API からのデータ取得に失敗した場合, the 管理画面 shall エラーメッセージを表示する

### Requirement 2: 案件タイプ検索・フィルタ

**Objective:** As a 管理者, I want 案件タイプを条件で絞り込みたい, so that 目的のレコードを素早く見つけられる

#### Acceptance Criteria

1. The 管理画面 shall テーブル上部に検索入力欄を配置し、案件タイプコードまたは名称でフィルタリングできる
2. When ユーザーが検索入力欄にテキストを入力した場合, the 管理画面 shall 入力内容に部分一致する行のみテーブルに表示する（クライアントサイドフィルタ）
3. The 管理画面 shall 「削除済みを含む」トグルを提供し、有効化時に `filter[includeDisabled]=true` パラメータで API を呼び出す
4. When 「削除済みを含む」トグルが有効な場合, the 管理画面 shall 削除済みレコードを視覚的に区別して表示する（行の透明度を下げ、「削除済み」ステータスバッジを表示）

### Requirement 3: 案件タイプ詳細表示

**Objective:** As a 管理者, I want 特定の案件タイプの詳細情報を確認したい, so that 登録内容を正確に把握できる

#### Acceptance Criteria

1. When ユーザーがテーブルの行をクリックした場合, the 管理画面 shall 詳細画面（`/master/project-types/$projectTypeCode`）に遷移し、`GET /project-types/:projectTypeCode` API を呼び出して詳細情報を表示する
2. The 管理画面 shall 詳細画面に案件タイプコード・名称・表示順・作成日時・更新日時を表示する
3. The 管理画面 shall 詳細画面に「編集」ボタンと「削除」ボタンを配置する
4. The 管理画面 shall 詳細画面に一覧画面へ戻るナビゲーション（パンくずリストまたは戻るリンク）を提供する
5. If 指定されたコードの案件タイプが存在しない場合, the 管理画面 shall 404 エラー画面を表示する

### Requirement 4: 案件タイプ新規登録

**Objective:** As a 管理者, I want 新しい案件タイプを登録したい, so that 新たな案件種別をシステムに追加できる

#### Acceptance Criteria

1. When ユーザーが一覧画面の「新規登録」ボタンをクリックした場合, the 管理画面 shall 新規登録画面（`/master/project-types/new`）に遷移する
2. The 管理画面 shall TanStack Form を使用し、案件タイプコード（必須・最大20文字・英数字とハイフン・アンダースコアのみ）、名称（必須・最大100文字）、表示順（任意・0以上の整数・デフォルト0）の入力フォームを表示する
3. The 管理画面 shall Zod バリデーションを使用し、入力値をリアルタイムでバリデーションする
4. When ユーザーがフォームを送信した場合, the 管理画面 shall `POST /project-types` API を呼び出して案件タイプを作成する
5. When 作成が成功した場合, the 管理画面 shall 一覧画面にリダイレクトし、成功メッセージを表示する
6. If API が 409 Conflict エラーを返した場合, the 管理画面 shall 「同一コードの案件タイプが既に存在します」というエラーメッセージを表示する
7. If API が 422 Unprocessable Entity エラーを返した場合, the 管理画面 shall バリデーションエラーの内容をフォームに表示する

### Requirement 5: 案件タイプ編集

**Objective:** As a 管理者, I want 既存の案件タイプの情報を編集したい, so that 名称や表示順を変更できる

#### Acceptance Criteria

1. When ユーザーが詳細画面の「編集」ボタンをクリックした場合, the 管理画面 shall 編集画面（`/master/project-types/$projectTypeCode/edit`）に遷移し、現在の値をフォームに初期表示する
2. The 管理画面 shall 案件タイプコードを読み取り専用で表示し、名称と表示順を編集可能にする
3. The 管理画面 shall Zod バリデーションを使用し、入力値をリアルタイムでバリデーションする
4. When ユーザーがフォームを送信した場合, the 管理画面 shall `PUT /project-types/:projectTypeCode` API を呼び出して案件タイプを更新する
5. When 更新が成功した場合, the 管理画面 shall 詳細画面にリダイレクトし、成功メッセージを表示する
6. If API が 404 Not Found エラーを返した場合, the 管理画面 shall 「案件タイプが見つかりません」というエラーメッセージを表示する
7. If API が 422 Unprocessable Entity エラーを返した場合, the 管理画面 shall バリデーションエラーの内容をフォームに表示する

### Requirement 6: 案件タイプ削除

**Objective:** As a 管理者, I want 不要な案件タイプを削除したい, so that 使用されなくなった案件種別を非表示にできる

#### Acceptance Criteria

1. When ユーザーが詳細画面の「削除」ボタンをクリックした場合, the 管理画面 shall 確認ダイアログを表示する
2. When ユーザーが確認ダイアログで「削除」を選択した場合, the 管理画面 shall `DELETE /project-types/:projectTypeCode` API を呼び出して論理削除を実行する
3. When 削除が成功した場合, the 管理画面 shall 一覧画面にリダイレクトし、成功メッセージを表示する
4. If API が 409 Conflict エラーを返した場合, the 管理画面 shall 「この案件タイプは他のデータから参照されているため削除できません」というエラーメッセージを表示する
5. If API が 404 Not Found エラーを返した場合, the 管理画面 shall 「案件タイプが見つかりません」というエラーメッセージを表示する

### Requirement 7: 案件タイプ復元

**Objective:** As a 管理者, I want 削除済みの案件タイプを復元したい, so that 誤って削除したデータを元に戻せる

#### Acceptance Criteria

1. While 「削除済みを含む」トグルが有効で削除済みレコードが表示されている場合, the 管理画面 shall 削除済み行に「復元」ボタンを表示する
2. When ユーザーが「復元」ボタンをクリックした場合, the 管理画面 shall 確認ダイアログを表示する
3. When ユーザーが確認ダイアログで「復元」を選択した場合, the 管理画面 shall `POST /project-types/:projectTypeCode/actions/restore` API を呼び出して復元を実行する
4. When 復元が成功した場合, the 管理画面 shall テーブルを再取得し、成功メッセージを表示する
5. If API が 409 Conflict エラーを返した場合, the 管理画面 shall エラーメッセージを表示する

### Requirement 8: ルーティングとナビゲーション

**Objective:** As a 管理者, I want URL ベースで画面を直接アクセスしたい, so that ブックマークや URL 共有が可能である

#### Acceptance Criteria

1. The 管理画面 shall TanStack Router のファイルベースルーティングで以下のルートを提供する: `/master/project-types`（一覧）、`/master/project-types/new`（新規登録）、`/master/project-types/$projectTypeCode`（詳細）、`/master/project-types/$projectTypeCode/edit`（編集）
2. The 管理画面 shall 検索条件を URL の search params として管理し、URL 共有時に同一の検索結果を再現可能にする

### Requirement 9: ビジュアルデザイン

**Objective:** As a 管理者, I want 既存の管理画面と統一感のあるデザインで操作したい, so that 画面間で一貫した操作体験を得られる

#### Acceptance Criteria

1. The 管理画面 shall 既存の business-units マスタ管理画面と同一のデザインパターン・コンポーネント構成を踏襲する
2. The 管理画面 shall shadcn/ui コンポーネントをベースに、ゆとりのあるスペーシング・大きめの角丸・控えめなシャドウを適用する
3. The 管理画面 shall テーブル行のホバー時にスムーズなハイライトトランジションを適用する
4. The 管理画面 shall コンテンツ領域の最大幅を制限し、横幅が広がりすぎないようにする

### Requirement 10: インタラクションとフィードバック

**Objective:** As a 管理者, I want 操作結果が即座にわかるフィードバックを受けたい, so that 操作の成功・失敗を迷わず確認できる

#### Acceptance Criteria

1. The 管理画面 shall 成功通知（「保存しました」「削除しました」等）を Toast コンポーネントで表示し、数秒後に自動で消える
2. The 管理画面 shall エラー通知を Toast コンポーネントで表示し、ユーザーが手動で閉じるまで保持する
3. The 管理画面 shall フォームのバリデーションエラーを各入力フィールドの直下にインラインで表示する
4. While API リクエスト実行中の場合, the 管理画面 shall 送信ボタンを無効化し、ボタン内にスピナーアイコンを表示する
5. The 管理画面 shall 削除済みレコードにステータスバッジを表示し、アクティブ・削除済みの状態を視覚的に区別する

### Requirement 11: feature モジュール構成

**Objective:** As a 開発者, I want 機能単位でコードが凝集された構成にしたい, so that 保守性と再利用性を確保できる

#### Acceptance Criteria

1. The 管理画面 shall `features/project-types/` 配下に api・components・hooks・types・index.ts を配置し、feature モジュールとして構成する
2. The 管理画面 shall TanStack Query の queryOptions パターンを使用し、API 呼び出しを `features/project-types/api/` に集約する
3. The 管理画面 shall Zod スキーマをフロントエンド側にも定義し、フォームバリデーションに使用する
4. The 管理画面 shall `features/project-types/index.ts` で外部に公開するコンポーネント・フック・型をエクスポートする

# Requirements Document

## Introduction
GitHub Issue #48 に基づき、現在の `indirect-capacity-settings` 画面に混在するマスタ管理機能を、3つの独立した画面（人員計画ケース・キャパシティシナリオ・間接作業ケース）に分離する。各画面はケースの CRUD 操作とデータ入力機能を提供し、既存コンポーネントを再利用する。

## Requirements

### Requirement 1: 人員計画ケース管理画面
**Objective:** As a 事業部リーダー, I want 人員計画ケースの作成・編集・削除と月別人員計画の入力を専用画面で行いたい, so that ケース管理とデータ入力を独立した画面で効率的に操作できる

#### Acceptance Criteria
1. When ユーザーが `/master/headcount-plans` に遷移した時, the 画面 shall 人員計画ケース一覧を左パネルに表示する
2. When ユーザーがケースを新規作成した時, the 画面 shall ケースを一覧に追加し選択可能な状態にする
3. When ユーザーがケースを選択した時, the 画面 shall 右パネルに月別人員計画入力グリッドを表示する
4. When ユーザーがケースを編集した時, the 画面 shall ケース名等の変更を反映する
5. When ユーザーがケースを削除した時, the 画面 shall 確認の上ケースを一覧から除去する
6. The 画面 shall BU セレクタを提供し、選択された BU に基づいてデータを絞り込む
7. The 画面 shall 年度切替機能を提供し、表示対象の年度を変更できる
8. When ユーザーが月別人員計画を編集して保存ボタンを押した時, the 画面 shall データを永続化し成功を通知する

### Requirement 2: キャパシティシナリオ管理画面
**Objective:** As a 事業部リーダー, I want キャパシティシナリオの作成・編集・削除を専用画面で行いたい, so that シナリオ管理を独立した画面で操作できる

#### Acceptance Criteria
1. When ユーザーが `/master/capacity-scenarios` に遷移した時, the 画面 shall キャパシティシナリオ一覧を表示する
2. When ユーザーがシナリオを新規作成した時, the 画面 shall シナリオを一覧に追加する
3. When ユーザーがシナリオを選択した時, the 画面 shall 月別労働時間の詳細情報を表示する
4. When ユーザーがシナリオを編集した時, the 画面 shall シナリオ名等の変更を反映する
5. When ユーザーがシナリオを削除した時, the 画面 shall 確認の上シナリオを一覧から除去する

### Requirement 3: 間接作業ケース管理画面
**Objective:** As a 事業部リーダー, I want 間接作業ケースの作成・編集・削除と比率入力を専用画面で行いたい, so that 間接作業ケース管理とデータ入力を独立した画面で効率的に操作できる

#### Acceptance Criteria
1. When ユーザーが `/master/indirect-work-cases` に遷移した時, the 画面 shall 間接作業ケース一覧を左パネルに表示する
2. When ユーザーがケースを新規作成した時, the 画面 shall ケースを一覧に追加し選択可能な状態にする
3. When ユーザーがケースを選択した時, the 画面 shall 右パネルに間接作業比率入力マトリクスを表示する
4. When ユーザーがケースを編集した時, the 画面 shall ケース名等の変更を反映する
5. When ユーザーがケースを削除した時, the 画面 shall 確認の上ケースを一覧から除去する
6. The 画面 shall BU セレクタを提供し、選択された BU に基づいてデータを絞り込む
7. When ユーザーが比率データを編集して保存ボタンを押した時, the 画面 shall データを永続化し成功を通知する

### Requirement 4: サイドバーナビゲーション
**Objective:** As a ユーザー, I want サイドバーから各マスタ管理画面に遷移したい, so that マスタ管理機能に素早くアクセスできる

#### Acceptance Criteria
1. The サイドバー shall 人員計画ケース・キャパシティシナリオ・間接作業ケースの各メニュー項目を表示する
2. When ユーザーがメニュー項目をクリックした時, the サイドバー shall 対応するマスタ管理画面に遷移する
3. While ユーザーが各マスタ管理画面を表示している間, the サイドバー shall 現在のページに対応するメニュー項目をアクティブ状態で表示する

### Requirement 5: 品質保証
**Objective:** As a 開発者, I want 新規画面が既存機能に影響を与えないことを保証したい, so that リグレッションなく安全にリリースできる

#### Acceptance Criteria
1. The アプリケーション shall TypeScript コンパイルエラーがない状態を維持する
2. The アプリケーション shall 既存のテストスイートが全てパスする状態を維持する
3. The 各マスタ管理画面 shall 既存コンポーネントを再利用し、機能の重複を避ける

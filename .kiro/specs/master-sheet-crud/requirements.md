# Requirements Document

## Introduction
マスター管理画面（business-units, project-types, work-types）において、現在の「一覧 → 詳細 → 編集」の3ページ構成を、一覧画面内のSheet表示に統合する。すべてのCRUD操作を一覧画面内で完結させることで、ページ遷移を排除し操作効率を向上させる。3つのマスターで共通パターンを適用する。

GitHub Issue: #38

## Requirements

### Requirement 1: レコード詳細のSheet表示
**Objective:** As a 管理者, I want 一覧画面でレコードをクリックしてSheet内に詳細を表示したい, so that ページ遷移なしにレコード内容を素早く確認できる

#### Acceptance Criteria
1. When ユーザーが一覧テーブルの行をクリックする, the マスター一覧画面 shall 選択されたレコードの詳細情報をSheet（サイドパネル）で表示する
2. While Sheetが閲覧モードで開いている, the マスター一覧画面 shall レコードの全フィールドを読み取り専用で表示する
3. When ユーザーがSheet外の領域をクリックする、またはSheetの閉じるボタンをクリックする, the マスター一覧画面 shall Sheetを閉じて一覧画面に戻る
4. The マスター一覧画面 shall business-units、project-types、work-typesの3マスターすべてで同一のSheet表示パターンを適用する

### Requirement 2: Sheet内での編集操作
**Objective:** As a 管理者, I want Sheet内で直接レコードを編集して保存したい, so that 画面遷移なしに素早くマスターデータを更新できる

#### Acceptance Criteria
1. While Sheetが閲覧モードで表示されている, when ユーザーが「編集」ボタンをクリックする, the マスター一覧画面 shall Sheet内のフィールドを編集可能な状態（編集モード）に切り替える
2. While Sheetが編集モードである, when ユーザーが「保存」ボタンをクリックする, the マスター一覧画面 shall 変更内容をAPIに送信し、保存成功後にSheetを閲覧モードに戻す
3. While Sheetが編集モードである, when ユーザーが「キャンセル」ボタンをクリックする, the マスター一覧画面 shall 変更を破棄してSheetを閲覧モードに戻す
4. If 保存時にバリデーションエラーが発生する, the マスター一覧画面 shall エラー内容をフォーム上に表示し、編集モードを維持する
5. When 保存が成功する, the マスター一覧画面 shall 一覧テーブルのデータを最新状態に更新する

### Requirement 3: Sheet内での新規作成
**Objective:** As a 管理者, I want 一覧画面から直接Sheetで新規レコードを作成したい, so that ページ遷移なしにマスターデータを追加できる

#### Acceptance Criteria
1. When ユーザーが一覧画面の「新規作成」ボタンをクリックする, the マスター一覧画面 shall 空のフォームを含むSheetを編集モードで開く
2. While 新規作成Sheetが開いている, when ユーザーが必須フィールドを入力して「保存」ボタンをクリックする, the マスター一覧画面 shall 新規レコードをAPIに送信し、保存成功後にSheetを閉じる
3. When 新規作成の保存が成功する, the マスター一覧画面 shall 一覧テーブルに新規レコードを反映する
4. If 新規作成時にバリデーションエラーが発生する, the マスター一覧画面 shall エラー内容をフォーム上に表示し、Sheetを開いたままにする

### Requirement 4: Sheet内での削除・復元操作
**Objective:** As a 管理者, I want Sheet内からレコードの削除・復元を行いたい, so that 一覧画面内ですべてのCRUD操作を完結できる

#### Acceptance Criteria
1. While Sheetが閲覧モードまたは編集モードで開いている, the マスター一覧画面 shall レコードの削除操作（ソフトデリート）を実行できるUIを提供する
2. When ユーザーが削除操作を実行する, the マスター一覧画面 shall 確認ダイアログを表示し、確認後にAPIへ削除リクエストを送信する
3. When 削除が成功する, the マスター一覧画面 shall Sheetを閉じ、一覧テーブルを最新状態に更新する
4. While 削除済みレコードのSheetが開いている, the マスター一覧画面 shall 復元操作を実行できるUIを提供する
5. When 復元が成功する, the マスター一覧画面 shall 一覧テーブルを最新状態に更新する

### Requirement 5: 旧ルートの廃止
**Objective:** As a 開発者, I want 詳細/編集/新規作成の個別ページルートを廃止したい, so that コードベースの複雑性を削減しメンテナンス性を向上できる

#### Acceptance Criteria
1. The マスター一覧画面 shall business-units、project-types、work-typesの各詳細ページルート（`$code/index.tsx`）を削除する
2. The マスター一覧画面 shall business-units、project-types、work-typesの各編集ページルート（`$code/edit.tsx`）を削除する
3. The マスター一覧画面 shall business-units、project-types、work-typesの各新規作成ページルート（`new.tsx`）を削除する
4. The マスター一覧画面 shall 既存のフォームコンポーネント（`*Form.tsx`）をSheet内で再利用する

### Requirement 6: 共通パターンの適用
**Objective:** As a 開発者, I want 3マスターで共通のSheet CRUDパターンを適用したい, so that 一貫性のあるUXと保守性の高いコードを実現できる

#### Acceptance Criteria
1. The マスター一覧画面 shall 閲覧/編集/新規作成のモード切替ロジックを3マスターで共通化する
2. The マスター一覧画面 shall Sheetの開閉・モード切替・保存後のキャッシュ更新において、3マスターで統一された操作フローを提供する
3. The マスター一覧画面 shall TypeScriptの型エラーなく実装する

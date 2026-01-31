# Requirements Document

## Introduction

操業管理システムにおける **案件（Projects）マスター管理画面** のフロントエンド実装要件を定義する。

案件は工数需要管理の基本単位であり、事業部（business_units）およびプロジェクト種別（project_types）と外部キーで関連付けられている。既存の事業部マスター管理画面のUIパターンを踏襲しつつ、外部キー参照先の「名前」表示やドロップダウン選択など、エンティティ管理画面固有の配慮を組み込む。

バックエンドAPIは実装済み（`/api/projects` CRUD + restore）であり、本要件はフロントエンド実装に焦点を当てる。

## Requirements

### Requirement 1: 案件一覧表示

**Objective:** As a 事業部リーダー/PM, I want 案件の一覧をテーブル形式で閲覧したい, so that 登録済み案件の全体像を把握し、管理対象を素早く特定できる

#### Acceptance Criteria

1. When ユーザーが `/master/projects` に遷移した場合, the Projects管理画面 shall ページネーション付きのテーブルで案件一覧を表示する
2. The Projects管理画面 shall 以下のカラムをテーブルに表示する: 案件コード（projectCode）、案件名（name）、事業部名（businessUnitName）、プロジェクト種別名（projectTypeName）、開始年月（startYearMonth）、総工数（totalManhour）、ステータス（status）、作成日時（createdAt）、更新日時（updatedAt）
3. The Projects管理画面 shall 外部キーで関連する事業部・プロジェクト種別について、コード値ではなく「名前」を一覧テーブルに表示する
4. When プロジェクト種別が未設定（null）の場合, the Projects管理画面 shall 該当セルをハイフン等の代替表示とする
5. The Projects管理画面 shall カラムヘッダークリックによるソート機能を提供する
6. When テーブルの行をクリックした場合, the Projects管理画面 shall 該当案件の詳細画面へ遷移する

### Requirement 2: 案件検索・フィルタリング

**Objective:** As a 事業部リーダー/PM, I want 案件をキーワードやフィルタで絞り込みたい, so that 大量の案件から目的のデータを効率的に見つけられる

#### Acceptance Criteria

1. The Projects管理画面 shall ツールバーに検索入力欄を配置し、デバウンス付きのキーワード検索を提供する
2. When 検索キーワードが入力された場合, the Projects管理画面 shall 案件コード・案件名を対象にフィルタリングし、ページを1に戻す
3. The Projects管理画面 shall 「削除済みを含む」トグルスイッチを提供し、ソフトデリート済み案件の表示・非表示を切り替えられる
4. While 「削除済みを含む」が有効な場合, the Projects管理画面 shall 削除済み案件を `opacity-50` のスタイルで視覚的に区別して表示する
5. The Projects管理画面 shall 検索条件・フィルタ条件をURLのSearch Paramsとして管理し、ブラウザの戻る/進む操作で状態を復元できる

### Requirement 3: 案件詳細表示

**Objective:** As a 事業部リーダー/PM, I want 案件の全フィールドを確認したい, so that 個別案件の登録内容を正確に把握できる

#### Acceptance Criteria

1. When ユーザーが `/master/projects/$projectId` に遷移した場合, the Projects管理画面 shall 案件の全フィールドを読み取り専用で表示する
2. The Projects管理画面 shall 事業部・プロジェクト種別について、コードではなく名前を詳細画面に表示する
3. The Projects管理画面 shall 詳細画面に「編集」ボタンと「削除」ボタンを配置する
4. When 「削除」ボタンがクリックされた場合, the Projects管理画面 shall 案件名を含む確認ダイアログを表示する
5. When 削除確認ダイアログで確定された場合, the Projects管理画面 shall ソフトデリートAPIを呼び出し、成功時に一覧画面へ遷移する
6. If 削除対象の案件が他エンティティ（project_cases等）から参照されている場合, the Projects管理画面 shall 409エラーをユーザーにわかりやすく通知する

### Requirement 4: 案件新規作成

**Objective:** As a PM, I want 新規案件を登録したい, so that 工数計画の対象として案件を管理下に置ける

#### Acceptance Criteria

1. When ユーザーが `/master/projects/new` に遷移した場合, the Projects管理画面 shall 案件作成フォームを表示する
2. The Projects管理画面 shall 以下の入力フィールドを提供する: 案件コード（テキスト入力・必須）、案件名（テキスト入力・必須）、事業部（ドロップダウン選択・必須）、プロジェクト種別（ドロップダウン選択・任意）、開始年月（YYYYMM形式入力・必須）、総工数（数値入力・必須）、ステータス（ドロップダウン選択・必須、選択肢: 計画/確定）、期間月数（数値入力・任意）
3. The Projects管理画面 shall 事業部の選択肢を `/api/business-units` から取得し、事業部名をラベルとして表示するドロップダウンを提供する
4. The Projects管理画面 shall プロジェクト種別の選択肢を `/api/project-types` から取得し、種別名をラベルとして表示するドロップダウンを提供する（未選択可）
5. The Projects管理画面 shall 各フィールドに対してZodスキーマによるバリデーションを実施し、エラーをフィールド単位で表示する
6. When フォームが送信された場合, the Projects管理画面 shall POST `/api/projects` を呼び出し、成功時に一覧画面へ遷移しトースト通知を表示する
7. If 案件コードが既に存在する場合（409エラー）, the Projects管理画面 shall 「この案件コードは既に使用されています」等のエラーメッセージを表示する
8. If バリデーションエラー（422）が返された場合, the Projects管理画面 shall サーバーからのエラー内容をユーザーに表示する

### Requirement 5: 案件編集

**Objective:** As a PM, I want 登録済み案件の情報を更新したい, so that 案件の状態変化や情報の修正を反映できる

#### Acceptance Criteria

1. When ユーザーが `/master/projects/$projectId/edit` に遷移した場合, the Projects管理画面 shall 既存の案件データをプリフィルした編集フォームを表示する
2. The Projects管理画面 shall 案件コードフィールドを編集不可（disabled）とする
3. The Projects管理画面 shall 事業部・プロジェクト種別の変更にドロップダウン選択を提供し、現在の値を初期選択状態とする
4. When フォームが送信された場合, the Projects管理画面 shall PUT `/api/projects/$projectId` を呼び出し、成功時に詳細画面へ遷移しトースト通知を表示する
5. If 対象の案件が見つからない場合（404エラー）, the Projects管理画面 shall 「案件が見つかりません」等のエラーメッセージを表示する
6. If 変更後の案件コードが他の案件と重複する場合（409エラー）, the Projects管理画面 shall 重複エラーメッセージを表示する

### Requirement 6: 案件復元

**Objective:** As a 管理者, I want 誤って削除した案件を復元したい, so that データの誤操作から回復できる

#### Acceptance Criteria

1. While 「削除済みを含む」フィルタが有効な場合, the Projects管理画面 shall 削除済み案件の行に「復元」ボタンを表示する
2. When 「復元」ボタンがクリックされた場合, the Projects管理画面 shall 確認ダイアログを表示する
3. When 復元が確定された場合, the Projects管理画面 shall POST `/api/projects/$projectId/actions/restore` を呼び出し、成功時にキャッシュを無効化して一覧を再取得する
4. If 復元時に案件コードの重複が発生した場合（409エラー）, the Projects管理画面 shall 重複エラーメッセージをユーザーに通知する

### Requirement 7: ナビゲーション・パンくず

**Objective:** As a ユーザー, I want 管理画面内の現在位置を把握し、スムーズに画面遷移したい, so that 操作に迷わず効率的に作業できる

#### Acceptance Criteria

1. The Projects管理画面 shall 各画面にパンくずリストを表示する（一覧 → 詳細 → 編集、一覧 → 新規作成）
2. The Projects管理画面 shall ツールバーに「新規作成」ボタンを配置し、`/master/projects/new` への導線を提供する
3. The Projects管理画面 shall 一覧画面のルートパスを `/master/projects` とし、TanStack Routerのファイルベースルーティングに準拠する

### Requirement 8: 外部キー参照の選択UI

**Objective:** As a PM, I want 事業部やプロジェクト種別をコードではなく名前で選択したい, so that コードを暗記していなくても正確に入力できる

#### Acceptance Criteria

1. The Projects管理画面 shall 事業部選択ドロップダウンにアクティブな事業部のみを表示する（ソフトデリート済みは除外）
2. The Projects管理画面 shall プロジェクト種別選択ドロップダウンにアクティブなプロジェクト種別のみを表示する（ソフトデリート済みは除外）
3. While ドロップダウンの選択肢が読み込み中の場合, the Projects管理画面 shall ローディング状態を表示する
4. If 選択肢の取得に失敗した場合, the Projects管理画面 shall エラー状態を表示し、リトライの手段を提供する
5. The Projects管理画面 shall ドロップダウンの選択肢として「名前」をラベル、「コード」を内部値として使用する

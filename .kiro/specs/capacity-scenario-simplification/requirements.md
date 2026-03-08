# Requirements Document

## Introduction

キャパシティシナリオのマスタ管理画面（`/master/capacity-scenarios`）を「稼働時間」マスタ管理画面にリネーム・再構成するリファクタリング。現在の2カラム独自レイアウト（左: シナリオリスト、右: 月別キャパシティテーブル）から、作業種類・ビジネスユニット等と同じ標準マスタ管理画面パターン（PageHeader + DataTableToolbar + DataTable + DetailSheet）に統一する。月別キャパシティの計算結果表示はシミュレーション画面に一本化し、マスタ管理画面からは削除する。

## Requirements

### Requirement 1: 画面名称の変更

**Objective:** As a ユーザー, I want キャパシティシナリオ画面の名称が「稼働時間」に変更されること, so that 画面の役割がマスタ管理であることが明確になる

#### Acceptance Criteria
1. The フロントエンド shall サイドバーナビゲーションにおいて「キャパシティシナリオ」の表示を「稼働時間」に変更する
2. The フロントエンド shall ルート `/master/capacity-scenarios` のページタイトル（PageHeader）を「稼働時間」と表示する

### Requirement 2: 標準マスタ管理画面パターンへの統一

**Objective:** As a ユーザー, I want 稼働時間画面が他のマスタ管理画面（作業種類・ビジネスユニット等）と同じUI構成であること, so that アプリ全体で一貫した操作体験が得られる

#### Acceptance Criteria
1. The フロントエンド shall PageHeader コンポーネントを使用してページタイトルと説明文を表示する
2. The フロントエンド shall DataTableToolbar コンポーネントを使用して検索フィールド・無効データ表示トグル・新規作成ボタンを表示する
3. The フロントエンド shall DataTable コンポーネントを使用してシナリオ一覧をテーブル形式で表示する
4. The フロントエンド shall テーブルカラムとして、コード（ソート可能）・名前（ソート可能）・表示順（ソート可能）・ステータス・更新日時（ソート可能）・アクション（復元）を含める
5. When ユーザーがテーブル行をクリックした時, the フロントエンド shall 詳細シートを表示する
6. The フロントエンド shall 共通カラムヘルパー（createSortableColumn, createStatusColumn, createDateTimeColumn, createRestoreActionColumn）を使用する

### Requirement 3: CRUD操作の標準化

**Objective:** As a ユーザー, I want シナリオのCRUD操作が他のマスタ管理画面と同じ DetailSheet パターンで行えること, so that 操作方法に迷わずに済む

#### Acceptance Criteria
1. When ユーザーが新規作成ボタンをクリックした時, the フロントエンド shall 新規作成用の DetailSheet を表示する
2. When ユーザーがテーブル行をクリックした時, the フロントエンド shall 閲覧用の DetailSheet を表示する
3. When ユーザーが DetailSheet 内の編集ボタンをクリックした時, the フロントエンド shall 編集モードの DetailSheet を表示する
4. When ユーザーが DetailSheet 内の削除ボタンをクリックした時, the フロントエンド shall 削除確認ダイアログを表示する
5. The フロントエンド shall useMasterSheet フックを使用して DetailSheet の状態管理を行う

### Requirement 4: 月別キャパシティ計算結果の削除

**Objective:** As a 開発者, I want マスタ管理画面から月別キャパシティの計算結果表示を削除すること, so that 計算結果の確認がシミュレーション画面に一本化され情報の重複がなくなる

#### Acceptance Criteria
1. The フロントエンド shall マスタ管理画面から MonthlyCapacityTable コンポーネントの使用を削除する
2. The フロントエンド shall MonthlyCapacityTable コンポーネントファイルを削除する
3. The フロントエンド shall MonthlyCapacityTable のテストファイルを削除する
4. The フロントエンド shall feature の index.ts から MonthlyCapacityTable のエクスポートを削除する
5. The フロントエンド shall useCapacityScenariosPage フックから monthlyCapacitiesQueryOptions 関連のクエリを削除する（または不要になったフック自体を削除する）

### Requirement 5: 品質保証

**Objective:** As a 開発者, I want リファクタリング後もアプリケーションが正常に動作すること, so that 既存機能にデグレが発生しない

#### Acceptance Criteria
1. The フロントエンド shall TypeScript のビルド（`tsc -b`）がエラーなく完了する
2. The フロントエンド shall シミュレーション画面（`/indirect/simulation`）の計算結果表示に影響がない
3. The フロントエンド shall 既存のテストが正常に通過する

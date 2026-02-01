# Implementation Plan

## Task 1. データベーススキーマの変更
- [x] 1.1 chart_views テーブルに business_unit_codes カラムを追加する
  - テーブル定義ドキュメント（create-tables.sql）の chart_views に BU コードを格納する JSON 文字列カラム（NULL 許容）を追加する
  - 既存テーブルへの ALTER TABLE SQL クエリを別途作成する（alter-chart-views-add-bu-codes.sql）
  - シードデータ（seed-data.sql）の chart_views INSERT 文に BU コードの値を追加する（PLANT 全体負荷 → PLANT の BU コード、TRANS 全体負荷 → TRANS の BU コード等）
  - 既存レコードの business_unit_codes は NULL のまま許容する（後方互換）
  - _Requirements: 4.1, 3.2_

## Task 2. バックエンドの型定義とバリデーション更新
- [x] 2.1 (P) ChartView 関連の Zod スキーマと TypeScript 型に businessUnitCodes フィールドを追加する
  - 作成用スキーマに BU コード配列フィールドをオプショナルとして追加する
  - 更新用スキーマに BU コード配列フィールドをオプショナルとして追加する
  - DB 行型に JSON 文字列としての BU コードフィールド（nullable）を追加する
  - API レスポンス型に文字列配列としての BU コードフィールド（nullable）を追加する
  - Zod バリデーションで各要素が文字列であることを検証する
  - _Requirements: 4.4, 5.1, 5.3_

## Task 3. バックエンドのデータアクセス・変換処理更新
- [x] 3.1 データアクセス層の CRUD SQL に BU コードカラムを追加する
  - SELECT のベースクエリに business_unit_codes カラムを追加する
  - CREATE 処理の INSERT 文と入力パラメータに BU コードを追加し、JSON 文字列としてシリアライズする
  - UPDATE 処理の動的 SET 句に BU コードを追加し、既存の条件付き更新パターンに従う
  - BU コードが未指定の場合は NULL を格納する
  - Task 2.1 の型定義に依存
  - _Requirements: 4.1, 1.1, 1.2_

- [x] 3.2 (P) Transform 層に JSON 文字列と配列の相互変換を追加する
  - DB 行の JSON 文字列を API レスポンスの文字列配列にデシリアライズする変換処理を追加する
  - NULL の場合は null をそのまま返す
  - JSON パースエラーの場合は null にフォールバックする（防御的プログラミング）
  - Task 2.1 の型定義に依存
  - _Requirements: 4.2, 4.3_

## Task 4. バックエンドテストの更新
- [x] 4.1 データアクセス層・サービス層・ルートのテストを BU コード対応に更新する
  - データアクセス層テストで BU コード付きのプロファイル作成・更新・取得が正しく動作することを検証する
  - サービス層テストの既存テストケースに BU コードフィールドを追加して通過を確認する
  - ルートテストで POST / PUT リクエストに BU コードを含め、レスポンスに反映されることを検証する
  - BU コードなしのリクエストでも後方互換で動作することを検証する
  - Task 3.1, 3.2 に依存
  - _Requirements: 3.2, 1.1, 1.2, 1.3_

## Task 5. フロントエンドの型定義と API クライアント更新
- [x] 5.1 (P) フロントエンドの ChartView 関連型に BU コードフィールドを追加する
  - ChartView レスポンス型に BU コード配列（nullable）を追加する
  - 作成用入力型に BU コード配列（オプショナル）を追加する
  - 更新用入力型に BU コード配列（オプショナル）を追加する
  - API クライアントの呼び出しで BU コードを送信するよう更新する
  - _Requirements: 5.2, 1.1, 1.2_

## Task 6. フロントエンド ProfileManager と画面の BU 連動実装
- [x] 6.1 ProfileManager コンポーネントで BU コードの保存と適用を実装する
  - コンポーネントの入力に現在選択中の BU コード一覧を受け取れるようにする
  - 新規保存時に BU コードをプロファイルデータに含めて送信する
  - 上書き保存時に BU コードを更新データに含めて送信する
  - BU 未選択（空配列）の場合もそのまま保存する
  - 適用コールバックで保存された BU コード（null の場合あり）を返す
  - Task 5.1 に依存
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1_

- [x] 6.2 設定パネルから ProfileManager への BU コード受け渡しを追加する
  - 設定パネルが親から受け取った BU コードを ProfileManager に透過的に渡す
  - 適用コールバックの戻り値に BU コード情報を含めて親に伝搬する
  - Task 6.1 に依存
  - _Requirements: 1.1, 2.1_

- [x] 6.3 WorkloadPage でプロファイル適用時に BU 選択状態を復元する
  - プロファイル適用コールバックで BU コードが null でない場合に BU 選択状態を更新する
  - BU 復元と期間復元を1回の URL 更新で一括実行する（デザインレビューの Advisory 対応）
  - BU コードが null の場合（旧プロファイル）は現在の BU 選択を変更しない
  - URL の bu パラメータ更新により TanStack Query が自動的にチャートデータを再取得する
  - Task 6.2 に依存
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.3_

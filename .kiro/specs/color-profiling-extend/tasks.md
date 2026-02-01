# Implementation Plan

- [x] 1. DB スキーマ更新とバックエンド型定義の拡張
- [x] 1.1 chart_view_project_items テーブルに色カラムを追加する
  - `docs/database/create-tables.sql` の CREATE TABLE 文に `color_code VARCHAR(7) NULL` カラムを追加する
  - `docs/database/seed-data.sql` の INSERT 文に `color_code` 値を含める（既存シードデータに色を付与）
  - DB スキーマドキュメント（`docs/database/table-spec.md`）のテーブル定義を更新する
  - 既存 DB 向けの ALTER TABLE 文も用意する
  - _Requirements: 1.1_

- [x] 1.2 バックエンドの ChartViewProjectItem スキーマ・型に color を追加する
  - 作成スキーマ・更新スキーマに `color` フィールド（文字列、最大7文字、NULL許容、オプション）を追加する
  - DB 行型に `color_code` フィールドを追加する
  - API レスポンス型に `color` フィールドを追加する
  - レスポンス変換関数で `color_code` → `color` の変換を追加する
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.3 既存の CRUD 操作に color フィールドを反映する
  - 作成処理の INSERT SQL に `color_code` カラムを追加する
  - 更新処理の UPDATE SQL に `color_code` カラムを追加する
  - 取得処理の SELECT SQL に `color_code` カラムを追加する
  - color が未指定の場合は NULL として保存されることを確認する
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 2. バックエンド一括更新 API の実装
- [x] 2.1 一括更新用の Zod バリデーションスキーマを定義する
  - プロジェクトID、プロジェクトケースID（NULL許容）、並び順、表示フラグ、色（NULL許容）を含むアイテム配列スキーマを作成する
  - _Requirements: 2.4_

- [x] 2.2 データ層に bulkUpsert メソッドを実装する
  - SQL MERGE ステートメントで既存レコードの更新・新規レコードの挿入を行う
  - MERGE ON 条件で `project_case_id` の NULL を安全に比較する（ISNULL 使用）
  - MERGE 完了後、リクエストに含まれないアイテムを DELETE する（完全同期方式）
  - 全操作をトランザクション内で原子的に実行する
  - _Requirements: 2.2, 2.3_

- [x] 2.3 サービス層に bulkUpsert のバリデーションロジックを実装する
  - ChartView の存在確認（存在しない場合 404）
  - 各アイテムのプロジェクトIDの存在確認（存在しない場合 422）
  - プロジェクトケースIDが指定されている場合の関連バリデーション
  - バリデーション成功時にデータ層を呼び出し、レスポンスを変換して返す
  - _Requirements: 2.2, 2.3, 2.5, 2.6_

- [x] 2.4 ルーティングに一括更新エンドポイントを追加する
  - `PUT /chart-views/:chartViewId/project-items/bulk` エンドポイントを定義する
  - Zod バリデーターでリクエストボディを検証する
  - バリデーションエラー時は RFC 9457 形式でエラーレスポンスを返す
  - 成功時は更新後のアイテム一覧をレスポンスとして返す
  - _Requirements: 2.1, 2.5, 2.6_

- [x] 3. バックエンド API テストの追加
- [x] 3.1 (P) 既存 CRUD エンドポイントの color 対応テストを追加する
  - 作成時に color を指定するテスト
  - 更新時に color を変更するテスト
  - 取得時にレスポンスに color が含まれるテスト
  - color 未指定時に null として保存されるテスト
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 3.2 (P) 一括更新エンドポイントの統合テストを追加する
  - 正常系: 新規アイテムの挿入、既存アイテムの更新、不要アイテムの削除が同時に行われるテスト
  - `project_case_id` が NULL のアイテムが正しく MERGE されるテスト
  - 存在しない ChartView ID で 404 エラーが返るテスト
  - 存在しないプロジェクトIDで 422 エラーが返るテスト
  - バリデーションエラーで 400 エラーが返るテスト
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 4. フロントエンド型・API クライアント・Mutation の拡張
- [x] 4.1 (P) フロントエンドの ChartViewProjectItem 型に color を追加する
  - API レスポンス型に `color: string | null` フィールドを追加する
  - _Requirements: 6.1_

- [x] 4.2 (P) API クライアントに一括更新関数を追加する
  - 一括更新エンドポイントを呼び出す関数を追加する
  - リクエストボディの型を定義する
  - _Requirements: 6.2_

- [x] 4.3 一括更新用の Mutation Hook を追加する
  - `useBulkUpsertChartViewProjectItems` を作成する
  - 成功時に ChartViewProjectItems 関連のクエリキャッシュを無効化する
  - _Requirements: 6.3, 6.4_

- [x] 5. ProfileManager の保存・適用・上書き機能の実装
- [x] 5.1 ProfileManager の Props を拡張し、現在の画面状態を受け取れるようにする
  - 案件ごとの色・並び順・表示状態を含むアイテム配列を props で受け取る
  - 適用時のコールバックにアイテム情報を含めるよう拡張する
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3, 4.4_

- [x] 5.2 新規保存時にプロジェクトアイテムを同時保存する
  - ChartView 作成成功後に一括更新 mutation を呼び出し、現在の画面状態を保存する
  - アイテム保存が失敗した場合はエラートーストを表示する
  - 保存完了後にプロファイル一覧を最新化する
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5.3 適用時にプロジェクトアイテムを取得し画面状態を復元する
  - プロファイル選択時に紐づくプロジェクトアイテムを API から取得する
  - 取得したアイテムの色・並び順・表示状態を onApply コールバックで親コンポーネントに返す
  - プロジェクトアイテムが存在しない旧プロファイルの場合は期間設定のみ復元する
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5.4 上書き保存ボタンと確認ダイアログを追加する
  - プロファイル一覧の各行に上書き保存アイコンボタンを配置する
  - ボタンクリック時に確認ダイアログを表示する
  - 確認後、ChartView メタデータの更新と一括更新 mutation を実行する
  - 成功時に成功トースト表示とプロファイル一覧の更新、失敗時にエラートーストを表示する
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 6. SidePanelSettings と ProfileManager の統合
- [x] 6.1 SidePanelSettings から ProfileManager に画面状態を渡す
  - 現在のローカル state（色・並び順）からプロジェクトアイテム配列を構築し、ProfileManager に props として渡す
  - _Requirements: 3.1, 3.2_

- [x] 6.2 適用コールバックで SidePanelSettings のローカル state を復元する
  - ProfileManager から返されたアイテム情報を受け取り、projColors と projOrder を更新する
  - 色情報が NULL のアイテムはグローバル色設定からフォールバックする
  - onProfileApply コールバックの型を拡張して期間設定とアイテム情報を含める
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

# Implementation Plan

- [x] 1. MonthlyCapacity 関連コードの削除と feature エクスポートの整理
- [x] 1.1 (P) MonthlyCapacityTable コンポーネントとテストファイルの削除
  - MonthlyCapacityTable コンポーネントファイルを削除する
  - MonthlyCapacityTable のテストファイルを削除する
  - _Requirements: 4.2, 4.3_

- [x] 1.2 (P) useCapacityScenariosPage フックの削除
  - マスタ管理画面専用の useCapacityScenariosPage フックを削除する（monthlyCapacitiesQueryOptions 関連のクエリを含む）
  - _Requirements: 4.5_

- [x] 1.3 feature エクスポートの更新
  - index.ts から MonthlyCapacityTable のエクスポートを削除する
  - useCapacityScenariosPage 関連のエクスポートがあれば削除する
  - 1.1, 1.2 の完了後に実施
  - _Requirements: 4.4_

- [x] 2. CapacityScenarioDetailSheet の作成
  - 標準 DetailSheet パターン（WorkTypeDetailSheet と同等の構造）に準拠した新規コンポーネントを作成する
  - view モード: scenarioName, description, hoursPerPerson, isPrimary, createdAt, updatedAt を閲覧表示する
  - edit/create モード: 既存の ScenarioFormSheet を組み込んでフォーム表示する
  - 削除確認ダイアログ（DeleteConfirmDialog）と復元確認ダイアログ（RestoreConfirmDialog）を組み込む
  - エラーハンドリング: 409（名前重複）、422（バリデーション）、404（削除済み）を標準パターンで処理する
  - 既存の mutation フック（useCreateCapacityScenario 等）を使用する
  - feature の index.ts に CapacityScenarioDetailSheet のエクスポートを追加する
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. ルートファイルの書き換えと画面名称変更
- [x] 3.1 マスタ管理画面の標準パターンへの書き換え
  - 現在の index.lazy.tsx を削除し、index.tsx として標準マスタ管理画面パターンで新規作成する
  - createFileRoute + validateSearch による検索パラメータ管理に変更する
  - useMasterSheet フックで Sheet 状態管理を行う
  - PageHeader で「稼働時間」タイトルと説明文を表示する
  - DataTableToolbar で検索・無効データ表示トグル・新規作成ボタンを表示する
  - DataTable でシナリオ一覧を表示し、行クリックで DetailSheet を開く
  - カラム定義: scenarioName（ソート可能）、hoursPerPerson（カスタム表示）、isPrimary（Badge 表示）、ステータス、更新日時、アクション（復元）
  - 共通カラムヘルパー（createSortableColumn, createStatusColumn, createDateTimeColumn, createRestoreActionColumn）を使用する
  - CapacityScenarioDetailSheet を組み込む
  - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.5, 4.1_

- [x] 3.2 (P) サイドバーナビゲーションの名称変更
  - SidebarNav の「キャパシティシナリオ」ラベルを「稼働時間」に変更する
  - _Requirements: 1.1_

- [x] 4. ビルド検証とテスト実行
  - TypeScript ビルド（tsc -b）がエラーなく完了することを確認する
  - 既存テストが正常に通過することを確認する
  - シミュレーション画面の CapacityScenarioList や関連コンポーネントの参照に影響がないことを確認する
  - _Requirements: 5.1, 5.2, 5.3_

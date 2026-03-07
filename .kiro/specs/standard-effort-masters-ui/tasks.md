# Implementation Plan

- [x] 1. 型定義・Zod スキーマ・定数の基盤構築
  - 標準工数マスタのエンティティ型（一覧用・詳細用）、入力型（作成・更新）、一覧パラメータ型を定義する
  - 重み入力の Zod スキーマ（progressRate: 0-100 整数、weight: 0 以上整数）、作成/更新スキーマ（weights 21 要素固定）、検索パラメータスキーマ（デフォルト値付き）を定義する
  - 定数 `PROGRESS_RATES`（0, 5, 10, ..., 100 の 21 要素配列）と `DEFAULT_WEIGHTS`（全 weight: 0 の 21 要素配列）を定義する
  - API レスポンスに BU 名・PT 名は含まれないため、`deletedAt: string | null` でステータスを導出する設計とする
  - feature の公開エクスポート（index.ts）を設定する
  - _Requirements: 8.2, 8.4_

- [x] 2. API レイヤーの構築
- [x] 2.1 CRUD API クライアントとカスタム一覧取得の実装
  - `createCrudClient` ファクトリで詳細取得・作成・更新・削除・復元のクライアントを生成する
  - 一覧取得はカスタム実装とする（BU コード・PT コードによるフィルタパラメータを `URLSearchParams` で手動構築）
  - BU/PT Select ドロップダウン用の fetch 関数を feature 内に独自定義する（feature 間依存回避）
  - _Requirements: 8.2_

- [x] 2.2 クエリキーとクエリオプションの定義
  - `createQueryKeys` ファクトリでクエリキーを生成する
  - `createListQueryOptions` / `createDetailQueryOptions` ファクトリで一覧・詳細のクエリオプションを定義する
  - BU/PT Select 用のクエリオプションを定義する（queryKey を既存 projects feature と同一にしてキャッシュ共有）
  - マスタデータの更新頻度が低いため、適切な staleTime を設定する
  - _Requirements: 8.2_

- [x] 2.3 CRUD ミューテーションフックの定義
  - `createCrudMutations` ファクトリで作成・更新・削除・復元の mutation hooks を生成する
  - キャッシュ無効化（一覧・詳細）はファクトリが自動処理する
  - _Requirements: 8.2_

- [x] 3. スタンドアロン UI コンポーネントの実装
- [x] 3.1 (P) 重み分布エリアチャートの実装
  - Recharts AreaChart で横軸に進捗率（0%-100%）、縦軸に重みを表示する再利用可能コンポーネントを作成する
  - 既存 WorkloadChart のパターンを踏襲し、ResponsiveContainer + linearGradient + カスタムツールチップを使用する
  - XAxis フォーマッタで `XX%` 表示、ツールチップで `進捗率: XX% / 重み: YY` を表示する
  - CSS variables でテーマ統合し、全 weight が 0 のときもフラットラインとしてチャート領域を表示する
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 3.2 (P) DataTable カラム定義の実装
  - 一覧画面用のカラム定義を作成する（パターン名・BU・PT・ステータス・更新日時）
  - パターン名カラムは詳細画面への Link を含む
  - BU 名・PT 名はコード→名前の lookup map（`Map<string, string>`）を引数で受け取り `accessorFn` で解決する
  - ステータスカラムは `deletedAt` の null 判定で active/deleted を導出する
  - column-helpers（`createStatusColumn`, `createDateTimeColumn`, `createRestoreActionColumn`）を使用する
  - _Requirements: 1.1, 8.3_

- [x] 4. フォーム・詳細コンポーネントの実装
- [x] 4.1 標準工数マスタフォームの実装（重みテーブル + チャートプレビュー）
  - マスタ情報入力（BU: QuerySelect、PT: QuerySelect、パターン名: FormTextField）と、21 行固定の重みテーブル入力と、エリアチャートプレビューを統合したフォームコンポーネントを作成する
  - TanStack Form の `mode="array"` で重み配列を管理し、各行は progressRate を読み取り専用ラベル、weight を数値入力として表示する
  - `form.useStore` でフォーム値をリアクティブに監視し、重み分布チャートにリアルタイム反映する
  - `mode` prop で create / edit を切替え、edit 時は BU/PT の QuerySelect を disabled にする
  - Zod スキーマによるバリデーションエラーをフィールドレベルで表示する
  - _Requirements: 2.1, 2.2, 2.4, 3.2, 3.3_

- [x] 4.2 詳細/編集モード切替コンポーネントの実装
  - `isEditing` state で閲覧モードと編集モードを切り替える統合コンポーネントを作成する
  - 閲覧モード: DetailRow でマスタ情報を表示し、読み取り専用の重みテーブルとエリアチャートを表示する
  - 編集モード: StandardEffortMasterForm を `mode="edit"` で表示し、既存データを初期値としてセットする
  - キャンセル時は変更を破棄して閲覧モードに戻り、保存成功後も閲覧モードに戻る
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [x] 5. ルートページの実装
- [x] 5.1 一覧画面ルートの実装
  - search params の Zod バリデーション、BU/PT フィルタ用 QuerySelect、パターン名テキスト検索、無効データ表示トグル、ページネーションを統合した一覧画面を作成する
  - BU/PT Select クエリのキャッシュデータから `useMemo` で code→name の lookup map を作成し、カラムに渡す
  - 行クリックで詳細画面に遷移し、行ホバーで詳細データをプリフェッチする
  - PageHeader + DataTableToolbar + DataTable + RestoreConfirmDialog のレイアウト構成とする
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 5.2 (P) 新規作成画面ルートの実装
  - StandardEffortMasterForm を `mode="create"` で描画し、作成 mutation で API に送信する
  - 成功時にトースト通知を表示して一覧画面に遷移する
  - API エラー（409 重複、422 FK 不存在）をトースト通知で表示する
  - PageHeader（パンくずリスト付き）+ StandardEffortMasterForm のレイアウト構成とする
  - _Requirements: 2.1, 2.3, 2.4, 2.5_

- [x] 5.3 (P) 詳細/編集画面ルートの実装
  - 詳細クエリでデータを取得し、StandardEffortMasterDetail に渡す
  - PageHeader の actions に「編集」「削除」ボタンを配置し、論理削除済みレコードには「復元」ボタンを表示する
  - 削除: DeleteConfirmDialog → 削除 mutation → 一覧遷移、復元: RestoreConfirmDialog → 復元 mutation → データ再取得
  - API エラー（404 NotFoundState、409 参照整合性違反トースト）を処理する
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [x] 6. (P) サイドバーナビゲーションへのメニュー追加
  - マスタ管理セクションに「標準工数パターン」メニュー項目を追加する
  - 工数カーブを視覚的に表現する TrendingUp アイコン（lucide-react）を使用する
  - クリック時に標準工数マスタの一覧画面に遷移する
  - _Requirements: 5.1, 5.2_

- [x] 7. バックエンド Bulk API エンドポイントの実装
- [x] 7.1 (P) エクスポートエンドポイントの実装
  - 全アクティブマスタと weights を JOIN して取得するエクスポート API を実装する
  - `filter[businessUnitCode]` パラメータで BU 単位のフィルタリングをサポートする
  - 既存ルートファイルに `actions/export` として追加する
  - Data レイヤーにエクスポート用クエリ、Service レイヤーにビジネスロジック、Types に Zod スキーマを追加する
  - _Requirements: 7.1, 7.2_

- [x] 7.2 インポートエンドポイントの実装
  - standardEffortId と weights 配列を受け取り、weights を全置換（DELETE → INSERT）するインポート API を実装する
  - 各 item の standardEffortId が存在することを検証し、不在なら 422 エラーを返す
  - トランザクション内で全 item を処理し、更新件数を返す
  - 既存ルートファイルに `actions/import` として追加する
  - _Requirements: 7.6_

- [x] 8. フロントエンド Bulk 機能の実装
- [x] 8.1 Bulk API クライアントの実装
  - エクスポートデータ取得（GET with optional BU filter）とインポートデータ送信（POST）の API クライアントを作成する
  - エクスポート/インポートのレスポンス型を定義する
  - _Requirements: 7.1, 7.6_

- [x] 8.2 (P) Excel エクスポートフックの実装
  - 一覧画面の BU フィルタ値を受け取り、API からデータ取得し、既存の `buildBulkExportWorkbook` / `downloadWorkbook` で Excel を生成・ダウンロードするフックを作成する
  - Excel 構成: 固定カラム（ID / パターン名 / BU コード / PT コード）+ 値カラム（0%, 5%, ..., 100% の 21 列）
  - データなし時はトースト警告を表示する
  - _Requirements: 7.1, 7.2_

- [x] 8.3 (P) Excel インポートフックの実装
  - 既存の `parseExcelFile` / `parseBulkImportSheet` でファイル解析し、プレビューデータを生成するフックを作成する
  - パース設定: 固定カラム 4 列、値カラム 21 列（0%-100%）、キーコード（standardEffortId）が正の整数であることを検証
  - 確認時に preview データから API 送信用の配列を構築し、成功後にクエリキャッシュを全無効化する
  - _Requirements: 7.4, 7.5, 7.6_

- [x] 8.4 一覧画面への Bulk ボタン・ダイアログ統合
  - 一覧画面のツールバー右側に「エクスポート」「インポート」ボタンを追加する
  - エクスポート: 現在の BU フィルタ値を渡して Excel ダウンロードを実行する
  - インポート: ExcelImportDialog を表示し、ファイル選択・プレビュー・バリデーション・実行の一連のフローを処理する
  - API エラーをトースト通知で表示する
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 9. ビルド検証と結合確認
  - `pnpm --filter frontend build` で TypeScript コンパイルエラーがないことを確認する
  - `pnpm --filter backend build` でバックエンドのコンパイルを確認する
  - `pnpm test` で既存テストが全パスすることを確認する
  - feature の公開エクスポート（index.ts）が正しく設定されていることを確認する
  - _Requirements: 8.4, 8.5_

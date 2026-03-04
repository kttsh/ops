# Implementation Plan

- [x] 1. Excel 共通ユーティリティの構築
- [x] 1.1 エクスポート用のワークブック生成・ダウンロード機能を実装する
  - `xlsx` を動的 import でロードし、ExportSheetConfig を受け取ってワークブックを生成する関数を作成する
  - 行ヘッダーラベル（"ケース名" / "BU名"）と年月列ヘッダー（YYYY-MM 形式）を含むヘッダー行を生成する
  - ExportRow 配列から行ラベル + 月別値の Array of Arrays を構築し、`aoa_to_sheet` でシートに変換する
  - カラム幅を設定する（ラベル列: 20、月列: 12）
  - `writeFileXLSX` でファイルダウンロードを実行する `downloadWorkbook` 関数を作成する
  - _Requirements: 1.2, 1.3, 2.2, 2.3, 5.3_
  - _Contracts: excel-utils Service_

- [x] 1.2 インポート用の Excel パース・バリデーション機能を実装する
  - `xlsx` を動的 import でロードし、File オブジェクトから ArrayBuffer 経由でワークブックを読み込む `parseExcelFile` 関数を作成する
  - 1行目をヘッダー、2行目以降をデータ行として解析し、ヘッダー文字列と生データ行を返す
  - ImportParseConfig を受け取り、ヘッダーの年月変換（YYYY-MM → YYYYMM）とバリデーション付きの行解析を行う `parseImportSheet` 関数を作成する
  - manhour 範囲チェック（0 以上 99,999,999 以下）の `validateManhour` 関数を作成する
  - yearMonth フォーマットチェック（YYYYMM 6桁）の `validateYearMonth` 関数を作成する
  - バリデーションエラーは行番号・列番号・フィールド名・メッセージ・値を含む ValidationError 型で返す
  - `.xlsx` / `.xls` 以外のファイル形式でエラーをスローする
  - _Requirements: 3.2, 3.5, 3.6, 4.2, 4.5, 4.6, 6.3, 6.6, 7.1, 7.2, 7.3_
  - _Contracts: excel-utils Service_

- [x] 2. (P) 共通インポートダイアログを構築する
  - shadcn/ui の Dialog（Radix Dialog ベース）を使い、ファイル選択とプレビューの 2 ステップダイアログを作成する
  - ファイル選択ステップ: ドラッグ＆ドロップゾーンとファイル選択ボタンを配置し、`.xlsx` / `.xls` ファイルのみ受け付ける
  - 非対応ファイル形式の場合はファイル形式エラーを表示する
  - ファイル選択時に props の `onFileParsed` コールバックを呼び出し、プレビューステップに遷移する
  - プレビューステップ: ヘッダー（年月列）とデータ行をテーブル形式で表示する（最大 50 行、全件数は別途表示）
  - バリデーションエラーのある行を赤色ハイライトし、ツールチップでエラー詳細を表示する
  - エラーがある場合はインポート確定ボタンを無効化する
  - インポート確定ボタンクリック時に `onConfirm` を呼び出し、処理中はローディング状態を表示して操作を無効化する
  - ダイアログクローズ時にすべての内部ステートをリセットする
  - _Requirements: 3.1, 3.3, 3.5, 4.1, 4.3, 4.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.6_
  - _Contracts: ExcelImportDialog State_

- [x] 3. (P) 案件工数エクスポート機能を実装する
  - `useProjectLoadExcelExport` フックを作成し、caseName・loads・yearMonths を受け取って ExportSheetConfig を構築し、excel-utils でエクスポートする
  - 選択中のケースの月別工数データを 1 データ行として出力する（行ラベル = ケース名）
  - loads が空の場合はトースト通知でエクスポート不可を知らせる
  - isExporting ステートでローディング表示と二重クリック防止を行う
  - CaseStudySection にエクスポートボタンを追加し、選択中のプロジェクトケースのデータで hook を呼び出す
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1_

- [x] 4. (P) 間接工数エクスポート機能を実装する
  - `useIndirectWorkLoadExcelExport` フックを作成し、indirectWorkCaseName・businessUnits（BU名/BUコード/loads）・yearMonths を受け取って ExportSheetConfig を構築する
  - BU ごとに 1 行、年月ごとに 1 列の複数行構成でエクスポートする（行ラベル = BU名）
  - businessUnits が空の場合はトースト通知でエクスポート不可を知らせる
  - isExporting ステートでローディング表示と二重クリック防止を行う
  - ResultPanel にエクスポートボタンを追加する（既存の計算結果エクスポートボタンとは別に配置）
  - 既存の useExcelExport（計算結果エクスポート）には変更を加えない
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.2_

- [x] 5. 案件工数インポート機能を実装する
  - `useProjectLoadExcelImport` フックを作成し、projectCaseId を受け取る
  - parseFile 関数: Excel ファイルを解析し、1行目のヘッダーから年月を抽出、2行目のデータ行から yearMonth + manhour のペアを構築する
  - A列のケース名は参照情報として無視し、B列以降の年月+値のみを使用する
  - yearMonth のフォーマット検証（YYYY-MM → YYYYMM 変換）、manhour の範囲検証、yearMonth の重複検証を行い、ValidationError を返す
  - confirmImport 関数: パース済みデータを `{ items: [{ yearMonth, manhour }] }` 形式に変換し、既存の useBulkUpsertProjectLoads mutation を呼び出す
  - 成功時にトースト通知を表示し、queryClient.invalidateQueries でキャッシュを更新する
  - API エラー時にトースト通知でエラー内容を表示する
  - CaseStudySection にインポートボタンと ExcelImportDialog を統合し、フックの parseFile / confirmImport を props として渡す
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 5.1, 7.1, 7.2, 7.3, 7.4_

- [x] 6. (P) 間接工数インポート機能を実装する
  - `useIndirectWorkLoadExcelImport` フックを作成し、indirectWorkCaseId と businessUnits（BU名/BUコード マッピング配列）を受け取る
  - parseFile 関数: Excel ファイルを解析し、複数データ行（BU ごと）から businessUnitCode + yearMonth + manhour の組み合わせを構築する
  - A列の BU 名からコンテキストの businessUnits を参照して businessUnitCode を解決し、一致しない BU 名はバリデーションエラーとする
  - yearMonth のフォーマット検証、manhour の範囲検証、businessUnitCode + yearMonth の重複検証を行う
  - confirmImport 関数: パース済みデータを `{ items: [{ businessUnitCode, yearMonth, manhour, source: "manual" }] }` 形式に変換し、既存の useBulkSaveMonthlyIndirectWorkLoads mutation を呼び出す
  - 成功時にトースト通知を表示し、queryClient.invalidateQueries でキャッシュを更新する
  - API エラー時にトースト通知でエラー内容を表示する
  - ResultPanel にインポートボタンと ExcelImportDialog を統合する
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 5.2, 7.1, 7.2, 7.3, 7.5_

- [x] 7. テスト・ラウンドトリップ検証
- [x] 7.1 excel-utils のユニットテストを作成する
  - buildExportWorkbook: ExportSheetConfig を渡してワークブック構造が正しいことを検証する
  - parseImportSheet: 正常データ・異常データ（不正フォーマット、範囲外値、非数値）のパース結果を検証する
  - validateManhour: 境界値テスト（0, 99999999, -1, 100000000, 小数, NaN）を行う
  - validateYearMonth: 正常値（202601）と異常値（2026-01, 20261, abcdef, 空文字）を検証する
  - YYYY-MM → YYYYMM 変換の正常系・異常系を検証する
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 7.2 ラウンドトリップ互換性テストを作成する
  - 案件工数: テストデータで buildExportWorkbook → parseImportSheet を実行し、元データと一致することを検証する
  - 間接工数: 複数 BU のテストデータで同様のラウンドトリップ検証を行う
  - エクスポート時のヘッダー（YYYY-MM）がインポート時に正しく YYYYMM に変換されることを検証する
  - 空セル・ゼロ値の取り扱いがラウンドトリップで保持されることを検証する
  - _Requirements: 5.1, 5.2, 5.3_

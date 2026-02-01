# Implementation Plan

- [x] 1. CaseFormSheet コンポーネントの新規作成
- [x] 1.1 (P) Sheet 内でケース作成フォームを表示し、案件情報から初期値を自動設定する
  - Sheet（スライドパネル）内に既存の CaseForm を配置し、作成モードと編集モードを切り替え可能にする
  - 作成モードでは、案件の開始年月・期間月数・総工数をフォームの初期値として設定する
  - 編集モードでは、対象ケースのデータを API から取得し、既存の値をフォームの初期値として使用する（案件情報での上書きは行わない）
  - 初期値はユーザーが自由に変更可能とする（あくまでデフォルト値）
  - フォーム送信時に作成 / 更新の mutation を実行し、成功時にトースト通知と Sheet クローズを行う
  - エラー時はステータスコード（409 重複、422 バリデーション、404 未発見）に応じたトースト通知を表示する
  - 既存の ProjectEditSheet のパターン（SheetContent side="right"、overflow-y-auto）を踏襲する
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3_

- [x] 2. CaseStudySection コンポーネントの新規作成
- [x] 2.1 ケーススタディの全操作を統合する自己完結セクションを作成する
  - ケース一覧サイドバー（CaseSidebar）、工数テーブル（WorkloadCard）、工数チャート（WorkloadChart）を配置する
  - ケース選択状態、チャートデータのリアルタイム反映状態、フォーム Sheet の開閉状態、削除対象ケースの状態を管理する
  - サイドバーの「新規作成」操作で CaseFormSheet を作成モードで開く
  - サイドバーの「編集」操作で CaseFormSheet を編集モードで開く
  - サイドバーの「削除」操作で確認ダイアログを表示し、確認後にケースを削除して一覧を更新する
  - 選択されたケースの月別工数をテーブル表示し、編集時にチャートをリアルタイム更新する
  - 工数データの保存と保存失敗時のエラートースト通知を処理する
  - サイドバー（w-64）とメインエリア（flex-1）の flex 構成でレイアウトする
  - 既存の case-study/index.tsx から状態管理ロジック・クエリ・コールバックを移植する
  - _Requirements: 1.1, 1.2, 1.3, 3.3, 3.4, 5.1, 5.2, 5.3, 5.4_

- [x] 3. 案件詳細画面への統合と既存ルートの整理
- [x] 3.1 案件詳細画面にケーススタディセクションを配置し、既存のケーススタディボタンを削除する
  - 案件基本情報カードの下部に CaseStudySection を配置する
  - 案件データ（projectId, project）を CaseStudySection に props で渡す
  - ヘッダーの「ケーススタディ」ボタン（FlaskConical アイコン + 別画面遷移リンク）を削除する
  - 案件の基本情報が画面上部に常時表示されることを確認する
  - ルートコンポーネントが 100 行前後に収まるようにする
  - _Requirements: 1.1, 1.4, 1.5_

- [x] 3.2 独立していたケーススタディルートファイルを削除し、ルートツリーを更新する
  - case-study/index.tsx、case-study/new.tsx、case-study/$caseId/edit.tsx を削除する
  - dev サーバーの再起動で routeTree.gen.ts を自動再生成する
  - TypeScript コンパイルがエラーなく完了することを確認する
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3.3 case-study feature のパブリック API エクスポートを更新する
  - CaseStudySection と CaseFormSheet を features/case-study/index.ts のエクスポートに追加する
  - _Requirements: 1.1_

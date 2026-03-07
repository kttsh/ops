# Requirements Document

## Introduction
現在の `/master/indirect-capacity-settings` 画面にはマスタCRUD・計算・結果管理が混在しており、シミュレーションワークフローが煩雑になっている。本機能では、計算ワークフローと結果管理を分離し、`/indirect/simulation` に間接作業シミュレーション専用画面を新規作成する。ユーザーはドロップダウンで既存のケース・シナリオを選択し、キャパシティ計算→間接作業計算→結果確認→保存/エクスポート/インポートの一連のフローを一気通貫で実行できる。

## Requirements

### Requirement 1: ルーティングとナビゲーション
**Objective:** As a ユーザー, I want SidebarNavから間接作業シミュレーション画面に遷移したい, so that 既存のナビゲーション体系から自然にアクセスできる

#### Acceptance Criteria
1. The シミュレーション画面 shall `/indirect/simulation` ルートで表示される
2. The SidebarNav shall 「間接作業管理」セクションにシミュレーション画面への遷移リンクを含む
3. When ユーザーがSidebarNavのシミュレーションリンクをクリックした時, the アプリケーション shall `/indirect/simulation` に遷移する

### Requirement 2: BU選択
**Objective:** As a ユーザー, I want 事業部（BU）を選択したい, so that 対象BUのデータに基づいてシミュレーションを実行できる

#### Acceptance Criteria
1. The シミュレーション画面 shall BU選択コンポーネントを表示する
2. When ユーザーがBUを選択した時, the シミュレーション画面 shall 選択されたBUに紐づくケース・シナリオデータを読み込む
3. When BUが未選択の状態の時, the シミュレーション画面 shall 計算に関連する操作を無効化する

### Requirement 3: 人員計画ケース・キャパシティシナリオ選択
**Objective:** As a ユーザー, I want 人員計画ケースとキャパシティシナリオをドロップダウンで選択したい, so that 計算の入力条件を簡単に指定できる

#### Acceptance Criteria
1. While BUが選択されている間, the シミュレーション画面 shall 人員計画ケースのドロップダウンに選択可能なケース一覧を表示する
2. While BUが選択されている間, the シミュレーション画面 shall キャパシティシナリオのドロップダウンに選択可能なシナリオ一覧を表示する
3. The シミュレーション画面 shall ケース・シナリオの作成・編集・削除機能を提供しない（読み取り専用選択のみ）

### Requirement 4: キャパシティ計算実行
**Objective:** As a ユーザー, I want 選択した人員計画ケースとキャパシティシナリオに基づいてキャパシティ計算を実行したい, so that 間接作業計算の前提となるキャパシティデータを取得できる

#### Acceptance Criteria
1. While 人員計画ケースとキャパシティシナリオが両方選択されている間, the シミュレーション画面 shall キャパシティ計算ボタンを有効化する
2. When ユーザーがキャパシティ計算ボタンをクリックした時, the シミュレーション画面 shall 選択されたケースとシナリオに基づいてキャパシティ計算を実行する
3. While キャパシティ計算が処理中の間, the シミュレーション画面 shall ローディング状態を表示する
4. If キャパシティ計算がエラーで失敗した場合, the シミュレーション画面 shall エラー内容をユーザーに通知する

### Requirement 5: 間接作業ケース選択と計算実行
**Objective:** As a ユーザー, I want 間接作業ケースを選択して間接作業計算を実行したい, so that 間接作業の工数シミュレーション結果を取得できる

#### Acceptance Criteria
1. While キャパシティ計算が完了している間, the シミュレーション画面 shall 間接作業ケースのドロップダウンに選択可能なケース一覧を表示する
2. While 間接作業ケースが選択されている間, the シミュレーション画面 shall 間接作業計算ボタンを有効化する
3. When ユーザーが間接作業計算ボタンをクリックした時, the シミュレーション画面 shall 選択された間接作業ケースとキャパシティ計算結果に基づいて間接作業計算を実行する
4. While 間接作業計算が処理中の間, the シミュレーション画面 shall ローディング状態を表示する
5. If 間接作業計算がエラーで失敗した場合, the シミュレーション画面 shall エラー内容をユーザーに通知する

### Requirement 6: 計算結果表示
**Objective:** As a ユーザー, I want 計算結果をテーブル形式で確認したい, so that シミュレーション結果を詳細に把握できる

#### Acceptance Criteria
1. When 間接作業計算が完了した時, the シミュレーション画面 shall 計算結果テーブルを表示する
2. The 計算結果テーブル shall 既存の `CalculationResultTable` コンポーネントと同等のデータ表示を行う
3. While 計算結果が存在しない間, the シミュレーション画面 shall 結果エリアに適切な空状態メッセージを表示する

### Requirement 7: 計算結果の保存
**Objective:** As a ユーザー, I want 計算結果をデータベースに保存したい, so that シミュレーション結果を後から参照できる

#### Acceptance Criteria
1. While 計算結果が表示されている間, the シミュレーション画面 shall 保存ボタンを有効化する
2. When ユーザーが保存ボタンをクリックした時, the シミュレーション画面 shall 計算結果をデータベースに保存する
3. When 保存が正常に完了した時, the シミュレーション画面 shall 成功通知を表示する
4. If 保存がエラーで失敗した場合, the シミュレーション画面 shall エラー内容をユーザーに通知する

### Requirement 8: Excelエクスポート
**Objective:** As a ユーザー, I want 計算結果と入力データをExcelファイルとしてエクスポートしたい, so that 外部ツールでの分析や報告に利用できる

#### Acceptance Criteria
1. While 計算結果が表示されている間, the シミュレーション画面 shall Excelエクスポートボタンを有効化する
2. When ユーザーがExcelエクスポートボタンをクリックした時, the シミュレーション画面 shall 計算結果をExcelファイルとしてダウンロードする
3. The エクスポート機能 shall 既存のエクスポートフック（`useExcelExport`, `useIndirectWorkLoadExcelExport`）と同等の出力を生成する

### Requirement 9: Excelインポート
**Objective:** As a ユーザー, I want Excelファイルから間接作業データをインポートしたい, so that 外部で編集したデータをシミュレーションに反映できる

#### Acceptance Criteria
1. The シミュレーション画面 shall Excelインポート機能を提供する
2. When ユーザーがExcelファイルをインポートした時, the シミュレーション画面 shall インポートダイアログを表示し、データの確認と取り込みを行う
3. When インポートが正常に完了した時, the シミュレーション画面 shall インポートされたデータを計算結果に反映する
4. If インポートファイルが不正な形式の場合, the シミュレーション画面 shall エラー内容をユーザーに通知する

# Implementation Plan

- [x] 1. ルーティング定義とページ状態管理
- [x] 1.1 ルートファイルとページ骨格の作成
  - `/indirect/monthly-loads` のルート定義を作成し、BU コードを URL search params で管理する Zod スキーマを設定する
  - lazy route にページレイアウトの骨格を作成する（BU セレクタ → ケースチップ → マトリクスの上下配置構成）
  - 既存の `/indirect/simulation` のルート定義パターン（search schema + lazy route 分離）を踏襲する
  - _Requirements: 1.1, 5.1, 5.2_

- [x] 1.2 ページ状態管理 hook の作成
  - BU コードに基づくケース一覧の取得（既存の `indirectWorkCasesQueryOptions` を利用）と選択状態の管理
  - 選択ケースに基づく月次間接工数データの取得（既存の `monthlyIndirectWorkLoadsQueryOptions` を利用）
  - API データからローカル編集状態（`localData`）と元ソースマップ（`originalSources`）を初期化する
  - 編集済みセルを追跡する `dirtyKeys` セットを管理し、`isDirty` を導出する
  - 保存処理: 変更セルのみ `source: "manual"` に設定し、既存の `useBulkSaveMonthlyIndirectWorkLoads` mutation で一括保存する
  - 保存成功時にトースト表示とキャッシュ無効化、失敗時にエラートーストとローカルデータ保持
  - BU 変更時・ケース変更時にローカル状態をリセットする
  - バリデーションエラーの集約（`hasValidationErrors`）と保存ボタンの活性制御に使用する状態を返却する
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.3_

- [x] 2. UI コンポーネント実装
- [x] 2.1 (P) ケースチップ選択コンポーネントの作成
  - BU に紐づく間接工数ケースをチップ（ボタン群）形式で表示する
  - 選択中のケースをハイライトし、1クリックで切り替え可能にする
  - BU セレクタ（`BusinessUnitSingleSelector`）と同じスタイルパターン（`border-primary bg-primary/10`）を踏襲する
  - ローディング中の表示を考慮する
  - _Requirements: 1.2_

- [x] 2.2 マトリクス表示・編集コンポーネントの作成
  - 月次間接工数を年度×月（行: 年度、列: 4月〜3月）のマトリクス形式で表示する
  - API データの `yearMonth`（YYYYMM）をマトリクス座標（年度 + 月インデックス）に変換するロジックを実装する
  - 各年度の合計列を読み取り専用で表示し、ローカルデータからリアルタイム計算する
  - `source` の視覚区別を実装する: calculated（通常背景）、manual（軽い強調色）、編集済み dirty（ハイライト色）
  - 各セルを数値入力 Input で編集可能にする（`normalizeNumericInput` で全角→半角変換）
  - 入力値を整数・0以上・最大99999999に制限し、不正値にはフィールドレベルのエラー表示を行う
  - _Requirements: 1.3, 1.4, 1.5, 2.1, 3.1, 3.2_

- [x] 2.3 マトリクスのキーボードナビゲーション実装
  - 各 Input に `data-row` / `data-col` 属性を付与し、グリッド座標を管理する
  - Tab キーで右隣のセルに移動する（最終列の場合は次行先頭へ。ブラウザ標準挙動で対応）
  - Enter キーで下のセル（同じ列の次の年度）にフォーカスを移す（`querySelector` でターゲット特定）
  - _Requirements: 5.4_

- [x] 3. 警告ダイアログとページ統合
- [x] 3.1 calculated 上書き警告と未保存警告の実装
  - `source: "calculated"` のセルを初回編集する際に AlertDialog で上書き確認を表示する（ケース単位で初回のみ。2回目以降はダイアログなし）
  - ケース切替時に確認済みフラグをリセットする
  - `useUnsavedChanges` hook を統合し、ルートナビゲーション時の未保存警告を有効にする
  - ケース切替時は `guardAction` でローカル state 変更を保護し、BU 切替は URL ナビゲーションのため `useBlocker` が自動捕捉する
  - 未保存警告ダイアログで「保存して進む」「破棄して進む」「キャンセル」の3択を提供する
  - _Requirements: 2.5, 2.6_

- [x] 3.2 ページレイアウト完成とナビゲーション統合
  - ページ全体のレイアウトを完成させる: BU セレクタ、ケースチップ、マトリクス、保存ボタンを配置する
  - データが存在しない場合の空状態メッセージを表示する
  - データ取得中のローディング表示（スケルトンまたはスピナー）を実装する
  - 保存ボタンの活性制御: `isDirty` かつ `hasValidationErrors` が false の場合のみ有効化する
  - サイドナビゲーションの「間接作業管理」セクションに「月次間接工数」メニュー項目を追加し、`/indirect/monthly-loads` へのリンクを設定する
  - feature の `index.ts` に新規コンポーネント・hook のエクスポートを追加する
  - _Requirements: 1.6, 4.1, 4.2, 5.1, 5.3_

- [x] 4. テスト
- [x]* 4.1 ページ状態管理 hook のユニットテスト
  - dirty 状態追跡: セル編集で `dirtyKeys` に追加、`isDirty` が true になることを検証する
  - 保存時の source 自動設定: 変更セルに `source: "manual"` が設定されることを検証する
  - BU/ケース変更時のリセット: `localData`, `dirtyKeys`, `hasAcknowledgedCalculatedWarning` がクリアされることを検証する
  - バリデーション: 範囲外の値で `hasValidationErrors` が true になることを検証する
  - _Requirements: 2.1, 2.2, 3.3_

- [x]* 4.2 マトリクスコンポーネントのテスト
  - yearMonth ↔ マトリクス座標変換の正確性を検証する
  - 年度合計の計算が正しいことを検証する
  - キーボードナビゲーション: Enter キーで下セルにフォーカスが移ることを検証する
  - _Requirements: 1.3, 1.5, 5.4_

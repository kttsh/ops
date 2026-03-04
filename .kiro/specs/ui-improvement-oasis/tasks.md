# Implementation Plan

- [x] 1. デザイントークン基盤の構築
- [x] 1.1 Noto Sans JP フォントの導入
  - `@fontsource/noto-sans-jp` パッケージをフロントエンドにインストールする
  - 400（Regular）と 700（Bold）ウェイトの CSS をインポートする
  - フォントスタックに `Noto Sans JP` をフォールバックとして追加し、日本語テキストが正しく表示されることを確認する
  - _Requirements: 2.1_

- [x] 1.2 Oasis Light カラーシステムへの移行
  - グローバルスタイルの全カラー変数を oklch 形式から Oasis Light の hex 形式に置き換える（背景 `#F8FAFC`、カード `#FFFFFF`、プライマリ Indigo `#6366F1` 等）
  - テキストカラーをヘッダー `#1E293B`、ボディ `#475569`、ラベル `#94A3B8` に設定する
  - セマンティックカラー（success、warning、destructive、info）を Oasis Light パレットに合わせて更新する
  - Oasis アクセントカラー（Indigo、Emerald、Sky、Purple）をカスタム CSS 変数として追加定義する
  - サイドバー用の背景色 `#FFFFFF` とボーダー色 `#F1F5F9` を設定する
  - フォーカスリングのカラーを Indigo に変更する
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. UI プリミティブコンポーネント更新
- [x] 2.1 (P) ボタンコンポーネントの Oasis Light スタイル適用
  - 角丸を 8px（`rounded-lg`）に変更する
  - 静止時のシャドウを除去し、ホバー時のみシャドウを適用する
  - トランジションを `transition-all duration-200 ease-in-out` に統一する
  - カラーバリアント（default、secondary、ghost）はデザイントークン変更により自動的に Indigo ベースに切り替わることを確認する
  - _Requirements: 3.3, 6.1, 6.2, 6.3, 6.6, 10.1_

- [x] 2.2 (P) フォーム入力・セレクト要素の Oasis Light スタイル適用
  - 入力要素とセレクトトリガーの角丸を 16px（`rounded-2xl`）に変更する
  - セレクトのドロップダウンコンテンツの角丸も 16px に統一する
  - 背景色がデザイントークン変更により `#F8FAFC`（Surface Sub）に切り替わることを確認する
  - フォーカス時のリングカラーが Indigo に切り替わることを確認する
  - トランジションを `transition-all duration-200 ease-in-out` に統一する
  - _Requirements: 3.2, 6.4, 6.5, 10.1_

- [x] 2.3 (P) バッジコンポーネントのティントスタイル適用
  - フォントウェイトを `font-semibold` から `font-medium` に変更する
  - default バリアントをティントスタイル（アクセントカラーの 10% 透過背景 + アクセントカラーテキスト）に変更する
  - success バリアントを Emerald アクセントカラーの 10% 透過スタイルに統一する
  - `rounded-full` を維持し、12px フォントサイズを確認する
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 2.4 (P) テーブルコンポーネントの Oasis Light スタイル適用
  - テーブルヘッダーに背景色 `#F8FAFC`、`uppercase`、`tracking-wider` を適用する
  - 行ホバー時の背景色をデザイントークンの accent カラーに切り替わることを確認する
  - ボーダー色がデザイントークン変更により `#F1F5F9` 相当に統一されることを確認する
  - セルパディングが 12px 16px 相当であることを確認する
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2.5 (P) ダイアログ・シートの Oasis Light スタイル適用
  - オーバーレイを半透明背景 + `backdrop-blur` に変更する（`bg-black/80` → `bg-black/40 backdrop-blur-sm`）
  - float shadow（`0 25px 50px -12px rgb(0 0 0 / 0.1)`）を適用する
  - ダイアログの角丸を 24px（`rounded-3xl`）に変更する
  - トランジションが `0.2s ease-in-out` で統一されていることを確認する
  - _Requirements: 3.1, 10.1, 10.2, 10.3_

- [x] 3. サイドバーレイアウト更新
  - サイドバーの展開時幅を 288px から 240px に変更する
  - サイドバーのボーダーカラーをデザイントークンのサイドバーボーダー変数に切り替える
  - サイドバーの幅変更時に `0.2s ease-in-out` のトランジションアニメーションを適用する
  - 折りたたみ時 64px が維持されていることを確認する
  - アクティブなナビゲーション項目がデザイントークン変更により Indigo ハイライトに自動切り替えされることを確認する
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4. マスタ一覧ページの Bento Grid + カード化
- [x] 4.1 (P) ビジネスユニット・案件一覧ページの Grid + カード化
  - ビジネスユニット一覧と案件一覧の各ページで、既存の Flex レイアウト（`space-y-6`）を CSS Grid レイアウト（`grid grid-cols-1 gap-6`）に変更する
  - PageHeader はカード外のグリッド 1 行目として配置する
  - DataTableToolbar と DataTable を 1 つのカード（`rounded-3xl bg-card border p-6`）で囲む
  - カードにホバー時のみソフトシャドウとトランジションを適用する
  - _Requirements: 3.4, 3.5, 3.6, 4.1, 4.3_

- [x] 4.2 (P) 案件タイプ・作業種類一覧ページの Grid + カード化
  - 案件タイプ一覧と作業種類一覧の各ページに、4.1 と同様の Grid + カード化パターンを適用する
  - レイアウト構造は 4.1 と同一（`grid grid-cols-1 gap-6`、Toolbar+Table のカード化）
  - _Requirements: 3.4, 3.5, 3.6, 4.1, 4.3_

- [x] 5. (P) マスタ詳細・フォームページのカードスタイル統一
  - 全マスタ詳細ページ（BU、案件、案件タイプ、作業種類の各 detail ページ）のカード角丸を `rounded-2xl` → `rounded-3xl` に変更する
  - 全マスタ新規作成・編集ページ（各 new.tsx、edit.tsx）のカード角丸も同様に変更する
  - 静止時の `shadow-sm` を除去し、ホバー時のみソフトシャドウを適用する
  - 案件詳細の CaseStudySection のカードスタイルも同様に更新する
  - レイアウトを `space-y-6` → `grid grid-cols-1 gap-6` に統一する
  - _Requirements: 3.1, 3.4, 3.5, 3.6, 4.1, 4.3_

- [x] 6. Workload ダッシュボードの Bento Grid レイアウト化
- [x] 6.1 ダッシュボードの Grid レイアウト + カード化
  - メインコンテンツ領域を Flex レイアウトから CSS Grid（`grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6`）に変更する
  - ヘッダーバー（BU セレクタ含む）は Grid 外で固定表示する
  - チャートとレジェンドパネルを左カラムの 1 つのカードに統合する
  - サイドパネルを右カラムのカードとして配置する
  - テーブルを `col-span-full` のカードとして配置する
  - モバイル・タブレットでは `grid-cols-1` の縦積みレイアウトにレスポンシブ対応する
  - 全カードに `rounded-3xl` とホバーシャドウを適用する
  - _Requirements: 3.1, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3_

- [x] 6.2 Workload チャートにグラデーション塗りを適用
  - チャート内に SVG `<defs>` セクションを追加し、各 Area シリーズに対応する `<linearGradient>` を動的に生成する
  - 各 Area の塗りつぶしを solid color からグラデーション参照（`url(#gradient-id)`）に変更する
  - グラデーションは上部 opacity 0.3、下部 opacity 0.05 の垂直グラデーションとする
  - グラデーション定義を `useMemo` でメモ化し、不要な再レンダリングを防止する
  - _Requirements: 8.1_

- [x] 6.3 Workload チャートのグリッド・ツールチップスタイル更新
  - CartesianGrid のストロークカラーを `#F1F5F9` に変更する
  - カスタムツールチップに `backdrop-blur` と `rounded-xl` を適用する
  - チャートコンテナが Oasis Light のカードスタイル内に正しく配置されていることを確認する
  - _Requirements: 8.2, 8.3, 8.4_

- [x] 7. (P) 間接作業・キャパシティ設定画面の Grid + カード化
  - 既存の Grid レイアウトの `gap-4` を `gap-6`（24px）に統一する
  - 左パネル（Settings）と右パネル（Result）をそれぞれカード（`rounded-3xl bg-card border p-6`）で囲む
  - カードにホバー時のみソフトシャドウとトランジションを適用する
  - 既存の `grid-cols-[60fr_40fr]` 比率を維持する
  - _Requirements: 3.1, 3.4, 3.5, 3.6, 4.1, 4.3_

- [x] 8. (P) Case Study チャートの Oasis Light スタイル適用
  - 既存グラデーションの上部 opacity を 0.6 → 0.3 に調整する
  - チャートコンテナのカードスタイルを Oasis Light に合わせて更新する（`rounded-3xl`）
  - CartesianGrid のストロークカラーを `#F1F5F9` に統一する
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 9. 最終リント・ビルド検証
  - フロントエンドのリントを実行し、コード品質を確認する
  - フロントエンドのビルドを実行し、ビルドエラーがないことを確認する
  - 全画面遷移が正常に動作することを確認する
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 10.1, 10.2, 10.3_

# Requirements Document

## Introduction

Oasis Light Design System（improve-ui スキル）に基づき、既存フロントエンド UI のスタイルを包括的に改善する。「Soft-Bento, High-Clarity, Tech-Minimalist」の美的原則に従い、操業管理システムにふさわしいプロフェッショナルなビジネスデスクトップ UI を実現する。

現在の shadcn/ui + Tailwind CSS v4 ベースの UI を維持しつつ、Oasis Light のデザイントークン（カラー、タイポグラフィ、スペーシング、シャドウ、角丸）をグローバルスタイルとコンポーネント単位で適用する。

## Requirements

### Requirement 1: デザイントークン・カラーシステムの更新

**Objective:** As a 開発者, I want グローバルスタイル（globals.css）の CSS 変数を Oasis Light のカラーシステムに置き換えたい, so that アプリケーション全体が統一されたカラーパレットで表示される

#### Acceptance Criteria
1. The フロントエンドアプリ shall ページ背景色として `#F8FAFC`（off-white）を使用する
2. The フロントエンドアプリ shall カード表面色として `#FFFFFF` を使用する
3. The フロントエンドアプリ shall アクセントカラーとして Indigo（`#6366F1`）、Emerald（`#10B981`）、Sky（`#38BDF8`）、Purple（`#A78BFA`）を CSS 変数として定義する
4. The フロントエンドアプリ shall プライマリアクセントカラーとして Indigo（`#6366F1`）を使用する
5. The フロントエンドアプリ shall テキストカラーとして `#1E293B`（ヘッダー）、`#475569`（ボディ）、`#94A3B8`（ラベル・サブテキスト）を使用する
6. The フロントエンドアプリ shall セマンティックカラー（success、warning、destructive、info）を Oasis Light パレットに合わせて再定義する

### Requirement 2: タイポグラフィシステムの更新

**Objective:** As a ユーザー, I want データ値が大きく太字で表示され、ラベルが小さく控えめに表示されてほしい, so that 情報の優先度が視覚的に明確になる

#### Acceptance Criteria
1. The フロントエンドアプリ shall フォントファミリーとして `Inter` に加え `Noto Sans JP` をフォールバックに設定する
2. The フロントエンドアプリ shall KPI・メトリクス等のデータ値を 28–32px、`font-bold` で表示する
3. The フロントエンドアプリ shall ラベル・キャプションテキストを 12px で表示する
4. The フロントエンドアプリ shall セクションヘッダーを 18–20px、`font-semibold` で表示する

### Requirement 3: カード・角丸・シャドウシステムの更新

**Objective:** As a ユーザー, I want すべてのコンテンツがソフトな角丸カードで囲まれ、ホバー時にのみ控えめなシャドウが表示される UI を使いたい, so that 視覚的な階層が明確になり、操作対象が直感的に分かる

#### Acceptance Criteria
1. The フロントエンドアプリ shall カードコンポーネントに `border-radius: 24px`（`rounded-3xl`）を適用する
2. The フロントエンドアプリ shall カード内部の入れ子要素（インプット、セレクト等）に `border-radius: 16px`（`rounded-2xl`）を適用する
3. The フロントエンドアプリ shall ボタンに `border-radius: 8px`（`rounded-lg`）を適用する
4. The フロントエンドアプリ shall カードに静止時のシャドウを適用せず、ホバー時のみ `0 20px 25px -5px rgb(0 0 0 / 0.05)` のソフトシャドウを表示する
5. When カードがホバーされた時, the フロントエンドアプリ shall `transition: all 0.2s ease-in-out` でシャドウをアニメーション表示する
6. The フロントエンドアプリ shall すべてのコンテンツ領域をカードコンポーネントで囲んで表示する

### Requirement 4: レイアウト・Bento Grid の適用

**Objective:** As a ユーザー, I want ダッシュボードやマスタ画面が Bento Grid レイアウトで整然と並んでほしい, so that 情報の一覧性が高まり効率的に把握できる

#### Acceptance Criteria
1. The フロントエンドアプリ shall ダッシュボード画面で Bento Grid レイアウト（`display: grid`、`gap: 24px`）を使用する
2. The フロントエンドアプリ shall グリッドカラムをレスポンシブに設定する（モバイル 1 列、タブレット 2 列、デスクトップ 3–4 列）
3. The フロントエンドアプリ shall カード間のギャップを統一的に 24px（`gap-6`）で設定する

### Requirement 5: ナビゲーション・サイドバーの更新

**Objective:** As a ユーザー, I want サイドバーが Oasis Light のスタイルに従い、折りたたみ時 64px、展開時 240px で表示されてほしい, so that ナビゲーションが洗練され、コンテンツ領域を最大限活用できる

#### Acceptance Criteria
1. The フロントエンドアプリ shall サイドバーの折りたたみ時幅を 64px に設定する
2. The フロントエンドアプリ shall サイドバーの展開時幅を 240px に設定する
3. The フロントエンドアプリ shall サイドバーの背景色を `#FFFFFF` に設定し、右ボーダーに `#F1F5F9` を使用する
4. The フロントエンドアプリ shall アクティブなナビゲーション項目に Indigo アクセントカラーのハイライトを適用する
5. When サイドバーの展開/折りたたみが切り替えられた時, the フロントエンドアプリ shall `0.2s ease-in-out` のトランジションでアニメーションする

### Requirement 6: ボタン・フォーム要素の更新

**Objective:** As a ユーザー, I want ボタンやフォーム要素が Oasis Light のスタイルで統一されてほしい, so that 操作性が向上し、視覚的な一貫性が保たれる

#### Acceptance Criteria
1. The フロントエンドアプリ shall Primary ボタンに Indigo（`#6366F1`）背景色と白テキストを適用する
2. The フロントエンドアプリ shall Secondary ボタンに `#F1F5F9` 背景色と `#475569` テキストを適用する
3. The フロントエンドアプリ shall Ghost ボタンに透明背景とホバー時 `#F8FAFC` 背景を適用する
4. The フロントエンドアプリ shall フォーム入力要素の背景色に `#F8FAFC`（Surface Sub）を適用する
5. The フロントエンドアプリ shall フォーム入力要素のフォーカス時ボーダーに Indigo アクセントカラーを適用する
6. When ボタンがホバーされた時, the フロントエンドアプリ shall `hover:scale-[1.02]` と `transition: all 0.2s ease-in-out` でインタラクションフィードバックを提供する

### Requirement 7: データテーブルの更新

**Objective:** As a ユーザー, I want データテーブルが Oasis Light のクリーンなスタイルで表示されてほしい, so that 大量のデータを効率的に閲覧できる

#### Acceptance Criteria
1. The フロントエンドアプリ shall テーブルヘッダーに `#F8FAFC` 背景色、12px `font-medium`、`text-transform: uppercase`、`letter-spacing: 0.05em` を適用する
2. The フロントエンドアプリ shall テーブル行の区切り線として `#F1F5F9` のボーダーを使用する
3. When テーブル行がホバーされた時, the フロントエンドアプリ shall `#F8FAFC` の背景色をトランジション付きで表示する
4. The フロントエンドアプリ shall テーブルセルのパディングを `12px 16px` に設定する

### Requirement 8: チャート・データ可視化の更新

**Objective:** As a ユーザー, I want 積み上げチャートやグラフが Oasis Light のグラデーション表現で表示されてほしい, so that データの視覚的訴求力が高まる

#### Acceptance Criteria
1. The フロントエンドアプリ shall チャートエリアの塗りつぶしにグラデーション（上: `opacity: 0.3`、下: `opacity: 0.05`）を適用する
2. The フロントエンドアプリ shall チャートコンテナをカードコンポーネント（`rounded-3xl`）内に配置する
3. The フロントエンドアプリ shall チャートのグリッドラインに `#F1F5F9` カラーを使用する
4. The フロントエンドアプリ shall チャートツールチップに `backdrop-filter: blur(8px)` と `border-radius: 12px` を適用する

### Requirement 9: バッジ・ステータスインジケーターの更新

**Objective:** As a ユーザー, I want ステータスバッジが Oasis Light のティントスタイルで表示されてほしい, so that ステータスが直感的に識別できる

#### Acceptance Criteria
1. The フロントエンドアプリ shall バッジに `border-radius: 9999px`（`rounded-full`）を維持する
2. The フロントエンドアプリ shall バッジの背景色にアクセントカラーの 10% 透過色を使用し、テキストにアクセントカラーを使用する
3. The フロントエンドアプリ shall バッジのフォントサイズを 12px、`font-medium` に設定する

### Requirement 10: トランジション・アニメーションの統一

**Objective:** As a 開発者, I want すべてのインタラクティブ要素のトランジションが統一されてほしい, so that UI 全体の動きが一貫してスムーズになる

#### Acceptance Criteria
1. The フロントエンドアプリ shall すべてのインタラクティブ要素に `transition: all 0.2s ease-in-out` を標準トランジションとして適用する
2. The フロントエンドアプリ shall ダイアログ・モーダルのオーバーレイに `backdrop-filter: blur(4px)` を適用する
3. The フロントエンドアプリ shall ダイアログ・シートに `box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.1)` の float shadow を適用する


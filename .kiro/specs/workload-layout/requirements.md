# Requirements Document

## Introduction
Workload画面のチャート・テーブル表示におけるレイアウト・スクロールの問題を修正する。viewモード（chart / table / both）に応じてレイアウトを動的に切り替え、各モードで最適な表示領域とスクロール挙動を実現する。

対象: GitHub Issue #35

## Requirements

### Requirement 1: チャート+テーブル両表示時のスクロール

**Objective:** ユーザーとして、チャートとテーブルを同時に表示した際にコンテンツ全体を閲覧できるようにしたい。画面に収まらない場合でもテーブル全体を確認できるようにするため。

#### Acceptance Criteria
1. While viewモードが `both` の状態で、When コンテンツの合計高さが画面の表示領域を超えた場合、the Workload画面 shall 縦方向のスクロールを有効にしてコンテンツ全体を閲覧可能にする
2. While viewモードが `both` の状態で、the Workload画面 shall チャートとテーブルの両方を完全に表示する

### Requirement 2: チャート単独表示時のレイアウト

**Objective:** ユーザーとして、チャートのみ表示時にチャートがカード内いっぱいに広がって表示されるようにしたい。余白なく表示領域を最大限活用するため。

#### Acceptance Criteria
1. While viewモードが `chart` の状態で、the Workload画面 shall チャートをカード内の利用可能な高さいっぱいに拡張して表示する
2. While viewモードが `chart` の状態で、the Workload画面 shall チャートの下に不要な余白を表示しない
3. While viewモードが `chart` の状態で、the Workload画面 shall 縦方向のスクロールを無効にする（コンテンツが画面内に収まるため）

### Requirement 3: テーブル単独表示時のレイアウト

**Objective:** ユーザーとして、テーブルのみ表示時にテーブルが画面内に適切に収まるようにしたい。不要なスクロールなく効率的にデータを閲覧するため。

#### Acceptance Criteria
1. While viewモードが `table` の状態で、the Workload画面 shall テーブルを利用可能な表示領域内に収めて表示する
2. While viewモードが `table` の状態で、the Workload画面 shall 縦方向のスクロールを無効にする（コンテンツが画面内に収まるため）

### Requirement 4: チャートと凡例パネルの高さ整合

**Objective:** ユーザーとして、チャートと凡例パネルの高さが揃った状態で表示されるようにしたい。視覚的な一貫性を保ち、情報を効率的に比較参照するため。

#### Acceptance Criteria
1. The Workload画面 shall チャートの高さと凡例パネルの高さを揃えて表示する
2. The Workload画面 shall チャートと凡例パネルの間に不整合な余白を表示しない

### Requirement 5: 既存機能の非退行

**Objective:** ユーザーとして、レイアウト改善後も凡例操作やビュー切替などの既存機能が正常に動作することを保証したい。

#### Acceptance Criteria
1. When 凡例項目をホバーした場合、the Workload画面 shall 従来通りホバーハイライト機能を正常に動作させる
2. When 凡例項目をピン操作した場合、the Workload画面 shall 従来通りピン機能を正常に動作させる
3. When viewモードを切り替えた場合、the Workload画面 shall 遷移先のモードに応じたレイアウトを即座に適用する
4. The Workload画面 shall TypeScriptの型エラーを含まない

# Requirements Document

## Introduction
Workload画面のコントロールパネルにおけるUX改善。タブ名の明確化、二重スクロールの解消、および色選択UIのPopoverベースへの刷新を行い、チャート設定操作の直感性と視認性を向上させる。

## Requirements

### Requirement 1: タブラベルの明確化
**Objective:** ユーザーとして、コントロールパネルのタブ名から機能の目的がすぐに分かるようにしたい。それにより、タブの役割を直感的に理解できる。

#### Acceptance Criteria
1. The コントロールパネル shall タブラベルとして「チャート設定」を表示する
2. When タブ「チャート設定」をクリックした時, the コントロールパネル shall チャート設定パネルの内容を表示する

### Requirement 2: 二重スクロールの解消
**Objective:** ユーザーとして、コントロールパネル内で二重スクロールが発生しない状態にしたい。それにより、案件一覧をストレスなくスクロールできる。

#### Acceptance Criteria
1. The 案件設定エリア shall 独自の内部スクロールバーを持たない
2. While 案件数がパネルの表示領域を超えている時, the コントロールパネル shall パネル全体の単一スクロールで全案件を閲覧可能にする
3. The コントロールパネル shall 案件設定エリア内にネストされたスクロールコンテナを含まない

### Requirement 3: Popoverベース色選択UI（案件色）
**Objective:** ユーザーとして、案件ごとのチャート色を少ないクリックで選択でき、現在の選択色がひと目で分かるようにしたい。それにより、色設定の操作効率と視認性が向上する。

#### Acceptance Criteria
1. The 案件色選択UI shall 現在選択されている色のみを丸型スウォッチとして表示する
2. When 色スウォッチをクリックした時, the 案件色選択UI shall Popoverで利用可能な全色の選択肢を表示する
3. When Popover内の色を選択した時, the 案件色選択UI shall 選択された色でスウォッチを更新し、Popoverを閉じる
4. When 案件色が変更された時, the Workloadチャート shall チャートの該当エリアと凡例に変更後の色を即座に反映する
5. The 案件色選択UI shall PROJECT_TYPE_COLORSパレットの全色を選択肢として提供する

### Requirement 4: Popoverベース色選択UI（容量シナリオ色）
**Objective:** ユーザーとして、容量シナリオの色選択が案件色と同じ操作体験で統一されていてほしい。それにより、UIの一貫性によって学習コストが下がる。

#### Acceptance Criteria
1. The 容量シナリオ色選択UI shall 案件色選択と同一のPopoverベースUIコンポーネントを使用する
2. When 色スウォッチをクリックした時, the 容量シナリオ色選択UI shall Popoverで利用可能な全色の選択肢を表示する
3. When Popover内の色を選択した時, the 容量シナリオ色選択UI shall 選択された色でスウォッチを更新し、Popoverを閉じる
4. When 容量シナリオ色が変更された時, the Workloadチャート shall チャートのキャパシティラインと凡例に変更後の色を即座に反映する
5. The 容量シナリオ色選択UI shall CAPACITY_COLORSパレットの全色を選択肢として提供する

### Requirement 5: 色選択UIの共通仕様
**Objective:** ユーザーとして、色選択Popoverが使いやすく、意図しない操作が起きないようにしたい。それにより、快適に色設定を行える。

#### Acceptance Criteria
1. When Popover外の領域をクリックした時, the 色選択Popover shall 色を変更せずにPopoverを閉じる
2. While Popoverが表示されている時, the 色選択UI shall 現在選択中の色を視覚的に区別して表示する
3. The 色選択コンポーネント shall TypeScriptの型エラーなくコンパイルできる

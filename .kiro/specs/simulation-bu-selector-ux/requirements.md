# Requirements Document

## Introduction

間接作業シミュレーション画面（`/indirect/simulation`）のビジネスユニット（BU）選択UIを改善する。現状はヘッダー右端の小さなドロップダウンに配置されており、山積ダッシュボード（`/workload`）のチップ型BU選択UIと一貫性がない。ユーザーがBU選択に気づきにくく、操作しづらいという課題を解決するため、ヘッダー直下に専用の独立行としてチップ型シングルセレクトUIを配置する。

**関連Issue**: GitHub Issue #52

## Requirements

### Requirement 1: BU選択UIの配置変更

**Objective:** 事業部リーダーとして、間接作業シミュレーション画面でBU選択が直感的に見つかるようにしたい。他画面との操作体験の一貫性を確保するため。

#### Acceptance Criteria

1. The シミュレーション画面 shall ヘッダー直下にBU選択専用の独立行を表示する（山積ダッシュボードと同じ配置パターン）
2. The シミュレーション画面 shall ヘッダー右端のドロップダウン型BU選択を削除する
3. The BU選択行 shall `border-b border-border px-4 py-3` のレイアウトスタイルを適用し、山積ダッシュボードのBU選択行と視覚的に統一する

### Requirement 2: チップ型シングルセレクトUI

**Objective:** 事業部リーダーとして、全BUの一覧を一目で確認し、選択状態を視覚的に把握したい。素早くBUを切り替えられるようにするため。

#### Acceptance Criteria

1. The BU選択コンポーネント shall 全BUをチップ（ピル型ボタン）として横並びに表示する
2. When ユーザーがBUチップをクリックした時, the BU選択コンポーネント shall そのBUを選択状態にし、他のBUの選択を解除する（シングルセレクト動作）
3. The BU選択コンポーネント shall 選択中のBUチップを視覚的に区別する（`border-primary bg-primary/10 text-primary` 等のアクティブスタイル）
4. The BU選択コンポーネント shall 未選択のBUチップに `hover:bg-accent hover:text-accent-foreground` のホバースタイルを適用する
5. The BU選択コンポーネント shall ラベル「ビジネスユニット」とアイコン（`Building2`）を表示する

### Requirement 3: URL Search Params との同期

**Objective:** 事業部リーダーとして、選択したBUの状態がURLに反映されるようにしたい。ブックマークやリンク共有でBU選択状態を維持するため。

#### Acceptance Criteria

1. When ユーザーがBUチップをクリックした時, the シミュレーション画面 shall URL search params の `bu` パラメータを選択されたBUコードに更新する
2. When URL search params に有効な `bu` パラメータが含まれている時, the シミュレーション画面 shall 該当するBUを選択状態で表示する
3. When URL search params に `bu` パラメータがない、または無効な値の時, the シミュレーション画面 shall 先頭のBUを自動的に選択する

### Requirement 4: BU切替時の状態リセット

**Objective:** 事業部リーダーとして、BUを切り替えた際に前のBUのケース選択や計算結果が残らないようにしたい。誤ったデータの混在を防ぐため。

#### Acceptance Criteria

1. When ユーザーがBUを切り替えた時, the シミュレーション画面 shall 人員計画ケース・キャパシティシナリオ・間接作業ケースの選択状態をリセットする
2. When ユーザーがBUを切り替えた時, the シミュレーション画面 shall キャパシティ計算結果と間接作業計算結果をクリアする
3. When ユーザーがBUを切り替えた時, the シミュレーション画面 shall 新しいBUに対応するケース一覧を再取得する

### Requirement 5: UIの一貫性

**Objective:** ユーザーとして、アプリケーション全体でBU選択の操作が統一されていることを期待する。学習コストを最小化するため。

#### Acceptance Criteria

1. The BU選択コンポーネント shall 山積ダッシュボードの `BusinessUnitSelector` と同じ視覚パターン（チップ型、同色のスタイル、同じアイコン・ラベル配置）に従う
2. The BU選択コンポーネント shall シングルセレクトのため「全選択」ボタンは含めない（山積ダッシュボードのマルチセレクトとの機能差異）

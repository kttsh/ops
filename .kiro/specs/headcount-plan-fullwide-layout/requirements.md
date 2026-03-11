# Requirements Document

## Introduction
人員計画ケース画面（`/master/headcount-plans`）のレイアウトを2カラムからフルワイド1カラムに刷新する。ケース選択をチップボタン方式に変更し、月次人員数を全年度一覧テーブルで表示することで、画面の利用効率と複数年比較の利便性を向上させる。

GitHub Issue: #69

## Requirements

### Requirement 1: フルワイド1カラムレイアウト
**Objective:** As a 事業部リーダー, I want 人員計画ケース画面をフルワイドの1カラムレイアウトで利用したい, so that 画面全幅を月次データの表示・編集に活用でき、情報密度が向上する

#### Acceptance Criteria
1. The 人員計画ケース画面 shall 左パネル（ケースリストカード）を廃止し、全幅1カラムレイアウトで表示する
2. The 人員計画ケース画面 shall BUセレクター、ケースセレクター、月次データテーブルを縦に積み重ねたレイアウトで構成する
3. The 人員計画ケース画面 shall レスポンシブ対応し、画面幅に応じて適切に表示する

### Requirement 2: チップボタン方式のケースセレクター
**Objective:** As a 事業部リーダー, I want ケースをチップボタンで選択したい, so that 少数のケース（5〜10件）を効率的に選択・切り替えでき、画面占有率が最適化される

#### Acceptance Criteria
1. The ケースセレクター shall BUセレクター（`BusinessUnitSingleSelector`）と同じチップボタン方式で、選択可能なケースを横一列に表示する
2. When ケースのチップボタンがクリックされた時, the ケースセレクター shall 該当ケースを選択状態にし、月次データテーブルの表示を切り替える
3. While ケースが選択されている間, the ケースセレクター shall 選択中のチップを視覚的に強調表示する（`bg-primary/10 border-primary`）
4. The ケースセレクター shall Primaryケースに★バッジを表示する
5. Where 削除済みケースの表示が有効な場合, the ケースセレクター shall 削除済みケースを `opacity-50` で表示し、復元操作を可能にする
6. The ケースセレクター shall 「削除済みを含む」スイッチを提供する
7. The ケースセレクター shall 新規ケース作成ボタン（`[+新規]`、`variant="outline"`, dashed border）を表示する
8. When 新規ケース作成ボタンがクリックされた時, the ケースセレクター shall 既存の `CaseFormSheet` を呼び出してケース作成フォームを表示する

### Requirement 3: 全年度月次データテーブル
**Objective:** As a 事業部リーダー, I want 全年度（約11年分）の月次人員数を一覧テーブルで確認・編集したい, so that 年度を切り替えることなく、複数年の人員計画を俯瞰・比較できる

#### Acceptance Criteria
1. The 月次データテーブル shall 年度ドロップダウンを廃止し、全年度（前2年〜後8年、計11行）× 12ヶ月のテーブルを一覧表示する
2. The 月次データテーブル shall 年度列（最左列）を sticky left で固定表示する
3. While 当年度の行が表示されている間, the 月次データテーブル shall 当年度行を `bg-primary/5` でハイライト表示する
4. The 月次データテーブル shall 各セルにIME対応の数値入力を提供する（既存の `normalizeNumericInput` を再利用）
5. While セルの値が変更されて未保存の間, the 月次データテーブル shall 変更セルを `bg-amber-50` でdirtyハイライト表示する
6. The 月次データテーブル shall 13列（年度ヘッダー + 12ヶ月）のテーブルヘッダーに「4月〜3月」の月名を表示する

### Requirement 4: ケースCRUD操作
**Objective:** As a 事業部リーダー, I want 新しいレイアウトでもケースの作成・編集・削除・復元が正常に動作してほしい, so that レイアウト変更後も業務を中断なく継続できる

#### Acceptance Criteria
1. When ケース編集ボタンがクリックされた時, the 人員計画ケース画面 shall 既存の `CaseFormSheet` を呼び出してケース編集フォームを表示する
2. When ケースが削除された時, the ケースセレクター shall 削除済みケースの表示状態に応じてチップを非表示または `opacity-50` で表示する
3. When 削除済みケースの復元操作が実行された時, the ケースセレクター shall ケースを通常状態のチップとして復元表示する
4. When ケースが新規作成された時, the ケースセレクター shall 新しいケースをチップとして追加し、自動的に選択状態にする

### Requirement 5: 一括入力の年度選択対応
**Objective:** As a 事業部リーダー, I want 一括入力時に対象年度を選択したい, so that 特定の年度に対して効率的に人員数を一括設定できる

#### Acceptance Criteria
1. The 一括入力ダイアログ shall 対象年度の選択機能を提供する
2. When 一括入力が実行された時, the 一括入力ダイアログ shall 選択された年度の月次データのみに値を適用する
3. The 一括入力ダイアログ shall 既存の一括入力機能（値の入力・適用）を維持する

### Requirement 6: 未保存変更の検知
**Objective:** As a 事業部リーダー, I want 未保存の変更がある場合に警告を受けたい, so that 編集内容を意図せず失うことを防げる

#### Acceptance Criteria
1. While 未保存の変更がある間, the 人員計画ケース画面 shall ページ離脱時に `UnsavedChangesDialog` を表示する
2. While 未保存の変更がある間, the 人員計画ケース画面 shall 保存ボタンを有効状態にする
3. When 保存ボタンがクリックされた時, the 人員計画ケース画面 shall 全年度分の変更データを一括保存する

### Requirement 7: 保存機能
**Objective:** As a 事業部リーダー, I want 全年度分の月次人員数を一括で保存したい, so that 複数年にまたがる変更を一度の操作で確定できる

#### Acceptance Criteria
1. When 保存ボタンがクリックされた時, the 人員計画ケース画面 shall 変更のあった全年度分の月次人員数データをAPIに送信して保存する
2. When 保存が成功した時, the 人員計画ケース画面 shall 成功トーストを表示し、dirtyハイライトをクリアする
3. If 保存が失敗した場合, the 人員計画ケース画面 shall エラートーストを表示し、変更データを保持する

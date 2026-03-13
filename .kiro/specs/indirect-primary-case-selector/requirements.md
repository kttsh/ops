# Requirements Document

## Introduction

Issue #70（間接工数管理画面の統合・簡素化）の計算条件パネルにおけるケース選択UXを拡張する。現在のシミュレーション画面では、3つのエンティティ（人員計画ケース・キャパシティシナリオ・間接作業ケース）を毎回手動で選択する必要がある。本機能では、各エンティティの `isPrimary` フラグを活用してデフォルト選択を自動化しつつ、ユーザーが任意のケースに変更できる柔軟性を確保する。また、primaryケースが未設定の場合はユーザーに手動選択を促す。

### 対象エンティティ

| エンティティ | スコープ | primaryフラグ |
|---|---|---|
| 人員計画ケース（headcount_plan_cases） | BU単位 | `isPrimary: boolean` |
| キャパシティシナリオ（capacity_scenarios） | グローバル | `isPrimary: boolean` |
| 間接作業ケース（indirect_work_cases） | BU単位 | `isPrimary: boolean` |

## Requirements

### Requirement 1: primaryケースのデフォルト自動選択

**Objective:** As a 事業部リーダー, I want 間接工数画面を開いた時にprimaryケースが自動的に選択されている状態にしたい, so that 毎回3つのケースを手動で選び直す手間を省ける

#### Acceptance Criteria

1. When ユーザーが間接工数画面でBUを選択した時, the 計算条件パネル shall 各エンティティのprimaryケース（`isPrimary === true`）を自動的にデフォルト値として選択する
2. When BUスコープのエンティティ（人員計画ケース・間接作業ケース）を読み込む時, the 計算条件パネル shall 選択中のBUに属するprimaryケースのみをデフォルト選択の候補とする
3. When グローバルスコープのエンティティ（キャパシティシナリオ）を読み込む時, the 計算条件パネル shall BUに関係なくprimaryシナリオをデフォルト選択する
4. When ユーザーがBUを切り替えた時, the 計算条件パネル shall 新しいBUのprimaryケースで選択状態をリセットする

### Requirement 2: ケースの手動変更

**Objective:** As a 事業部リーダー, I want primaryケース以外のケースにも切り替えられるようにしたい, so that 楽観・悲観などのシナリオ比較ができる

#### Acceptance Criteria

1. The 計算条件パネル shall 各エンティティに対してケースを切り替えるUIコントロール（セレクタ）を提供する
2. When ユーザーがセレクタでケースを変更した時, the 計算条件パネル shall 選択されたケースを即座に計算条件に反映する
3. The セレクタ shall 選択中のBUに属する全てのケース（BUスコープの場合）またはグローバルの全ケース（キャパシティシナリオの場合）を選択肢として表示する
4. While ケースがprimaryから変更されている状態で, the 計算条件パネル shall 現在の選択がデフォルト（primary）ではないことを視覚的に示す
5. The セレクタ shall primaryケースを他のケースと区別して表示する（例：ラベルやバッジ）

### Requirement 3: primary未設定時の手動選択

**Objective:** As a ユーザー, I want primaryケースが設定されていない場合に自分でケースを選択したい, so that primary未設定でも計算を実行できる

#### Acceptance Criteria

1. If あるエンティティにprimaryケースが存在しない場合, the 計算条件パネル shall そのエンティティの選択状態を「未選択」として表示する
2. If primaryケースが未設定の場合, the 計算条件パネル shall ユーザーにケースの選択を促す視覚的な表示（警告色やメッセージ）を行う
3. When primaryが未設定のエンティティでユーザーがケースを手動選択した時, the 計算条件パネル shall その選択を計算条件として受け入れる
4. While いずれかのエンティティが未選択の状態で, the 再計算ボタン shall 無効化される

### Requirement 4: マスタ画面への遷移リンク

**Objective:** As a 事業部リーダー, I want 計算条件パネルから各マスタ管理画面に直接遷移したい, so that ケースの追加やprimary設定の変更を素早く行える

#### Acceptance Criteria

1. The 計算条件パネル shall 各エンティティのラベルにマスタ管理画面への遷移リンク（アイコン）を配置する
2. When ユーザーが遷移リンクをクリックした時, the システム shall 対応するマスタ管理画面に遷移する
3. The 遷移リンク shall 人員計画ケース・キャパシティシナリオ・間接作業ケースの各マスタ画面に対応する

### Requirement 5: 選択状態の整合性

**Objective:** As a ユーザー, I want ケース選択が常に有効なデータを参照していることを保証したい, so that 無効なケースで計算が実行されることを防げる

#### Acceptance Criteria

1. When データの読み込みが完了した時, the 計算条件パネル shall 選択可能なケースが存在するかを検証する
2. If 選択中のケースがデータから削除されていた場合, the 計算条件パネル shall 選択状態をprimaryケース（存在する場合）または未選択にリセットする
3. While 全てのエンティティでケースが選択されている状態でのみ, the 再計算ボタン shall 有効化される

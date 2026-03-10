# Requirements Document

## Introduction

GitHub Issue #65 に基づき、保存済みの間接工数（`monthly_indirect_work_loads`）を閲覧・手動編集できる新規画面を作成する。現状は `/indirect/simulation` で計算を再実行しないと結果を確認できないため、専用画面で保存済みデータの閲覧・編集を可能にする。

既存 API（GET / PUT / PUT bulk）は対応可能であり、フロントエンド新規画面の実装が主スコープとなる。

## Requirements

### Requirement 1: 間接工数一覧表示

**Objective:** As a 事業部リーダー, I want 保存済みの間接工数を一覧画面で確認したい, so that シミュレーションを再実行せずに現在の工数データを把握できる

#### Acceptance Criteria

1. When ユーザーが `/indirect/monthly-loads` に遷移した時, the 間接工数画面 shall 事業部（BU）セレクタを表示し、URL パラメータと連動させる
2. When ユーザーが BU を選択した時, the 間接工数画面 shall 選択された BU に紐づく間接工数ケースをチップ（ボタン群）形式で表示し、1クリックで切り替え可能にする（BU セレクタと統一的なUIパターン）
3. When ユーザーがケースを選択した時, the 間接工数画面 shall 当該ケースの月次間接工数データをマトリクス形式（行: 年度、列: 4月〜3月の12ヶ月）で表示し、一度に5年度分を表示する
4. The 間接工数画面 shall マトリクスの各セルに `source` の視覚的区別（`calculated`: 通常表示、`manual`: バッジ等で識別）を表示する
5. The 間接工数画面 shall マトリクスに各年度の合計列を表示する
6. While データが存在しない時, the 間接工数画面 shall 空状態メッセージを表示する

### Requirement 2: 間接工数の手動編集

**Objective:** As a 事業部リーダー, I want 月次の間接工数値を手動で編集・保存したい, so that 計算結果を実態に合わせて調整できる

#### Acceptance Criteria

1. When ユーザーが工数値（`manhour`）を編集した時, the 間接工数画面 shall 編集されたセルを視覚的にハイライトし、未保存の変更があることを示す
2. When ユーザーが編集した値を保存した時, the 間接工数画面 shall 変更された行の `source` を `'manual'` に自動設定して API に送信する
3. When 保存が成功した時, the 間接工数画面 shall 成功トーストを表示し、テーブルデータを最新状態にリフレッシュする
4. If 保存が失敗した時, the 間接工数画面 shall エラートーストを表示し、編集中のデータを保持する
5. When ユーザーが `source: 'calculated'` のセルを編集しようとした時, the 間接工数画面 shall 計算結果を上書きする旨の確認ダイアログを表示する
6. If ユーザーが未保存の変更がある状態でケースまたは BU を切り替えようとした時, the 間接工数画面 shall 未保存警告ダイアログを表示し、破棄または保存の選択を求める

### Requirement 3: データ入力バリデーション

**Objective:** As a システム, I want 入力値の妥当性を検証したい, so that 不正なデータがDBに保存されることを防止できる

#### Acceptance Criteria

1. The 間接工数画面 shall `manhour` フィールドを数値入力（整数、0以上、最大99999999）に制限する
2. If ユーザーが不正な値を入力した時, the 間接工数画面 shall フィールドレベルのバリデーションエラーメッセージを表示する
3. While バリデーションエラーが存在する時, the 間接工数画面 shall 保存ボタンを無効化する

### Requirement 4: ナビゲーション統合

**Objective:** As a ユーザー, I want サイドナビゲーションから間接工数画面にアクセスしたい, so that 画面間の移動がスムーズにできる

#### Acceptance Criteria

1. The アプリケーション shall サイドナビゲーションの間接セクションに「月次間接工数」メニュー項目を追加する
2. When ユーザーが「月次間接工数」メニューをクリックした時, the アプリケーション shall `/indirect/monthly-loads` に遷移する

### Requirement 5: 画面レイアウトと操作性

**Objective:** As a ユーザー, I want 既存画面と一貫性のある操作体験を得たい, so that 学習コストなく新画面を利用できる

#### Acceptance Criteria

1. The 間接工数画面 shall 上下配置レイアウト（上: BU セレクタ → ケースチップ、下: マトリクステーブル）を採用する
2. The 間接工数画面 shall 画面上部に BU セレクタを配置し、URL の search params で状態を永続化する
3. The 間接工数画面 shall ローディング中はスケルトンまたはスピナーを表示する
4. The 間接工数画面 shall マトリクスセル間の Tab キーによる横移動と Enter キーによる下移動をサポートし、連続入力を効率化する

## Open Questions

- **Q9-2**: 編集形式は個別月の値を直接インライン編集する形式とする（一括入力フォームではなく）。確定要。
- **Q9-3**: `source: 'calculated'` のデータは確認ダイアログ付きで上書き可能とする（Requirement 2-5 で対応）。確定要。
- **Q9-4**: 計算結果との差分可視化機能は本スコープ外とし、将来拡張として検討する。確定要。

## Out of Scope

- 間接工数の新規行追加・削除（既存 API は対応可能だが、本 Issue のスコープ外）
- 計算結果と手動編集値の差分表示・比較機能
- Excel エクスポート機能（既存の `/indirect/simulation` に実装済み）
- 手動編集値を計算値に戻す機能


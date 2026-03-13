# Implementation Plan

- [x] 1. (P) useIndirectSimulation フックにprimary自動選択ロジックとderived stateを追加
  - ケース一覧データの取得完了時に、各エンティティの `isPrimary === true` のケースを検索し、選択状態が `null` の場合のみ自動設定するuseEffectを追加する
  - BUスコープのエンティティ（人員計画ケース・間接作業ケース）は選択中のBUに属するprimaryのみを対象とする
  - グローバルスコープのエンティティ（キャパシティシナリオ）はBUに関係なくprimaryを選択する
  - BU変更時は既存のリセットロジック（選択状態を `null` にリセット）を維持し、新データ取得後にuseEffectでprimary自動選択が再実行される流れにする
  - 複数primaryが存在する場合は配列先頭を採用する
  - 各エンティティのprimary有無を示すderived state（`hasPrimaryHeadcountCase`, `hasPrimaryCapacityScenario`, `hasPrimaryIndirectWorkCase`）を追加する
  - 現在の選択がprimaryかどうかを示すderived state（`isHeadcountCasePrimary`, `isCapacityScenarioPrimary`, `isIndirectWorkCasePrimary`）を追加する
  - 選択中のケースIDが現在のケース一覧に存在しない場合、primaryまたは `null` にフォールバックする整合性チェックを追加する
  - 3つのケースすべてが選択済みの場合に `true` となる `canRecalculate` を追加する
  - 各選択をprimaryケースにリセットする `resetToDefaults` 関数を追加する
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.3, 3.4, 5.1, 5.2, 5.3_
  - _Contracts: UseIndirectSimulationExtension State_

- [x] 2. (P) CaseSelectSection コンポーネントの作成
  - 既存の `SelectSection` を置き換えるローカルコンポーネントとして、primaryバッジ・マスタ遷移リンク・primary未設定警告を統合したケース選択UIを作成する
  - ラベル行の右端にマスタ管理画面への遷移リンク（アイコン + テキスト）を配置する
  - Select内のprimaryケースの選択肢に `★` バッジを付与して他のケースと区別する
  - `hasPrimary === false` かつ `value === null` の場合、セレクタ下部に警告メッセージ（amber色）を表示してユーザーにケース選択を促す
  - ケース変更時は `onValueChange` コールバック経由で即座に親コンポーネントに反映する
  - 全てのケースを選択肢として表示する（BUスコープまたはグローバルスコープに応じたフィルタリングは親側で実施済み）
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 4.1, 4.2, 4.3_
  - _Contracts: CaseSelectSectionProps_

- [x] 3. シミュレーション画面への統合
  - 既存の `SelectSection` 呼び出しを `CaseSelectSection` に置き換え、各ケース一覧データにisPrimaryフラグを含めた新しいprops形式で渡す
  - フックから返される新しいderived state（`hasPrimaryXxx`）を各CaseSelectSectionの `hasPrimary` propに接続する
  - 人員計画ケース → `/master/headcount-plans`、キャパシティシナリオ → `/master/capacity-scenarios`、間接作業ケース → `/master/indirect-work-cases` の遷移リンクをmasterPath propで設定する
  - 既存の2段階計算ボタンの有効/無効状態を、フックの新しいderived stateと連携させる
  - 既存の `SelectSection` コンポーネント定義を `CaseSelectSection` で置き換え、不要になった旧定義を削除する
  - _Requirements: 1.1, 2.1, 2.2, 3.3, 4.3, 5.3_

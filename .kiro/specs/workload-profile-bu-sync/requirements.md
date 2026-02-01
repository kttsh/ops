# Requirements Document

## Introduction

workload画面のプロファイル（chart_views）保存・適用時に、Business Unit（BU）選択状態を連動させる機能を追加する。現状、プロファイルには期間（startYearMonth/endYearMonth）やプロジェクトアイテムは保存されるが、BU選択状態が含まれていないため、プロファイル適用後にユーザーが毎回BUを手動で選び直す必要がある。本機能により、プロファイル1つの操作で以前の表示状態を完全に再現できるようにする。

**参照**: GitHub Issue #26

## Requirements

### Requirement 1: プロファイル保存時のBU選択状態の永続化

**Objective:** 操業管理者として、workloadプロファイル保存時に現在のBU選択状態も一緒に保存したい。それにより、プロファイル適用だけで以前の表示状態を完全に復元できるようにしたい。

#### Acceptance Criteria

1. When ユーザーがworkloadプロファイルを新規保存する, the ProfileManager shall 現在選択中のBUコード一覧をプロファイルデータに含めて保存する
2. When ユーザーがworkloadプロファイルを上書き保存する, the ProfileManager shall 現在選択中のBUコード一覧でプロファイルのBU選択状態を更新する
3. When BUが1つも選択されていない状態でプロファイルを保存する, the ProfileManager shall businessUnitCodesを空配列として保存する

### Requirement 2: プロファイル適用時のBU選択状態の復元

**Objective:** 操業管理者として、保存済みプロファイルを適用した際にBU選択状態が自動的に復元されるようにしたい。それにより、毎回手動でBUを選び直す手間を省きたい。

#### Acceptance Criteria

1. When ユーザーがBUコードを含むプロファイルを適用する, the WorkloadPage shall 保存されたBUコード一覧でBusinessUnitSelectorの選択状態を復元する
2. When ユーザーがBUコードを含むプロファイルを適用する, the WorkloadPage shall BU選択状態をURL Search Params（`bu`パラメータ）にも反映する
3. When プロファイル適用によりBU選択状態が変更される, the WorkloadPage shall 変更後のBUに基づいてチャートデータを再取得する

### Requirement 3: 後方互換性

**Objective:** 操業管理者として、既存のプロファイル（BU情報が保存されていないもの）が正常に動作し続けることを保証したい。それにより、既存データの破壊を防ぎたい。

#### Acceptance Criteria

1. When ユーザーがbusinessUnitCodesがnullの既存プロファイルを適用する, the WorkloadPage shall 現在のBU選択状態を変更せずに維持する
2. The chart_views API shall businessUnitCodesフィールドをオプショナル（nullable）として扱う
3. While 既存プロファイルにbusinessUnitCodesが存在しない, the ProfileManager shall 保存・上書き保存時に現在のBU選択状態を新たに追加保存する

### Requirement 4: データストレージの拡張

**Objective:** システムとして、BU選択状態を永続化するためのデータストレージを用意する。それにより、プロファイルのCRUD全体でBUコードを扱えるようにしたい。

#### Acceptance Criteria

1. The chart_views テーブル shall business_unit_codesカラム（NVARCHAR(MAX)、NULL許容）を持つ
2. The バックエンドAPI shall businessUnitCodesをJSON文字列配列として受け取り、DB保存時にJSON文字列にシリアライズする
3. The バックエンドAPI shall DB取得時にJSON文字列をTypeScript文字列配列にデシリアライズして返却する
4. When businessUnitCodesを含むリクエストが送信される, the バックエンドAPI shall 各要素が文字列であることをZodスキーマでバリデーションする

### Requirement 5: 型安全性の維持

**Objective:** 開発者として、フロントエンド・バックエンド双方でbusinessUnitCodesフィールドが型安全に扱われることを保証したい。それにより、実行時エラーを防ぎたい。

#### Acceptance Criteria

1. The バックエンド型定義 shall ChartViewRow・ChartView・CreateChartViewInput・UpdateChartViewInputにbusinessUnitCodesフィールドを含む
2. The フロントエンド型定義 shall ChartView・CreateChartViewInput・UpdateChartViewInputにbusinessUnitCodesフィールドを含む
3. The Zodバリデーションスキーマ shall businessUnitCodesをz.array(z.string()).optional()として定義する

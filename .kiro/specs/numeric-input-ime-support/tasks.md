# Implementation Plan

- [x] 1. normalizeNumericInput ユーティリティ関数の作成
- [x] 1.1 全角→半角変換と不正文字除去の実装
  - 全角数字（０〜９）を半角数字（0〜9）に変換する
  - 小数モード時のみ全角ピリオド（．）を半角ピリオド（.）に変換する
  - 整数モード時は半角数字以外をすべて除去する
  - 小数モード時は半角数字と半角ピリオド以外をすべて除去する
  - 空文字列入力に対して空文字列を返す
  - 半角数字の直接入力をそのまま通過させる
  - _Requirements: 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 4.1, 4.2, 5.3_

- [x] 1.2 ユニットテストの作成
  - 半角数字がそのまま通過するケース
  - 全角数字が半角に正しく変換されるケース
  - 全角・半角混在文字列の変換ケース
  - 整数モードで小数点が除去されるケース
  - 小数モードで半角ピリオドが保持されるケース
  - 小数モードで全角ピリオドが半角に変換されるケース
  - 空文字列に対して空文字列を返すケース
  - アルファベット・記号が除去されるケース
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 4.1, 4.2, 5.3_

- [x] 2. (P) FormTextField の小数入力対応修正
  - type プロパティに "decimal" オプションを追加し、整数と小数の入力モードを区別可能にする
  - 既存のインライン変換ロジックを normalizeNumericInput ユーティリティの呼び出しに置き換える
  - 整数モード時は inputMode="numeric"、小数モード時は inputMode="decimal" を設定する
  - 小数モード時に小数点を含む値が正しく Number 型に変換されることを確認する
  - ProjectForm の総工数フィールドを "decimal" タイプに変更し、小数入力バグを修正する
  - FormTextField 経由のパターン一貫性を確保する
  - _Requirements: 1.1, 1.2, 1.3, 2.3, 4.3_

- [x] 3. 直接 Input 使用箇所への IME 対応適用
- [x] 3.1 (P) projects・workload 機能の整数フィールド適用
  - ProjectForm の期間月数フィールドで type を text に変更し、inputMode="numeric" を追加し、onChange で normalizeNumericInput を適用する
  - PeriodSelector の月数フィールドで同様の変更を行い、useState 管理の文字列保持パターンを維持する
  - null 許容フィールドでは空文字→null 変換の既存ロジックを維持する
  - 各フィールドの既存バリデーション（必須チェック・整数チェック等）が変更後も正常に動作することを確認する
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 5.1, 5.2_

- [x] 3.2 (P) case-study 機能のフィールド適用
  - CaseForm の期間月数フィールド（整数）で type を text に変更し、inputMode="numeric" を追加し、onChange で normalizeNumericInput を適用する
  - CaseForm の総工数フィールド（小数）で type を text に変更し、inputMode="decimal" を追加し、onChange で normalizeNumericInput を allowDecimal オプション付きで適用する
  - WorkloadCard の月別工数フィールド（整数）で同様の変更を行い、onBlur の範囲検証ロジックをそのまま維持する
  - null 許容フィールドでは空文字→null 変換の既存ロジックを維持する
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2_

- [x] 3.3 (P) indirect-case-study 機能のフィールド適用
  - ScenarioFormSheet の1人当たり月間労働時間フィールド（小数）で type を text に変更し、inputMode="decimal" を追加し、onChange で normalizeNumericInput を allowDecimal オプション付きで適用する
  - BulkInputDialog の人員数フィールド（整数）で同様の変更を行い、parseInt + 非負制限の既存ロジックを維持する
  - IndirectWorkRatioMatrix の間接作業比率フィールド（小数）で同様の変更を行い、parseFloat + 0-100 範囲制限の既存ロジックを維持する
  - MonthlyHeadcountGrid の月次人員数フィールド（整数）で同様の変更を行い、parseInt + 非負制限の既存ロジックを維持する
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2_

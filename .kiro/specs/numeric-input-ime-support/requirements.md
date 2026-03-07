# Requirements Document

## Introduction

数値入力フィールドにおいて、日本語IME（全角入力モード）が有効な状態で数値を入力できない問題を解決する。現在 `type="number"` を直接使用している9箇所を `type="text"` + `inputMode="numeric"` パターンに統一変更し、全角→半角の自動変換を適用する。既に `FormTextField` で確立済みのパターンを、未対応の8ファイル・9箇所（整数フィールド7箇所、小数対応フィールド2箇所）に展開する。

## Requirements

### Requirement 1: 数値入力フィールドのIME互換性

**Objective:** As a ユーザー, I want 日本語IMEが有効な全角モードでも数値入力フィールドに値を入力できること, so that IMEの状態を意識せずにスムーズにデータ入力できる

#### Acceptance Criteria

1. The 数値入力フィールド shall `type="text"` と `inputMode="numeric"` の組み合わせを使用し、`type="number"` を直接使用しない
2. When ユーザーが数値入力フィールドにフォーカスした時, the 入力フィールド shall モバイルデバイスでテンキーパッドを表示する
3. When 日本語IMEが全角モードで有効な時, the 数値入力フィールド shall ユーザーの入力を受け付ける

### Requirement 2: 全角→半角自動変換の統一適用

**Objective:** As a ユーザー, I want 全角数字で入力しても自動的に半角数字に変換されること, so that 入力ミスを気にせず効率的にデータを入力できる

#### Acceptance Criteria

1. When ユーザーが全角数字（０〜９）を入力した時, the 数値入力フィールド shall 対応する半角数字（0〜9）に自動変換する
2. When ユーザーが全角ピリオド（．）を小数対応フィールドに入力した時, the 数値入力フィールド shall 半角ピリオド（.）に自動変換する
3. The 全角→半角変換処理 shall `FormTextField` で確立済みの変換パターンと同一のロジックを使用する

### Requirement 3: 整数フィールドの入力制御

**Objective:** As a ユーザー, I want 整数フィールドに整数値のみを入力できること, so that 不正な値の入力を防止できる

#### Acceptance Criteria

1. The 整数フィールド（対象7箇所） shall 半角数字（0〜9）のみを有効な入力として受け付ける
2. When ユーザーが整数フィールドに小数点を入力した時, the 入力フィールド shall 小数点の入力を許可しない
3. When ユーザーが整数フィールドに数字以外の文字を入力した時, the 入力フィールド shall 数字以外の文字を除去する

### Requirement 4: 小数対応フィールドの入力制御

**Objective:** As a ユーザー, I want 小数対応フィールドに小数値を入力できること, so that 精度の必要な数値データを正確に入力できる

#### Acceptance Criteria

1. The 小数対応フィールド（対象2箇所） shall 半角数字（0〜9）と半角ピリオド（.）を有効な入力として受け付ける
2. When ユーザーが小数対応フィールドに数字とピリオド以外の文字を入力した時, the 入力フィールド shall 不正な文字を除去する
3. The 小数対応フィールド shall 既存のバリデーションルール（最大桁数・小数点以下桁数）を維持する

### Requirement 5: 既存動作の後方互換性

**Objective:** As a 開発者, I want 数値入力方式の変更後も既存の機能が正常に動作すること, so that リグレッションなく改善を適用できる

#### Acceptance Criteria

1. The 変更対象の9箇所 shall 変更前と同一の数値データをフォーム送信時に出力する
2. The 変更対象フィールド shall 既存のフォームバリデーション（必須チェック・範囲チェック等）を引き続き正常に動作させる
3. When ユーザーが半角数字を直接入力した時, the 数値入力フィールド shall 変更前と同様に正常に値を受け付ける


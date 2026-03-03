# Implementation Plan

- [x] 1. 共通型定義と Zod スキーマヘルパーの作成
- [x] 1.1 (P) 共通基底型インターフェースの定義
  - `SoftDeletableEntity` インターフェースを作成し、`createdAt`, `updatedAt`, `deletedAt` の共通タイムスタンプフィールドを定義する
  - `MasterEntity` インターフェースを作成し、`SoftDeletableEntity` を拡張して `name`, `displayOrder` フィールドを追加する
  - `@/lib/types/base-entity` パスからインポート可能にする
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 1.2 (P) 共通 Zod スキーマヘルパーの作成
  - `codeSchema` を作成: 英数字・ハイフン・アンダースコア、1〜20文字制約、日本語エラーメッセージ
  - `nameSchema` を作成: 1〜100文字制約、日本語エラーメッセージ
  - `displayOrderSchema` を作成: 0以上の整数制約、日本語エラーメッセージ
  - `colorCodeSchema` を作成: `#RRGGBB` 形式の正規表現、nullable/optional 対応
  - `@/lib/schemas/master-entity-schema` パスからインポート可能にする
  - 各スキーマのバリデーションルールが既存の feature 固有スキーマと完全一致することを確認する
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 2. フォーム共通コンポーネントの作成
- [x] 2.1 (P) FieldWrapper レイアウトコンポーネントの作成
  - `label`, `htmlFor`, `required`, `errors`, `labelSuffix`, `children`, `className` を props として受け取るレイアウトコンポーネントを作成する
  - `div.space-y-2` 内に Label、children、エラーメッセージを配置する統一構造を実装する
  - `required` が true の場合、Label の横に必須マーク (`*`) を `text-destructive` で表示する
  - `errors` 配列が存在する場合、`getErrorMessage()` でエラーメッセージを抽出し `text-destructive` スタイルで表示する
  - `errors` が空配列または undefined の場合、エラーメッセージ要素自体をレンダリングしない
  - `labelSuffix` でカラープレビュー等のカスタムコンテンツを Label 横に表示可能にする
  - 既存フォームの `div.space-y-2 > Label > Input > ErrorMessage` 構造と視覚的に同一の出力を生成する
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

- [x] 2.2 FormTextField ショートカットコンポーネントの作成
  - TanStack Form の `field` オブジェクトを受け取り、FieldWrapper + shadcn/ui Input を組み合わせたショートカットコンポーネントを作成する
  - `field.state.value` を Input の value に、`field.handleChange` を onChange に、`field.handleBlur` を onBlur に自動接続する
  - `type="number"` の場合は `Number(e.target.value)` で数値変換して `field.handleChange` に渡す
  - `disabled` prop で Input の無効状態を制御する
  - `inputProps` で `min`, `max`, `step`, `maxLength` 等の追加 Input 属性を受け渡し可能にする
  - `field.state.meta.errors` を FieldWrapper の errors prop に自動的に渡す
  - _Requirements: 1.1, 1.3, 1.5, 1.6_
  - _Contracts: FormTextFieldProps_

- [x] 3. (P) QuerySelect コンポーネントの作成
  - `queryResult` (isLoading, isError, data, refetch) を受け取り、3つの UI 状態を自動切替するコンポーネントを作成する
  - ローディング状態: `Loader2` スピナーアイコンと「読み込み中...」テキストを表示する
  - エラー状態: エラーメッセージと「再試行」ボタンを表示し、ボタンクリックで `refetch()` を実行する
  - 成功状態: shadcn/ui の `Select` + `SelectTrigger` + `SelectContent` + `SelectItem` で選択肢を表示する
  - `value`, `onValueChange`, `placeholder`, `id`, `disabled` props で外部から制御可能にする
  - `allowEmpty` prop で「未選択」オプションを先頭に追加する機能を実装する（sentinel 値 `"__none__"` → 空文字変換）
  - `emptyLabel` prop で「未選択」時のラベルをカスタマイズ可能にする
  - TanStack Form に依存しない独立コンポーネントとして設計し、`field.handleChange` は呼び出し側で `onValueChange` に接続する
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - _Contracts: QuerySelectProps_

- [x] 4. マスターフォームへの共通インフラ適用
- [x] 4.1 WorkTypeForm のリファクタリング
  - `WorkType` 型を基底型 `MasterEntity` を extends する形に変更し、固有フィールド (`workTypeCode`, `color`) のみを追加定義する
  - create/update Zod スキーマで `codeSchema`, `nameSchema`, `displayOrderSchema`, `colorCodeSchema` を import して使用する形に変更する
  - フォーム内の各テキスト入力フィールドを FormTextField コンポーネントに置換する
  - カラーピッカーフィールドは FieldWrapper + カスタム children で実装する（FormTextField は不使用）
  - リファクタリング後のフォームが視覚的・機能的に既存と同一であることを確認する
  - _Requirements: 3.4, 4.6, 5.1, 5.5_

- [x] 4.2 (P) BusinessUnitForm のリファクタリング
  - `BusinessUnit` 型を基底型 `MasterEntity` を extends する形に変更し、固有フィールド (`businessUnitCode`) のみを追加定義する
  - create/update Zod スキーマで共通スキーマヘルパーを import して使用する
  - フォーム内の各テキスト入力フィールドを FormTextField コンポーネントに置換する
  - リファクタリング後のフォームが視覚的・機能的に既存と同一であることを確認する
  - _Requirements: 3.4, 4.6, 5.2, 5.5_

- [x] 4.3 (P) ProjectTypeForm のリファクタリング
  - `ProjectType` 型を基底型 `MasterEntity` を extends する形に変更し、固有フィールド (`projectTypeCode`) のみを追加定義する
  - create/update Zod スキーマで共通スキーマヘルパーを import して使用する
  - フォーム内の各テキスト入力フィールドを FormTextField コンポーネントに置換する
  - リファクタリング後のフォームが視覚的・機能的に既存と同一であることを確認する
  - _Requirements: 3.4, 4.6, 5.3, 5.5_

- [x] 5. ProjectForm への QuerySelect 適用
  - `Project` 型を `SoftDeletableEntity` を extends する形に変更し、固有フィールドのみを追加定義する
  - ProjectForm の事業部 Select フィールドを QuerySelect コンポーネントに置換する（必須フィールド、`allowEmpty` なし）
  - ProjectForm のプロジェクトタイプ Select フィールドを QuerySelect コンポーネントに置換する（任意フィールド、`allowEmpty` + `emptyLabel` 使用）
  - テキスト入力フィールドも FormTextField に置換する
  - リファクタリング後のフォームが3状態（ローディング/エラー/成功）を正しくハンドリングすることを確認する
  - _Requirements: 3.4, 3.5, 5.4, 5.6_

- [x] 6. ビルド検証と全体整合性確認
  - フロントエンド全体のビルドが成功することを確認する（型エラーなし）
  - 基底型への移行で既存の型の外部インターフェースが変更されていないことを検証する
  - 共通スキーマヘルパーのバリデーションルールが既存ルールと一致することを検証する
  - _Requirements: 3.5, 4.6, 5.6_


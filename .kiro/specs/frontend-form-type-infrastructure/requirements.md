# Requirements Document

## Introduction

リファクタリング計画書 Phase 2-3 (フォームインフラ) および Phase 2-4 (共通型定義) に基づき、フロントエンドのフォーム共通コンポーネントと共通型・スキーマ基盤を整備する。

現状、フォームフィールド (Label + Input + Error) の構造が全フォームコンポーネントで繰り返されており、Select のローディング/エラー状態ハンドリングも ProjectForm.tsx 内で重複している。また、`WorkType`, `BusinessUnit`, `ProjectType` 等のエンティティ型は共通の `createdAt/updatedAt/deletedAt` フィールドを持つが、共通の基底型がない。Zod バリデーションスキーマも `code`, `name`, `displayOrder` で同一ルールが繰り返されている。

本仕様では、これらの重複を解消する共通インフラを構築し、各 feature のフォーム・型定義を簡素化する。

## Requirements

### Requirement 1: FormField ラッパーコンポーネント

**Objective:** As a フロントエンド開発者, I want フォームフィールドの Label + Input + Error 表示を統一された共通コンポーネントで記述したい, so that フォーム実装時のボイラープレートが削減され、一貫した UI が保証される

#### Acceptance Criteria

1. The FormField コンポーネント shall TanStack Form の `form.Field` をラップし、`label`, `name`, `validators`, `placeholder` 等の props を受け取って Label + Input + Error メッセージの統一構造をレンダリングする
2. When `mode` が `"create"` の場合, the FormField コンポーネント shall Label の横に必須マーク (`*`) を表示する
3. When フィールドにバリデーションエラーが存在する場合, the FormField コンポーネント shall `getErrorMessage()` を使用してエラーメッセージを `text-destructive` スタイルで表示する
4. The FormField コンポーネント shall `Input` 以外のカスタムレンダリングにも対応するため、`children` または `render` prop によるカスタムコンテンツ描画をサポートする
5. When FormField に `disabled` prop が渡された場合, the FormField コンポーネント shall 内部の Input を無効状態で表示する
6. The FormField コンポーネント shall 既存のフォームコンポーネント (`WorkTypeForm`, `BusinessUnitForm`, `ProjectTypeForm`) で使用されている `div.space-y-2 > Label > Input > ErrorMessage` 構造と視覚的に同一の出力を生成する

### Requirement 2: QuerySelect コンポーネント

**Objective:** As a フロントエンド開発者, I want 非同期データ取得を伴う Select フィールドのローディング/エラー/成功 3状態を統一コンポーネントで処理したい, so that Select フィールドの状態管理コードの重複が排除される

#### Acceptance Criteria

1. The QuerySelect コンポーネント shall TanStack Query の結果オブジェクト (`isLoading`, `isError`, `data`, `refetch`) を受け取り、3つの状態 (ローディング/エラー/成功) に応じた UI を自動的に切り替える
2. While データ取得中の場合, the QuerySelect コンポーネント shall `Loader2` スピナーアイコンと「読み込み中...」テキストを表示する
3. If データ取得がエラーになった場合, the QuerySelect コンポーネント shall エラーメッセージと「再試行」ボタンを表示し、ボタンクリックで `refetch()` を実行する
4. When データ取得が成功した場合, the QuerySelect コンポーネント shall shadcn/ui の `Select` + `SelectTrigger` + `SelectContent` + `SelectItem` を使用して選択肢を表示する
5. The QuerySelect コンポーネント shall `placeholder`, `value`, `onValueChange` props を受け取り、TanStack Form の `field.handleChange` と連携可能である
6. The QuerySelect コンポーネント shall 選択肢データのキー/ラベルフィールド名をカスタマイズ可能な props (`valueField`, `labelField`) を提供する

### Requirement 3: 共通基底型インターフェース

**Objective:** As a フロントエンド開発者, I want エンティティの共通フィールド (`createdAt`, `updatedAt`, `deletedAt`, `name`, `displayOrder`) を基底型として定義したい, so that 型定義の重複が排除され、共通フィールドの変更が一箇所で完結する

#### Acceptance Criteria

1. The 基底型モジュール shall `SoftDeletableEntity` インターフェースを提供し、`createdAt: string`, `updatedAt: string`, `deletedAt?: string | null` フィールドを定義する
2. The 基底型モジュール shall `MasterEntity extends SoftDeletableEntity` インターフェースを提供し、`name: string`, `displayOrder: number` フィールドを追加定義する
3. The 基底型モジュール shall `@/lib/types/base-entity` パスからインポート可能である
4. When 既存のマスターエンティティ型 (`WorkType`, `BusinessUnit`, `ProjectType`) を基底型に移行する場合, the 各 feature の型定義 shall 基底型を `extends` し、固有フィールドのみを追加定義する形に変更される
5. The 基底型への移行 shall 既存の型の外部インターフェース (フィールド名・型) を一切変更しない (後方互換性の維持)

### Requirement 4: 共通 Zod スキーマヘルパー

**Objective:** As a フロントエンド開発者, I want `code`, `name`, `displayOrder` 等の共通フィールドバリデーションを再利用可能なスキーマヘルパーとして提供したい, so that バリデーションルールの重複と不統一が解消される

#### Acceptance Criteria

1. The スキーマヘルパーモジュール shall `codeSchema` を提供し、英数字・ハイフン・アンダースコアのみ許可、1〜20文字の範囲制約、日本語エラーメッセージを含むバリデーションを定義する
2. The スキーマヘルパーモジュール shall `nameSchema` を提供し、1〜100文字の範囲制約と日本語エラーメッセージを含むバリデーションを定義する
3. The スキーマヘルパーモジュール shall `displayOrderSchema` を提供し、0以上の整数制約と日本語エラーメッセージを含むバリデーションを定義する
4. The スキーマヘルパーモジュール shall `colorCodeSchema` を提供し、`#RRGGBB` 形式の正規表現バリデーション (nullable/optional 対応) を定義する
5. The スキーマヘルパーモジュール shall `@/lib/schemas/master-entity-schema` パスからインポート可能である
6. When 既存のフォームスキーマを共通ヘルパーに移行する場合, the バリデーションルール shall 現行のルール (文字数制限、正規表現、エラーメッセージ) と完全に一致する

### Requirement 5: 既存フォームコンポーネントへの適用

**Objective:** As a フロントエンド開発者, I want 作成した共通インフラを既存のマスターフォームに適用して重複を実際に削減したい, so that リファクタリングの効果が実証され、今後のフォーム実装のテンプレートとなる

#### Acceptance Criteria

1. When `WorkTypeForm.tsx` に FormField コンポーネントを適用した場合, the WorkTypeForm shall 既存の Label + Input + Error 構造を FormField 呼び出しに置換し、視覚的・機能的に同一の動作を維持する
2. When `BusinessUnitForm.tsx` に FormField コンポーネントを適用した場合, the BusinessUnitForm shall 同様に共通コンポーネントを使用する形にリファクタリングされる
3. When `ProjectTypeForm.tsx` に FormField コンポーネントを適用した場合, the ProjectTypeForm shall 同様に共通コンポーネントを使用する形にリファクタリングされる
4. When `ProjectForm.tsx` に QuerySelect コンポーネントを適用した場合, the ProjectForm shall 事業部・プロジェクトタイプの Select フィールドを QuerySelect に置換し、ローディング/エラー/成功の3状態ハンドリングを共通化する
5. When 既存のフォームスキーマに共通スキーマヘルパーを適用した場合, the 各フォーム shall `codeSchema`, `nameSchema`, `displayOrderSchema` を import して使用する形に変更される
6. The リファクタリング後のフォーム shall ビルドエラー・型エラーが発生しない状態を維持する


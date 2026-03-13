# リサーチ & 設計判断ログ

## サマリー
- **フィーチャー**: `project-frontend-missing-fields`
- **ディスカバリースコープ**: Simple Addition（既存UIへのフィールド追加）
- **主要な発見**:
  - バックエンドAPIは7フィールドすべてを `| null` 型で返却済み。フロントエンド型はこれに合わせる
  - プロジェクト内に `Textarea` コンポーネントが存在しない。shadcn/ui の Textarea を新規追加する必要がある
  - 既存フォームパターン（`FormTextField` + `FieldWrapper` + Zodバリデーション）をそのまま踏襲可能

## リサーチログ

### Textarea コンポーネントの必要性
- **コンテキスト**: `calculationBasis`（最大500文字）と `remarks`（最大500文字）は複数行テキストが想定されるため、通常の `Input` では不十分
- **調査結果**: `apps/frontend/src/components/ui/textarea.tsx` が存在しない。shadcn/ui の Textarea は `<textarea>` のラッパーで、`Input` と同じパターン（`className` マージ + `forwardRef`）
- **方針**: shadcn/ui CLI (`npx shadcn@latest add textarea`) または手動で追加

### フロントエンド型とバックエンド型の整合性
- **コンテキスト**: フロントエンドの `Project` 型がバックエンドAPIレスポンスと一致していない
- **調査結果**: バックエンド `Project` 型（`apps/backend/src/types/project.ts` L143-149）では7フィールドすべてが `| null` 型。フロントエンドはこれに合わせて `number | null` / `string | null` で定義する
- **方針**: `SoftDeletableEntity` を拡張した既存 `Project` インターフェースに7フィールドを追加

### フォームのnull/空文字列変換
- **コンテキスト**: APIは `null` を返すが、フォーム入力では空文字列が自然
- **調査結果**: 既存パターン（`durationMonths`）では `null` ↔ 空文字列の変換をフォーム内で行っている
- **方針**: 文字列フィールドは `?? ""` でデフォルト値に空文字列を使用。数値フィールド（`fiscalYear`）は `durationMonths` と同じパターンで `null` 変換。送信時に空文字列を `undefined` に変換してAPIに渡す

## 設計判断

### 判断: Textarea の導入方法
- **コンテキスト**: `calculationBasis` と `remarks` に複数行入力が必要
- **代替案**:
  1. shadcn/ui CLI で生成
  2. 手動で `textarea.tsx` を作成
- **選択**: 手動作成（CLIの実行環境に依存しない）
- **理由**: shadcn/ui の Textarea は非常にシンプル（20行未満）で、手動作成のほうが確実
- **トレードオフ**: CLI生成のほうがアップデート追従しやすいが、Textareaは変更頻度が低い

### 判断: FormTextareaField 共有コンポーネントの作成有無
- **コンテキスト**: `FormTextField` に相当するTextarea版が必要か
- **代替案**:
  1. `FormTextareaField` 共有コンポーネントを新規作成
  2. `FieldWrapper` + `Textarea` をインラインで使用
- **選択**: `FieldWrapper` + `Textarea` をインラインで使用
- **理由**: 現時点でTextareaを使用するフォームはProjectFormのみ。共有コンポーネントは他のフォームでも必要になったときに作成する（YAGNI原則）
- **トレードオフ**: 将来的に重複コードが発生する可能性があるが、現時点では過剰設計を避ける

### 判断: テーブル列の挿入位置
- **コンテキスト**: 3列（年度・客先名・オーダー番号）をどこに配置するか
- **選択**: `name` 列の直後に `fiscalYear` → `customerName` → `orderNumber` の順で挿入
- **理由**: 案件の識別に関わる情報を左側にまとめることで視認性を向上させる

## リスク & 対策
- `ProjectForm` のコード量が約300行→約450行に増加 — 現時点では許容範囲。将来的にセクション分割を検討
- 7フィールドすべてが任意項目のため、既存データへの影響なし（後方互換性は保たれる）

## 参考資料
- バックエンド Project 型: `apps/backend/src/types/project.ts` L130-154
- 既存 ProjectForm パターン: `apps/frontend/src/features/projects/components/ProjectForm.tsx`
- shadcn/ui Textarea: 標準的な `<textarea>` ラッパーコンポーネント

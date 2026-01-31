# GitHub Issue 起票ルール（React/TypeScript）

## 概要

人間からの曖昧な指摘をClaude Codeが構造化されたGitHub Issueに変換し、
後続の修正作業をスムーズに行うためのガイドライン。

---

## Issue起票フロー

```
人間: 曖昧な指摘
    ↓
Claude Code: コードベース調査 → 原因分析 → Issue起票
    ↓
人間: レビュー・承認
    ↓
Claude Code: 修正実装 → PR作成
```

---

## Issueテンプレート

```markdown
## 問題の概要
<!-- 1-2文で問題を要約 -->

## 現状の動作
<!-- 今どうなっているか -->

## 期待する動作
<!-- どうなるべきか -->

## 技術的な影響範囲

### 対象コンポーネント
- `src/components/xxx/XxxComponent.tsx`

### 関連ファイル
- スタイル: `src/components/xxx/XxxComponent.module.css`
- 型定義: `src/types/xxx.ts`
- hooks: `src/hooks/useXxx.ts`
- API: `src/api/xxx.ts`

### 依存関係
- 親コンポーネント: 
- 子コンポーネント: 
- 使用しているhooks: 
- 使用しているcontext: 

## 原因分析

### 問題の根本原因
<!-- なぜこの問題が起きているか -->

### 関連コード
```tsx
// 問題のあるコード箇所（ファイルパスと行番号）
```

## 修正方針

### アプローチ
<!-- 推奨する修正アプローチ -->

### 実装ステップ
1. [ ] ステップ1
2. [ ] ステップ2
3. [ ] ステップ3

### 変更が必要なファイル
| ファイル | 変更内容 |
|---------|---------|
| `src/components/xxx.tsx` | 〇〇を修正 |

## 受け入れ条件
- [ ] 条件1
- [ ] 条件2
- [ ] TypeScriptエラーがないこと
- [ ] 既存のテストが通ること

## 参照
- 関連Issue: #xx
- 適用パターン/プラクティス: 
```

---

## Claude Codeの分析プロセス

### 1. 指摘の分類

| 分類 | キーワード例 | 調査対象 |
|------|-------------|---------|
| UI/見た目 | 「色」「サイズ」「位置」「崩れ」 | CSS/Tailwind、レイアウトコンポーネント |
| UX/操作性 | 「使いづらい」「わかりにくい」「遅い」 | イベントハンドラ、状態管理、アニメーション |
| 機能バグ | 「動かない」「エラー」「おかしい」 | ロジック、API呼び出し、状態更新 |
| 型/データ | 「型」「undefined」「null」 | 型定義、バリデーション、API レスポンス |

### 2. コードベース調査

Issue起票前に必ず実行：

```bash
# 該当コンポーネントの確認
cat src/components/[対象].tsx

# 関連する型定義
cat src/types/[関連].ts

# 使用箇所の確認
grep -r "ComponentName" src/

# 既存テストの確認
cat src/components/__tests__/[対象].test.tsx
```

### 3. React/TypeScript観点での分析

以下をチェック：

- **コンポーネント設計**: 責務の分離、props設計
- **状態管理**: useState/useReducer/Context/外部ライブラリの適切な使用
- **副作用**: useEffectの依存配列、クリーンアップ
- **型安全性**: any/unknownの使用、型ガード
- **パフォーマンス**: 不要な再レンダリング、メモ化
- **アクセシビリティ**: セマンティックHTML、ARIA属性

---

## ラベル運用

| ラベル | 用途 |
|--------|------|
| `ui` | 見た目・スタイリング |
| `ux` | 操作性・インタラクション |
| `bug` | 機能的な不具合 |
| `type-safety` | 型定義の問題 |
| `performance` | パフォーマンス問題 |
| `a11y` | アクセシビリティ |
| `refactor` | リファクタリング |
| `needs-analysis` | 追加調査が必要 |

---

## 起票コマンド

```bash
# Issue本文を一時ファイルに書き出してから起票
gh issue create \
  --title "【UI】Buttonコンポーネントのホバー状態が見づらい" \
  --body-file /tmp/issue-body.md \
  --label "ui"
```

---

## 修正実装ルール

### ブランチ命名

```
fix/issue-42-button-hover-style
feat/issue-43-add-loading-state
refactor/issue-44-extract-form-logic
```

### コミットメッセージ

```
fix(Button): ホバー時のコントラスト比を改善

- bg-blue-500 → bg-blue-600 に変更
- フォーカスリングを追加
- WCAG AA基準に準拠

Fixes #42
```

### PRテンプレート

```markdown
## 対応Issue
Fixes #42

## 変更内容
- 変更点1
- 変更点2

## 動作確認
- [ ] 開発環境で確認
- [ ] 型チェック通過 (`npm run typecheck`)
- [ ] テスト通過 (`npm run test`)

## スクリーンショット
<!-- UIの変更がある場合 -->
```

---

## 例：曖昧な指摘からIssue化

### 人間の指摘

> 「このフォーム、なんか入力しててイライラするんだよね」

### Claude Codeの分析

**1. 指摘の解釈**
- 入力のレスポンスが悪い？
- バリデーションのタイミング？
- エラーメッセージがわかりにくい？
- Tab移動がおかしい？

**2. コード調査**

```bash
cat src/components/ContactForm.tsx
cat src/hooks/useForm.ts
```

**3. 発見した問題**

```tsx
// src/components/ContactForm.tsx
const handleChange = (e) => {
  setValue(e.target.value);
  validate(e.target.value); // ← 毎回バリデーション実行
  // debounceされていない
};
```

### 起票されるIssue

```markdown
## 問題の概要
ContactFormの入力時にバリデーションが即時実行され、UXが悪い

## 現状の動作
- 1文字入力するたびにバリデーションが実行される
- 入力中にエラーメッセージが頻繁に表示/非表示を繰り返す
- 入力完了前に「メールアドレスが不正です」などのエラーが出る

## 期待する動作
- 入力中はバリデーションを遅延実行
- フォーカスアウト時に最終バリデーション
- エラー表示が安定している

## 技術的な影響範囲

### 対象コンポーネント
- `src/components/ContactForm.tsx`

### 関連ファイル
- hooks: `src/hooks/useForm.ts`
- バリデーション: `src/utils/validation.ts`

### 依存関係
- 親: `src/pages/ContactPage.tsx`
- 子: `src/components/FormField.tsx`, `src/components/ErrorMessage.tsx`

## 原因分析

### 問題の根本原因
`handleChange`内で`validate()`を即時実行しており、debounceやonBlurでのバリデーションになっていない。

### 関連コード
```tsx
// src/components/ContactForm.tsx L24-27
const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
  validate(e.target.value); // 問題箇所
};
```

## 修正方針

### アプローチ
1. 入力中のバリデーションをdebounce（300ms）
2. onBlur時に即時バリデーション
3. 送信時にも最終バリデーション

### 実装ステップ
1. [ ] `useDebouncedValidation` hookを作成
2. [ ] `ContactForm`でdebounced validationを使用
3. [ ] `onBlur`ハンドラを追加
4. [ ] エラー表示のちらつき防止

### 変更が必要なファイル
| ファイル | 変更内容 |
|---------|---------|
| `src/hooks/useDebouncedValidation.ts` | 新規作成 |
| `src/components/ContactForm.tsx` | バリデーションロジック変更 |
| `src/components/FormField.tsx` | onBlur propを追加 |

## 受け入れ条件
- [ ] 入力中にエラーがちらつかない
- [ ] 入力完了後（300ms経過 or フォーカスアウト）にバリデーション実行
- [ ] 送信時のバリデーションは即時
- [ ] TypeScriptエラーがないこと
- [ ] 既存テストが通ること

## 参照
- 適用パターン: Debounced Validation
- 参考: React Hook Form のバリデーション戦略
```

---

## よくある問題パターンと調査ポイント

### UI/スタイリング

| 症状 | 調査ポイント |
|------|-------------|
| レイアウト崩れ | flex/grid設定、親の幅制約 |
| レスポンシブ問題 | breakpoint、メディアクエリ |
| 色・コントラスト | テーマ変数、カラーパレット |

### 状態管理

| 症状 | 調査ポイント |
|------|-------------|
| 状態が反映されない | 不変性、setState のタイミング |
| 無限ループ | useEffect依存配列 |
| 状態の不整合 | 複数のstate間の同期 |

### パフォーマンス

| 症状 | 調査ポイント |
|------|-------------|
| 描画が遅い | 不要な再レンダリング、メモ化 |
| 入力が遅延 | 制御コンポーネント、debounce |
| 初期表示が遅い | コード分割、lazy loading |

### 型安全性

| 症状 | 調査ポイント |
|------|-------------|
| runtime error | 型ガードの不足、nullチェック |
| any の使用 | 適切な型定義 |
| APIレスポンス | Zodなどでのバリデーション |

---

## 注意事項

- **推測で埋めない**: 不明点は`needs-analysis`ラベルで人間に確認
- **過剰な修正を避ける**: 指摘された問題にフォーカス
- **既存パターンを尊重**: プロジェクトの慣習に沿った修正方針
- **破壊的変更を避ける**: 既存のprops、APIは維持

# TanStack Form 基本セットアップ規約

## 概要

本ドキュメントは、TanStack Form（v1）の基本セットアップ、useForm フック、Field コンポーネント、フォーム送信の実装規約を定めるものです。
`apps/frontend` の実装時に本ガイドを遵守してください。

---

## 前提

- TanStack Form **v1** を使用
- フレームワーク: **React**（`@tanstack/react-form`）
- Standard Schema バリデーション（**Zod**）を標準採用
- shadcn/ui との統合を想定
- TypeScript 必須

---

## 必須パッケージ

```bash
# TanStack Form 本体
pnpm add @tanstack/react-form

# Zod（バリデーション用）
pnpm add zod
```

> **注意**: `@tanstack/zod-form-adapter` は非推奨。TanStack Form v1 は Standard Schema に対応しており、Zod スキーマを直接 `validators` に渡せる。

---

## ファイル配置

```
src/
├── hooks/
│   └── form.ts              # createFormHook による共通フォームフック定義
├── components/
│   └── ui/
│       ├── form-fields.tsx   # 再利用可能なフィールドコンポーネント
│       └── form-buttons.tsx  # 再利用可能なフォームボタン
└── features/
    └── [feature]/
        ├── components/
        │   └── [form-name]-form.tsx  # フォームコンポーネント
        └── types/
            └── index.ts              # フォーム型定義
```

---

## 基本パターン

### useForm による直接的なフォーム定義

小規模・一回限りのフォームでは `useForm` を直接使用する。

```tsx
import { useForm } from '@tanstack/react-form'

export function SimpleForm() {
  const form = useForm({
    defaultValues: {
      username: '',
      age: 0,
    },
    onSubmit: async ({ value }) => {
      console.log(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <form.Field
        name="username"
        children={(field) => (
          <>
            <label htmlFor={field.name}>Username</label>
            <input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </>
        )}
      />
      <button type="submit">Submit</button>
    </form>
  )
}
```

### form.Field の基本構造

`form.Field` はレンダープロップパターンを使用する。

```tsx
<form.Field
  name="fieldName"
  validators={{
    onChange: ({ value }) =>
      value.length < 3 ? 'Must be at least 3 characters' : undefined,
  }}
  children={(field) => (
    <>
      <label htmlFor={field.name}>Label</label>
      <input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {!field.state.meta.isValid && (
        <em role="alert">{field.state.meta.errors.join(', ')}</em>
      )}
    </>
  )}
/>
```

---

## フォーム送信

### 基本的な送信パターン

```tsx
<form
  onSubmit={(e) => {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }}
>
  {/* fields */}
</form>
```

> **必須**: `e.preventDefault()` と `e.stopPropagation()` の両方を呼び出すこと。

### 送信メタデータの受け渡し

複数の送信アクション（「送信して次へ」「送信してメニューに戻る」等）が必要な場合、`onSubmitMeta` を使用する。

```tsx
type FormMeta = {
  submitAction: 'continue' | 'backToMenu' | null
}

const defaultMeta: FormMeta = {
  submitAction: null,
}

const form = useForm({
  defaultValues: { data: '' },
  onSubmitMeta: defaultMeta,
  onSubmit: async ({ value, meta }) => {
    console.log(`Action: ${meta.submitAction}`, value)
  },
})

// 使用時
<button
  type="submit"
  onClick={() => form.handleSubmit({ submitAction: 'continue' })}
>
  送信して次へ
</button>
```

### 送信ボタンの状態管理

```tsx
<form.Subscribe
  selector={(state) => [state.canSubmit, state.isSubmitting]}
  children={([canSubmit, isSubmitting]) => (
    <button type="submit" disabled={!canSubmit}>
      {isSubmitting ? '送信中...' : '送信'}
    </button>
  )}
/>
```

---

## フォームのリセット

```tsx
<button type="button" onClick={() => form.reset()}>
  リセット
</button>
```

> **注意**: リセットボタンには `type="button"` を必ず指定すること。`type="reset"` を使用するとネイティブ HTML のリセット動作により予期しない挙動が発生する。

---

## フォーム状態

### 主要な状態プロパティ

| プロパティ | 型 | 説明 |
|---|---|---|
| `state.values` | `T` | 現在のフォーム値 |
| `state.canSubmit` | `boolean` | 送信可能かどうか |
| `state.isSubmitting` | `boolean` | 送信中かどうか |
| `state.isPristine` | `boolean` | 未変更かどうか |
| `state.errorMap` | `Record<string, string>` | バリデーションイベント別のエラー |

### フィールド状態

| プロパティ | 型 | 説明 |
|---|---|---|
| `field.state.value` | `T` | 現在のフィールド値 |
| `field.state.meta.isValid` | `boolean` | バリデーション合格かどうか |
| `field.state.meta.isTouched` | `boolean` | ユーザーが操作したかどうか |
| `field.state.meta.isDirty` | `boolean` | デフォルト値から変更されたか（永続的） |
| `field.state.meta.errors` | `string[]` | エラーメッセージの配列 |
| `field.state.meta.errorMap` | `Record<string, string>` | イベント別エラーマップ |

---

## 禁止事項

- `@tanstack/zod-form-adapter` の `zodValidator` を使用しない（非推奨）
- `form.Field` の外で `field.handleChange` を呼び出さない
- `useStore` のセレクタを省略しない（不要な再レンダリングの原因になる）
- フォーム送信時に `e.preventDefault()` を省略しない

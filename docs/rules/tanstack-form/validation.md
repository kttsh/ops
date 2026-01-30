# TanStack Form バリデーション規約

## 概要

本ドキュメントは、TanStack Form v1 におけるバリデーション実装の規約を定めるものです。
フィールドレベル・フォームレベルバリデーション、Zod 統合、非同期バリデーション、エラー表示パターンを規定します。

---

## 前提

- Zod による Standard Schema バリデーションを優先使用する
- フィールド単体のバリデーションにはフィールドレベルバリデーションを使用
- クロスフィールドバリデーションにはフォームレベルバリデーションを使用
- バリデーションタイミングは UX に応じて適切に選択する

---

## バリデーションタイミング

### 推奨パターン

| タイミング | 用途 | プロパティ |
|---|---|---|
| `onChange` | リアルタイムフィードバック（文字数制限等） | `validators.onChange` |
| `onBlur` | フォーカス離脱時のバリデーション（推奨デフォルト） | `validators.onBlur` |
| `onSubmit` | 送信時のみバリデーション（サーバー送信前の最終チェック） | `validators.onSubmit` |
| `onChangeAsync` | 非同期の onChange バリデーション | `validators.onChangeAsync` |
| `onBlurAsync` | 非同期の onBlur バリデーション | `validators.onBlurAsync` |

### 推奨組み合わせ

```tsx
// 通常のフォーム: onBlur + onSubmit
validators: {
  onBlur: formSchema,
  onSubmit: formSchema,
}

// リアルタイムフィードバックが必要な場合: onChange + onSubmit
validators: {
  onChange: formSchema,
  onSubmit: formSchema,
}
```

---

## Zod スキーマによるバリデーション

### フォームレベルバリデーション（推奨）

Zod スキーマをフォーム全体のバリデータとして使用する。エラーは自動的に各フィールドに伝播する。

```tsx
import { z } from 'zod'
import { useForm } from '@tanstack/react-form'

const formSchema = z.object({
  title: z
    .string()
    .min(5, 'タイトルは5文字以上で入力してください')
    .max(32, 'タイトルは32文字以内で入力してください'),
  description: z
    .string()
    .min(20, '説明は20文字以上で入力してください')
    .max(100, '説明は100文字以内で入力してください'),
})

function MyForm() {
  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      console.log(value)
    },
  })

  // ...
}
```

### フィールドレベルバリデーション

個別フィールドに Zod スキーマまたはカスタム関数を適用する。

```tsx
// Zod スキーマを直接渡す
<form.Field
  name="age"
  validators={{
    onChange: z.number().gte(13, '13歳以上である必要があります'),
  }}
  children={(field) => (
    // ...
  )}
/>

// カスタム関数
<form.Field
  name="age"
  validators={{
    onChange: ({ value }) =>
      value < 13 ? '13歳以上である必要があります' : undefined,
  }}
  children={(field) => (
    // ...
  )}
/>
```

> **注意**: フィールドレベルバリデーションはフォームレベルバリデーションより優先される。同じフィールドに両方設定した場合、フィールドレベルのエラーが表示される。

---

## 非同期バリデーション

### 基本パターン

```tsx
<form.Field
  name="username"
  validators={{
    onChangeAsync: async ({ value }) => {
      const exists = await checkUsernameExists(value)
      return exists ? 'このユーザー名は既に使用されています' : undefined
    },
  }}
  children={(field) => (
    // ...
  )}
/>
```

### デバウンス

非同期バリデーションにはデバウンスを必ず設定する。

```tsx
<form.Field
  name="username"
  asyncDebounceMs={500}
  validators={{
    // 同期バリデーション（即座に実行）
    onChange: z.string().min(3, 'ユーザー名は3文字以上で入力してください'),
    // 非同期バリデーション（500ms デバウンス）
    onChangeAsyncDebounceMs: 500,
    onChangeAsync: async ({ value }) => {
      const exists = await checkUsernameExists(value)
      return exists ? 'このユーザー名は既に使用されています' : undefined
    },
  }}
  children={(field) => (
    // ...
  )}
/>
```

### 同期 + 非同期の組み合わせ

同期バリデーションが先に実行され、成功した場合のみ非同期バリデーションが実行される。

```tsx
<form.Field
  name="email"
  validators={{
    onBlur: z.string().email('有効なメールアドレスを入力してください'),
    onBlurAsync: async ({ value }) => {
      const available = await checkEmailAvailability(value)
      return available ? undefined : 'このメールアドレスは既に登録されています'
    },
  }}
  children={(field) => (
    // ...
  )}
/>
```

---

## クロスフィールドバリデーション（Linked Fields）

### onChangeListenTo / onBlurListenTo

あるフィールドの変更時に別のフィールドのバリデーションを再実行する。

```tsx
<form.Field name="password">
  {(field) => (
    <input
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
    />
  )}
</form.Field>

<form.Field
  name="confirmPassword"
  validators={{
    onChangeListenTo: ['password'],
    onChange: ({ value, fieldApi }) => {
      if (value !== fieldApi.form.getFieldValue('password')) {
        return 'パスワードが一致しません'
      }
      return undefined
    },
  }}
>
  {(field) => (
    <div>
      <input
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.errors.map((err) => (
        <div key={err}>{err}</div>
      ))}
    </div>
  )}
</form.Field>
```

### フォームレベルでのフィールドエラー設定

サーバーサイドバリデーション等で、フォームレベルから各フィールドにエラーを設定する。

```tsx
const form = useForm({
  defaultValues: {
    email: '',
    username: '',
  },
  validators: {
    onSubmitAsync: async ({ value }) => {
      const result = await validateOnServer(value)
      if (result.hasErrors) {
        return {
          form: 'バリデーションエラーがあります',
          fields: {
            email: 'このメールアドレスは使用できません',
            username: 'このユーザー名は使用できません',
          },
        }
      }
      return null
    },
  },
})
```

---

## エラー表示パターン

### 基本パターン（推奨）

`isTouched` と `isValid` を組み合わせて、ユーザーが操作済みのフィールドのみエラーを表示する。

```tsx
<form.Field
  name="title"
  children={(field) => {
    const isInvalid =
      field.state.meta.isTouched && !field.state.meta.isValid
    return (
      <div data-invalid={isInvalid}>
        <label htmlFor={field.name}>タイトル</label>
        <input
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
        />
        {isInvalid && (
          <em role="alert">{field.state.meta.errors.join(', ')}</em>
        )}
      </div>
    )
  }}
/>
```

### errorMap によるイベント別エラー表示

```tsx
{field.state.meta.errorMap['onChange'] && (
  <em>{field.state.meta.errorMap['onChange']}</em>
)}
```

### フォームレベルエラーの表示

```tsx
<form.Subscribe
  selector={(state) => [state.errorMap]}
  children={([errorMap]) =>
    errorMap.onSubmit ? (
      <div role="alert">
        <em>{errorMap.onSubmit}</em>
      </div>
    ) : null
  }
/>
```

---

## Zod スキーマでの変換データの扱い

バリデーションは入力値に対して実行され、変換後の値は `onSubmit` に渡されない。
変換後の値が必要な場合は `onSubmit` 内で `schema.parse()` を実行する。

```tsx
const schema = z.object({
  age: z.string().transform((age) => Number(age)),
})

const form = useForm({
  defaultValues: { age: '13' } satisfies z.input<typeof schema>,
  validators: { onChange: schema },
  onSubmit: ({ value }) => {
    // value.age は string 型
    const parsed = schema.parse(value)
    // parsed.age は number 型
  },
})
```

---

## 禁止事項

- 非同期バリデーションでデバウンスを省略しない
- `isTouched` チェックなしでエラーを表示しない（初期状態でエラーが見えてしまう）
- `aria-invalid` 属性を省略しない（アクセシビリティ要件）
- `onChangeListenTo` を使わずに別フィールドの値を直接参照してバリデーションしない

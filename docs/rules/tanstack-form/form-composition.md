# TanStack Form コンポジション規約

## 概要

本ドキュメントは、TanStack Form v1 の `createFormHook` による再利用可能なフォームコンポーネントの構成規約を定めるものです。
プロジェクト全体で一貫したフォーム実装を実現するため、共通フォームフックとプリバインドコンポーネントのパターンを規定します。

---

## 前提

- `createFormHook` を使用してアプリ全体の共通フォームフックを定義する
- 再利用可能なフィールドコンポーネントは `useFieldContext` で型安全に実装する
- `withForm` で大規模フォームを分割する
- `withFieldGroup` でフィールドグループを再利用する

---

## ファイル配置

```
src/
├── hooks/
│   ├── form.ts              # createFormHook によるアプリ共通フォームフック
│   └── form-context.ts      # createFormHookContexts によるコンテキスト
├── components/
│   └── ui/
│       ├── text-field.tsx    # 再利用可能フィールド（useFieldContext 使用）
│       ├── number-field.tsx
│       ├── select-field.tsx
│       ├── checkbox-field.tsx
│       └── submit-button.tsx # 再利用可能フォームボタン（useFormContext 使用）
└── features/
    └── [feature]/
        └── components/
            └── [form-name]-form.tsx
```

---

## コンテキスト定義

### form-context.ts

```tsx
// src/hooks/form-context.ts
import { createFormHookContexts } from '@tanstack/react-form'

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()
```

> **必須**: `useFieldContext` と `useFormContext` は必ずこのファイルからエクスポートする。

---

## フィールドコンポーネントの実装

### TextField

```tsx
// src/components/ui/text-field.tsx
import { useFieldContext } from '@/hooks/form-context'
import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'

export function TextField({ label }: { label: string }) {
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
```

### NumberField

```tsx
// src/components/ui/number-field.tsx
import { useFieldContext } from '@/hooks/form-context'
import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'

export function NumberField({ label }: { label: string }) {
  const field = useFieldContext<number>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        type="number"
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.valueAsNumber)}
        aria-invalid={isInvalid}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
```

### SubmitButton

```tsx
// src/components/ui/submit-button.tsx
import { useFormContext } from '@/hooks/form-context'
import { Button } from '@/components/ui/button'

export function SubmitButton({ label = '送信' }: { label?: string }) {
  const form = useFormContext()

  return (
    <form.Subscribe
      selector={(state) => [state.canSubmit, state.isSubmitting]}
      children={([canSubmit, isSubmitting]) => (
        <Button type="submit" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? '送信中...' : label}
        </Button>
      )}
    />
  )
}
```

---

## 共通フォームフックの定義

### form.ts

```tsx
// src/hooks/form.ts
import { createFormHook } from '@tanstack/react-form'
import { fieldContext, formContext } from './form-context'
import { TextField } from '@/components/ui/text-field'
import { NumberField } from '@/components/ui/number-field'
import { SubmitButton } from '@/components/ui/submit-button'

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    TextField,
    NumberField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
})
```

---

## useAppForm の使用

`useAppForm` は `useForm` と同じオプションを受け取り、`AppField` と `AppForm` を追加で提供する。

```tsx
import { useAppForm } from '@/hooks/form'
import { z } from 'zod'

const formSchema = z.object({
  username: z.string().min(3),
  age: z.number().min(13),
})

function UserForm() {
  const form = useAppForm({
    defaultValues: {
      username: '',
      age: 0,
    },
    validators: {
      onChange: formSchema,
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
      {/* AppField: プリバインドコンポーネントにアクセス可能 */}
      <form.AppField
        name="username"
        children={(field) => <field.TextField label="ユーザー名" />}
      />
      <form.AppField
        name="age"
        children={(field) => <field.NumberField label="年齢" />}
      />

      {/* AppForm: フォームコンテキストが必要なコンポーネント */}
      <form.AppForm>
        <form.SubmitButton label="登録" />
      </form.AppForm>
    </form>
  )
}
```

---

## 大規模フォームの分割（withForm）

### 子フォームコンポーネントの定義

```tsx
import { withForm } from '@/hooks/form'
import { formOptions } from '@tanstack/react-form'

const formOpts = formOptions({
  defaultValues: {
    firstName: '',
    lastName: '',
    email: '',
    age: 0,
  },
})

const PersonalInfoSection = withForm({
  ...formOpts,
  props: {
    title: '個人情報',
  },
  render: function Render({ form, title }) {
    return (
      <div>
        <h2>{title}</h2>
        <form.AppField
          name="firstName"
          children={(field) => <field.TextField label="姓" />}
        />
        <form.AppField
          name="lastName"
          children={(field) => <field.TextField label="名" />}
        />
      </div>
    )
  },
})
```

> **重要**: `render` プロパティには `function Render({...})` 形式の名前付き関数を使用すること。アロー関数にすると ESLint の hooks ルールでエラーになる。

### 親フォームでの使用

```tsx
function RegistrationForm() {
  const form = useAppForm({
    ...formOpts,
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
      <PersonalInfoSection form={form} title="個人情報" />
      <form.AppForm>
        <form.SubmitButton />
      </form.AppForm>
    </form>
  )
}
```

---

## フィールドグループの再利用（withFieldGroup）

複数のフォームで共通して使用するフィールドセット（パスワード + 確認パスワード等）を定義する。

```tsx
import { withFieldGroup } from '@/hooks/form'

type PasswordFields = {
  password: string
  confirmPassword: string
}

const defaultValues: PasswordFields = {
  password: '',
  confirmPassword: '',
}

const PasswordFieldGroup = withFieldGroup({
  defaultValues,
  render: function Render({ group }) {
    return (
      <div>
        <group.AppField name="password">
          {(field) => <field.TextField label="パスワード" />}
        </group.AppField>
        <group.AppField
          name="confirmPassword"
          validators={{
            onChangeListenTo: ['password'],
            onChange: ({ value, fieldApi }) => {
              if (value !== group.getFieldValue('password')) {
                return 'パスワードが一致しません'
              }
              return undefined
            },
          }}
        >
          {(field) => <field.TextField label="パスワード（確認）" />}
        </group.AppField>
      </div>
    )
  },
})
```

### フィールドグループの使用

```tsx
function SignUpForm() {
  const form = useAppForm({
    defaultValues: {
      username: '',
      credentials: {
        password: '',
        confirmPassword: '',
      },
    },
  })

  return (
    <form.AppForm>
      <form.AppField
        name="username"
        children={(field) => <field.TextField label="ユーザー名" />}
      />
      <PasswordFieldGroup form={form} fields="credentials" />
    </form.AppForm>
  )
}
```

---

## Tree-shaking（コード分割）

大量のフィールドコンポーネントがある場合、`React.lazy` でコード分割する。

```tsx
// src/hooks/form.ts
import { lazy } from 'react'
import { createFormHook } from '@tanstack/react-form'
import { fieldContext, formContext } from './form-context'

const TextField = lazy(() => import('@/components/ui/text-field'))
const NumberField = lazy(() => import('@/components/ui/number-field'))

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, NumberField },
  formComponents: {},
})
```

使用側では `Suspense` でラップする。

```tsx
import { Suspense } from 'react'

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <MyForm />
    </Suspense>
  )
}
```

---

## 禁止事項

- `createFormHookContexts` を複数箇所で呼び出さない（1 アプリにつき 1 つ）
- `withForm` の `render` にアロー関数を使用しない（ESLint hooks エラーの原因）
- `useTypedAppFormContext` を安易に使用しない（型安全性が保証されないため、`withForm` を優先）
- `fieldComponents` と `formComponents` にコンポーネントを過剰に登録しない（必要なものだけ）

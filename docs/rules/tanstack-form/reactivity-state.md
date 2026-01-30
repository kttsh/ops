# TanStack Form リアクティビティ・状態管理規約

## 概要

本ドキュメントは、TanStack Form v1 におけるリアクティブな状態購読、UI ライブラリ（shadcn/ui）統合パターンを定めるものです。

---

## 前提

- TanStack Form はデフォルトで再レンダリングを発生させない
- リアクティブな値が必要な場合は `useStore` または `form.Subscribe` で購読する
- UI ライブラリは shadcn/ui を標準採用する

---

## リアクティビティ

### useStore（ロジック内での使用）

コンポーネントのロジック内でフォーム状態にアクセスする場合に使用する。

```tsx
import { useStore } from '@tanstack/react-store'

function MyComponent() {
  const form = useForm({ /* ... */ })

  // セレクタを必ず指定する
  const firstName = useStore(form.store, (state) => state.values.firstName)
  const errors = useStore(form.store, (state) => state.errorMap)

  // firstName や errors をロジックで使用
}
```

> **必須**: `useStore` のセレクタは必ず指定すること。省略するとすべてのフォーム状態変更で再レンダリングが発生する。

### form.Subscribe（UI 内での使用）

UI の条件付きレンダリングに使用する。コンポーネント全体の再レンダリングを発生させない。

```tsx
<form.Subscribe
  selector={(state) => state.values.showAdvanced}
  children={(showAdvanced) =>
    showAdvanced ? (
      <div>
        {/* 詳細設定フィールド */}
      </div>
    ) : null
  }
/>
```

### 使い分けの指針

| 用途 | 推奨 API |
|---|---|
| UI の条件付きレンダリング | `form.Subscribe` |
| ロジック内での値参照 | `useStore` |
| 送信ボタンの状態制御 | `form.Subscribe` |
| 値に基づく計算 | `useStore` |
| フォームエラーの表示 | `form.Subscribe` |

---

## shadcn/ui 統合パターン

### Input

```tsx
<form.Field
  name="name"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor={field.name}>名前</FieldLabel>
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
  }}
/>
```

### Select

```tsx
<form.Field
  name="category"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor={field.name}>カテゴリ</FieldLabel>
        <Select
          name={field.name}
          value={field.state.value}
          onValueChange={field.handleChange}
        >
          <SelectTrigger id={field.name} aria-invalid={isInvalid}>
            <SelectValue placeholder="選択してください" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bug">バグ</SelectItem>
            <SelectItem value="feature">機能要望</SelectItem>
            <SelectItem value="improvement">改善</SelectItem>
          </SelectContent>
        </Select>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    )
  }}
/>
```

> **注意**: Select コンポーネントは `onChange` ではなく `onValueChange` を使用する。

### Checkbox（単一）

```tsx
<form.Field
  name="agreeToTerms"
  children={(field) => (
    <Field orientation="horizontal">
      <Checkbox
        id={field.name}
        name={field.name}
        checked={field.state.value}
        onCheckedChange={field.handleChange}
      />
      <FieldLabel htmlFor={field.name}>
        利用規約に同意する
      </FieldLabel>
    </Field>
  )}
/>
```

> **注意**: Checkbox は `onChange` ではなく `onCheckedChange` を使用する。

### RadioGroup

```tsx
<form.Field
  name="plan"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
    return (
      <fieldset>
        <legend>プラン</legend>
        <RadioGroup
          name={field.name}
          value={field.state.value}
          onValueChange={field.handleChange}
        >
          <div>
            <RadioGroupItem value="free" id="plan-free" />
            <label htmlFor="plan-free">無料</label>
          </div>
          <div>
            <RadioGroupItem value="pro" id="plan-pro" />
            <label htmlFor="plan-pro">Pro</label>
          </div>
          <div>
            <RadioGroupItem value="enterprise" id="plan-enterprise" />
            <label htmlFor="plan-enterprise">Enterprise</label>
          </div>
        </RadioGroup>
        {isInvalid && (
          <em role="alert">{field.state.meta.errors.join(', ')}</em>
        )}
      </fieldset>
    )
  }}
/>
```

### Textarea

```tsx
<form.Field
  name="description"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor={field.name}>説明</FieldLabel>
        <Textarea
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          rows={4}
          aria-invalid={isInvalid}
        />
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    )
  }}
/>
```

---

## エラー表示の共通パターン

すべてのフィールドコンポーネントで統一するエラー表示パターン。

```tsx
// 共通の isInvalid 判定
const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

// 1. data-invalid 属性でスタイリング
<Field data-invalid={isInvalid}>

// 2. aria-invalid でアクセシビリティ
<Input aria-invalid={isInvalid} />

// 3. 条件付きエラー表示
{isInvalid && <FieldError errors={field.state.meta.errors} />}
```

---

## 禁止事項

- `useStore` でセレクタを省略しない
- `form.Subscribe` の `selector` を省略しない
- shadcn/ui コンポーネントの `onChange` / `onCheckedChange` / `onValueChange` を混同しない
- `data-invalid` と `aria-invalid` の両方を設定すること（スタイリングとアクセシビリティの両立）

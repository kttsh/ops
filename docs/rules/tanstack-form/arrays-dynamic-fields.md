# TanStack Form 配列・動的フィールド規約

## 概要

本ドキュメントは、TanStack Form v1 における配列フィールド（動的フィールド）の実装規約を定めるものです。
`mode="array"` の使用方法、サブフィールドのアクセス、配列操作メソッドを規定します。

---

## 前提

- 配列フィールドには `mode="array"` を指定する
- サブフィールドには `people[${i}].name` 形式のパス文字列を使用する
- 配列操作にはフィールド API のメソッドを使用する

---

## 基本パターン

### 配列フィールドの定義

```tsx
const form = useForm({
  defaultValues: {
    people: [] as Array<{ name: string; age: number }>,
  },
  onSubmit: async ({ value }) => {
    console.log(value)
  },
})
```

### 配列フィールドのレンダリング

```tsx
<form.Field name="people" mode="array">
  {(field) => (
    <div>
      {field.state.value.map((_, i) => (
        <div key={i}>
          <form.Field name={`people[${i}].name`}>
            {(subField) => (
              <div>
                <label htmlFor={`people-${i}-name`}>
                  名前 {i + 1}
                </label>
                <input
                  id={`people-${i}-name`}
                  value={subField.state.value}
                  onChange={(e) => subField.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name={`people[${i}].age`}>
            {(subField) => (
              <div>
                <label htmlFor={`people-${i}-age`}>
                  年齢 {i + 1}
                </label>
                <input
                  id={`people-${i}-age`}
                  type="number"
                  value={subField.state.value}
                  onChange={(e) =>
                    subField.handleChange(e.target.valueAsNumber)
                  }
                />
              </div>
            )}
          </form.Field>

          <button type="button" onClick={() => field.removeValue(i)}>
            削除
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => field.pushValue({ name: '', age: 0 })}
      >
        追加
      </button>
    </div>
  )}
</form.Field>
```

---

## 配列操作メソッド

| メソッド | 引数 | 説明 |
|---|---|---|
| `pushValue(value)` | 追加する値 | 配列の末尾に要素を追加 |
| `removeValue(index)` | インデックス | 指定位置の要素を削除 |
| `swapValues(indexA, indexB)` | 2 つのインデックス | 2 つの要素の位置を交換 |
| `moveValue(from, to)` | 移動元・移動先インデックス | 要素を別の位置に移動 |
| `insertValue(index, value)` | インデックス, 値 | 指定位置に要素を挿入 |
| `replaceValue(index, value)` | インデックス, 値 | 指定位置の要素を置換 |

---

## Zod バリデーションとの組み合わせ

### スキーマ定義

```tsx
const formSchema = z.object({
  emails: z
    .array(
      z.object({
        address: z.string().email('有効なメールアドレスを入力してください'),
      }),
    )
    .min(1, '少なくとも1つのメールアドレスを追加してください')
    .max(5, 'メールアドレスは最大5つまでです'),
})
```

### 実装例

```tsx
function EmailForm() {
  const form = useForm({
    defaultValues: {
      emails: [{ address: '' }],
    },
    validators: {
      onSubmit: formSchema,
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
      <form.Field name="emails" mode="array">
        {(field) => (
          <div>
            {field.state.value.map((_, index) => (
              <div key={index}>
                <form.Field
                  name={`emails[${index}].address`}
                  children={(subField) => {
                    const isInvalid =
                      subField.state.meta.isTouched &&
                      !subField.state.meta.isValid
                    return (
                      <div>
                        <input
                          type="email"
                          value={subField.state.value}
                          onBlur={subField.handleBlur}
                          onChange={(e) =>
                            subField.handleChange(e.target.value)
                          }
                          placeholder="name@example.com"
                          aria-invalid={isInvalid}
                        />
                        {isInvalid && (
                          <em role="alert">
                            {subField.state.meta.errors.join(', ')}
                          </em>
                        )}
                      </div>
                    )
                  }}
                />

                {field.state.value.length > 1 && (
                  <button
                    type="button"
                    onClick={() => field.removeValue(index)}
                  >
                    削除
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => field.pushValue({ address: '' })}
              disabled={field.state.value.length >= 5}
            >
              メールアドレスを追加
            </button>
          </div>
        )}
      </form.Field>
    </form>
  )
}
```

---

## チェックボックス配列パターン

選択肢のリストから複数選択する場合のパターン。

```tsx
const options = [
  { id: 'email', label: 'メール通知' },
  { id: 'sms', label: 'SMS通知' },
  { id: 'push', label: 'プッシュ通知' },
]

<form.Field name="notifications" mode="array">
  {(field) => (
    <fieldset>
      <legend>通知設定</legend>
      {options.map((option) => (
        <label key={option.id}>
          <input
            type="checkbox"
            checked={field.state.value.includes(option.id)}
            onChange={(e) => {
              if (e.target.checked) {
                field.pushValue(option.id)
              } else {
                const index = field.state.value.indexOf(option.id)
                if (index > -1) field.removeValue(index)
              }
            }}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  )}
</form.Field>
```

---

## 禁止事項

- 配列フィールドに `mode="array"` を省略しない
- 配列の `key` にインデックス以外の安定した値がある場合はそれを使用する（ただし TanStack Form ではインデックスベースのパスが標準）
- 配列操作に直接的な state 変更を使用しない（必ず `pushValue`, `removeValue` 等の API を使用する）
- 最小要素数の制約がある場合、削除ボタンの `disabled` または条件付き表示を実装する

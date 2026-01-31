# Zod バリデーション規約

## 概要

本ドキュメントは、Zod v4 のリファインメント、カスタムバリデーション、スーパーリファインの実装規約を定めるものです。

---

## refine（カスタムバリデーション）

### 基本パターン

```ts
const PasswordSchema = z.string().refine(
  (val) => val.length >= 8,
  { error: "パスワードは8文字以上にしてください" }
);
```

### エラー関数

```ts
const AgeSchema = z.number().refine(
  (val) => val >= 18,
  {
    error: (iss) => `年齢は18歳以上である必要があります（入力値: ${iss.input}）`,
  }
);
```

> **v4 変更点**: `message` パラメータは非推奨。`error` を使用すること。

### 条件付き refine（when）

```ts
const ConditionalSchema = z.string().refine(
  (val) => val.startsWith("https"),
  {
    error: "HTTPS URLを入力してください",
    when: (val) => typeof val === "string", // 条件を満たす場合のみ実行
  }
);
```

### abort（早期終了）

```ts
const StrictSchema = z.string().refine(
  (val) => val.length > 0,
  {
    error: "空文字は許可されません",
    abort: true, // このリファインメント失敗時に後続のチェックを中断
  }
);
```

---

## superRefine（複数エラー生成）

```ts
const PasswordComplexitySchema = z.string().superRefine((val, ctx) => {
  if (val.length < 8) {
    ctx.addIssue({
      code: "custom",
      message: "パスワードは8文字以上にしてください",
    });
  }
  if (!/[A-Z]/.test(val)) {
    ctx.addIssue({
      code: "custom",
      message: "大文字を1文字以上含めてください",
    });
  }
  if (!/[0-9]/.test(val)) {
    ctx.addIssue({
      code: "custom",
      message: "数字を1文字以上含めてください",
    });
  }
});
```

---

## check（低レベルリファインメント API）

```ts
const EvenSchema = z.number().check(
  (ctx) => {
    if (ctx.value % 2 !== 0) {
      ctx.addIssue({
        code: "custom",
        message: "偶数を入力してください",
      });
    }
  }
);
```

---

## overwrite（値の上書き）

```ts
// バリデーション後に値を上書きする
const TrimmedSchema = z.string().overwrite((val) => val.trim());
```

> **注意**: `overwrite` は `transform` と異なり、入力型と出力型が同じである必要がある。

---

## オブジェクトレベルのリファインメント

### パスワード確認の例

```ts
const SignupSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "パスワードが一致しません",
    path: ["confirmPassword"], // エラーの表示先パスを指定
  });
```

### superRefine による複数フィールドバリデーション

```ts
const DateRangeSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .superRefine((data, ctx) => {
    if (data.endDate <= data.startDate) {
      ctx.addIssue({
        code: "custom",
        message: "終了日は開始日より後にしてください",
        path: ["endDate"],
      });
    }
  });
```

---

## 非同期バリデーション

```ts
const UniqueEmailSchema = z.string().email().refine(
  async (email) => {
    const exists = await checkEmailExists(email);
    return !exists;
  },
  { error: "このメールアドレスは既に使用されています" }
);

// 非同期バリデーションは parseAsync / safeParseAsync で実行
const result = await UniqueEmailSchema.safeParseAsync("user@example.com");
```

---

## カスタム文字列フォーマット

```ts
// 再利用可能なフォーマットバリデーションを定義
z.stringFormat("phone-jp", (val) => {
  return /^0\d{1,4}-\d{1,4}-\d{4}$/.test(val);
});

// 使用
const PhoneSchema = z.string().format("phone-jp");
```

---

## バリデーション設計の原則

### システム境界でのみバリデーションを行う

```ts
// ✅ API エンドポイントの入力（システム境界）
app.post("/api/users", async (c) => {
  const body = CreateUserSchema.safeParse(await c.req.json());
  if (!body.success) return c.json(body.error, 400);
  // ...
});

// ✅ フォーム送信時の入力（システム境界）
const form = useForm({
  validators: { onChange: UserFormSchema },
});

// ❌ 内部関数の引数バリデーション（過剰）
function calculateTotal(items: CartItem[]): number {
  // CartItemSchema.parse(items); ← 不要
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
```

### スキーマの再利用

```ts
// ✅ 基本スキーマを定義し、用途別に拡張
const BaseUserSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
});

const CreateUserSchema = BaseUserSchema.extend({
  password: z.string().min(8),
});

const UpdateUserSchema = BaseUserSchema.partial();

const UserResponseSchema = BaseUserSchema.extend({
  id: z.string(),
  createdAt: z.string(),
});
```

### エラーメッセージの統一

```ts
// ✅ 日本語エラーメッセージの統一パターン
const RequiredString = (fieldName: string) =>
  z.string({ error: `${fieldName}は必須です` }).min(1, {
    error: `${fieldName}を入力してください`,
  });

const NameSchema = RequiredString("名前");
const EmailSchema = z.email({ error: "有効なメールアドレスを入力してください" });
```

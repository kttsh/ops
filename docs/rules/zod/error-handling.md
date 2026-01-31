# Zod エラーハンドリング規約

## 概要

本ドキュメントは、Zod v4 のエラーハンドリング、エラーフォーマット、国際化の実装規約を定めるものです。

---

## ZodError

### 基本構造

```ts
const result = schema.safeParse(data);
if (!result.success) {
  const error: z.ZodError = result.error;

  // issues 配列にすべてのバリデーションエラーが含まれる
  for (const issue of error.issues) {
    console.log(issue.code);    // エラーコード
    console.log(issue.message); // エラーメッセージ
    console.log(issue.path);    // エラー発生箇所のパス
  }
}
```

### 主要な Issue コード

| コード | 説明 |
|--------|------|
| `invalid_type` | 型の不一致 |
| `too_small` | 最小値/最小長の違反 |
| `too_big` | 最大値/最大長の違反 |
| `invalid_format` | フォーマットの不一致（email, uuid 等） |
| `invalid_value` | 値の不一致（literal, enum 等） |
| `unrecognized_keys` | 不明なキー（strictObject） |
| `custom` | カスタムバリデーションのエラー |

---

## エラーフォーマットユーティリティ

### z.prettifyError()（ログ・デバッグ用）

```ts
if (!result.success) {
  console.log(z.prettifyError(result.error));
}
// 出力:
// ✖ Invalid input: expected string, received number
//   → at name
// ✖ Invalid input: expected number, received string
//   → at age
```

### z.treeifyError()（ネストされたエラー構造）

```ts
if (!result.success) {
  const tree = z.treeifyError(result.error);

  // プロパティ別のエラーにアクセス
  tree.properties?.name?.errors;   // string[]
  tree.properties?.age?.errors;    // string[]

  // 配列要素のエラー
  tree.properties?.items?.items?.[0]?.errors; // string[]
}
```

### z.flattenError()（フォームバリデーション用・推奨）

```ts
if (!result.success) {
  const flat = z.flattenError(result.error);

  flat.formErrors;      // string[] - ルートレベルのエラー
  flat.fieldErrors;     // Record<string, string[]> - フィールド別エラー

  flat.fieldErrors.name;  // string[] | undefined
  flat.fieldErrors.email; // string[] | undefined
}
```

> **規約**: フォームバリデーションには `z.flattenError()` を使用し、デバッグには `z.prettifyError()` を使用すること。

> **v4 変更点**: `.format()` / `.flatten()` インスタンスメソッドは非推奨。トップレベル関数の `z.treeifyError()` / `z.flattenError()` を使用すること。

---

## エラーカスタマイズ

### スキーマレベル（最高優先度）

```ts
// 文字列パラメータ
z.string({ error: "文字列を入力してください" });
z.string().min(1, { error: "必須項目です" });

// 関数パラメータ（動的メッセージ）
z.string({
  error: (iss) => {
    if (iss.input === undefined) return "この項目は必須です";
    return "文字列を入力してください";
  },
});

// Issue コード別のハンドリング
z.string().min(5, {
  error: (iss) => {
    if (iss.code === "too_small") {
      return `${iss.minimum}文字以上入力してください`;
    }
    return undefined; // デフォルトメッセージにフォールバック
  },
});
```

> **v4 変更点**: `message` パラメータは非推奨。`error` を使用すること。`invalid_type_error` / `required_error` パラメータは削除された。

### パースレベル（中優先度）

```ts
schema.safeParse(data, {
  error: (iss) => {
    if (iss.code === "invalid_type") {
      return `型が不正です: ${iss.expected} を期待しましたが ${typeof iss.input} が入力されました`;
    }
    return undefined;
  },
});
```

### グローバルレベル（低優先度）

```ts
z.config({
  customError: (iss) => {
    if (iss.code === "invalid_type") {
      return `無効な型です: ${iss.expected} が必要です`;
    }
    if (iss.code === "too_small") {
      return `値が小さすぎます`;
    }
    return undefined; // デフォルトにフォールバック
  },
});
```

### エラー優先度（高い順）

1. **スキーマレベル** — `z.string({ error: "..." })`
2. **パースレベル** — `schema.safeParse(data, { error: ... })`
3. **グローバル設定** — `z.config({ customError: ... })`
4. **ロケール** — `z.config(z.locales.ja())`

---

## 国際化（i18n）

### ロケール設定

```ts
import { z } from "zod";

// 日本語ロケールの読み込み
z.config(z.locales.ja());

// または動的インポート
async function loadLocale(locale: string) {
  const { default: loc } = await import(`zod/v4/locales/${locale}.js`);
  z.config(loc());
}
await loadLocale("ja");
```

### 対応ロケール一覧

`ar`, `az`, `be`, `bg`, `ca`, `cs`, `da`, `de`, `en`, `eo`, `es`, `fa`, `fi`, `fr`, `frCA`, `he`, `hu`, `hy`, `id`, `is`, `it`, **`ja`**, `ka`, `km`, `ko`, `lt`, `mk`, `ms`, `nl`, `no`, `ota`, `ps`, `pl`, `pt`, `ru`, `sl`, `sv`, `ta`, `th`, `tr`, `uk`, `ur`, `uz`, `vi`, `zhCN`, `zhTW`, `yo`

### ロケール + カスタムエラーの組み合わせ

```ts
// ロケールを基本とし、特定のメッセージだけ上書き
z.config(z.locales.ja());

const schema = z.string({
  error: "このフィールドは特別なメッセージが必要です",
});
// スキーマレベルのエラーがロケールより優先される
```

---

## 入力データの報告

```ts
// デフォルトでは issues に入力データが含まれない（セキュリティ対策）
// 必要な場合は明示的に有効化
schema.safeParse(data, { reportInput: true });
```

> **規約**: セキュリティ上の理由から、`reportInput` はデバッグ目的でのみ使用し、本番環境では無効にすること。

---

## バックエンドでの統合パターン

### Hono + Zod バリデーションエラー

```ts
import { zValidator } from "@hono/zod-validator";

app.post(
  "/api/users",
  zValidator("json", CreateUserSchema, (result, c) => {
    if (!result.success) {
      const flat = z.flattenError(result.error);
      return c.json(
        {
          type: "validation-error",
          title: "バリデーションエラー",
          status: 422,
          errors: flat.fieldErrors,
        },
        422
      );
    }
  }),
  async (c) => {
    const data = c.req.valid("json");
    // ...
  }
);
```

### フロントエンドでの統合パターン

```ts
// TanStack Form との統合
const form = useForm({
  defaultValues: { name: "", email: "" },
  validators: {
    onChange: CreateUserSchema,
  },
  onSubmit: async ({ value }) => {
    // value は型安全
  },
});
```

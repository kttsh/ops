# Zod 高度なパターン規約

## 概要

本ドキュメントは、Zod v4 の再帰型、ブランド型、メタデータ、レジストリ、JSON Schema 変換等の高度な機能の実装規約を定めるものです。

---

## 再帰型

### getter 構文（推奨）

```ts
// z.object / z.interface 内でゲッターを使用して自己参照を定義
const CategorySchema = z.object({
  name: z.string(),
  get children() {
    return z.array(CategorySchema);
  },
});

type Category = z.infer<typeof CategorySchema>;
// { name: string; children: Category[] }
```

### z.interface()（再帰型に最適化）

```ts
const TreeNodeSchema = z.interface({
  value: z.string(),
  get left(): z.ZodNullable<typeof TreeNodeSchema> {
    return z.nullable(TreeNodeSchema);
  },
  get right(): z.ZodNullable<typeof TreeNodeSchema> {
    return z.nullable(TreeNodeSchema);
  },
});
```

> **型注釈**: 複雑な再帰型では getter に戻り値の型注釈が必要な場合がある。

### 相互再帰

```ts
const UserSchema = z.object({
  name: z.string(),
  get posts() {
    return z.array(PostSchema);
  },
});

const PostSchema = z.object({
  title: z.string(),
  get author() {
    return UserSchema;
  },
});
```

### z.lazy()（非オブジェクトコンテキスト用）

```ts
// z.record() 内の再帰など、getter が使えない場面で使用
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ])
);
```

> **v4 注意**: `z.lazy(() => schema).optional()` は TDZ エラーになる。`z.lazy(() => schema.optional())` のように lazy コールバック内で `.optional()` を適用すること。

---

## ブランド型（Branded Types）

```ts
// 構造的に同一だが型レベルで区別する
const UserIdSchema = z.string().brand<"UserId">();
const PostIdSchema = z.string().brand<"PostId">();

type UserId = z.infer<typeof UserIdSchema>; // string & { __brand: "UserId" }
type PostId = z.infer<typeof PostIdSchema>; // string & { __brand: "PostId" }

function getUser(id: UserId): Promise<User> { /* ... */ }

const userId = UserIdSchema.parse("user-123"); // UserId
const postId = PostIdSchema.parse("post-456"); // PostId

getUser(userId); // ✅ OK
getUser(postId); // ❌ コンパイルエラー
```

### ブランドの適用方向

```ts
z.string().brand<"Token">();            // 出力のみブランド付き（デフォルト）
z.string().brand<"Token", "out">();     // 出力のみ
z.string().brand<"Token", "in">();      // 入力のみ
z.string().brand<"Token", "inout">();   // 入力・出力の両方
```

---

## メタデータ

### .meta()（z.globalRegistry への登録）

```ts
const EmailSchema = z.email().meta({
  id: "email_address",
  title: "メールアドレス",
  description: "有効なメールアドレスを入力してください",
  examples: ["user@example.com"],
});

// メタデータの取得
const meta = EmailSchema.meta();
// { id: "email_address", title: "メールアドレス", ... }
```

### .describe()（description のみ）

```ts
// .meta({ description: "..." }) のショートハンド
const NameSchema = z.string().describe("ユーザー名");
```

### z.globalRegistry のメタデータ型

```ts
interface GlobalMeta {
  id?: string;
  title?: string;
  description?: string;
  deprecated?: boolean;
  [k: string]: unknown; // 任意のフィールドも追加可能
}
```

### 型拡張

```ts
// zod.d.ts でグローバルメタデータ型を拡張
declare module "zod" {
  interface GlobalMeta {
    label?: string;
    placeholder?: string;
  }
}
```

> **注意**: メタデータは特定のスキーマインスタンスに紐づく。Zod のメソッドはイミュータブルのため、チェーン操作で新しいインスタンスが生成されると元のメタデータは引き継がれない。

---

## カスタムレジストリ

### 型付きレジストリの作成

```ts
// メタデータ型を指定してレジストリを作成
const formRegistry = z.registry<{
  label: string;
  placeholder?: string;
  helpText?: string;
}>();

// スキーマの登録
const nameSchema = z.string().min(1).register(formRegistry, {
  label: "名前",
  placeholder: "山田太郎",
  helpText: "フルネームを入力してください",
});

// メタデータの取得
const meta = formRegistry.get(nameSchema);
// { label: "名前", placeholder: "山田太郎", helpText: "..." }
```

### 推論型参照（z.$output / z.$input）

```ts
type ExampleMeta = { examples: z.$output[] };
const exampleRegistry = z.registry<ExampleMeta>();

exampleRegistry.add(z.string(), { examples: ["hello", "world"] }); // string[]
exampleRegistry.add(z.number(), { examples: [1, 2, 3] });          // number[]
```

### スキーマ型の制約

```ts
// 特定の型のスキーマのみ登録可能にする
const stringRegistry = z.registry<
  { description: string },
  z.ZodString
>();

stringRegistry.add(z.string(), { description: "OK" });  // ✅
// stringRegistry.add(z.number(), { ... });             // ❌ コンパイルエラー
```

### ID の一意性

```ts
// 同一レジストリ内で id が重複するとエラー
const schema1 = z.string().meta({ id: "email" });
const schema2 = z.string().meta({ id: "email" }); // ❌ ランタイムエラー
```

---

## JSON Schema 変換

### z.toJSONSchema()

```ts
const UserSchema = z.object({
  name: z.string().meta({ title: "名前" }),
  email: z.email().meta({ title: "メールアドレス" }),
  age: z.number().int().positive().optional(),
});

const jsonSchema = z.toJSONSchema(UserSchema);
// {
//   type: "object",
//   properties: {
//     name: { type: "string", title: "名前" },
//     email: { type: "string", format: "email", title: "メールアドレス" },
//     age: { type: "integer", exclusiveMinimum: 0 }
//   },
//   required: ["name", "email"],
//   additionalProperties: false
// }
```

### オプション

```ts
z.toJSONSchema(schema, {
  // ターゲットバージョン
  target: "draft-2020-12",  // デフォルト
  // target: "draft-07",
  // target: "draft-04",
  // target: "openapi-3.0",

  // 入力型 or 出力型
  io: "output",  // デフォルト
  // io: "input",

  // JSON Schema で表現不可能な型の扱い
  unrepresentable: "throw",  // デフォルト（エラー）
  // unrepresentable: "any",  // {} に変換

  // 循環参照の扱い
  cycles: "ref",  // デフォルト（$defs を使用）
  // cycles: "throw",

  // 再利用スキーマの扱い
  reused: "inline",  // デフォルト（インライン展開）
  // reused: "ref",   // $defs に抽出

  // カスタム変換関数
  override: (ctx) => {
    // ctx.zodSchema: 元の Zod スキーマ
    // ctx.jsonSchema: 生成された JSON Schema
    // return で上書き、undefined でデフォルト使用
    return undefined;
  },
});
```

### レジストリからの一括変換

```ts
// グローバルレジストリ内のスキーマを一括変換
const user = z.object({ name: z.string() }).meta({ id: "User" });
const post = z.object({ title: z.string() }).meta({ id: "Post" });

const schemas = z.toJSONSchema(z.globalRegistry, {
  uri: (id) => `https://api.example.com/schemas/${id}.json`,
});
```

### JSON Schema で表現不可能な型

以下の型は JSON Schema に変換できないため注意:

- `z.bigint()`, `z.date()`, `z.map()`, `z.set()`
- `z.symbol()`, `z.undefined()`, `z.void()`
- `z.transform()`, `z.custom()`
- `z.nan()`

---

## z.fromJSONSchema()（実験的）

```ts
// JSON Schema から Zod スキーマを生成
const zodSchema = z.fromJSONSchema({
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" },
  },
  required: ["name", "age"],
});

// 対応フォーマット: draft-2020-12, draft-07, draft-04, OpenAPI 3.0
```

> **注意**: `z.fromJSONSchema()` は実験的 API であり、安定版 API の一部ではない。将来のバージョンで変更される可能性がある。

---

## Readonly

```ts
const ReadonlyUserSchema = z.object({
  name: z.string(),
  tags: z.array(z.string()),
}).readonly();

type ReadonlyUser = z.infer<typeof ReadonlyUserSchema>;
// Readonly<{ name: string; tags: readonly string[] }>
```

---

## Function スキーマ

```ts
// 関数の入出力を型安全にバリデーション
const myFunction = z
  .function({
    input: [z.string(), z.number()],
    output: z.boolean(),
  })
  .implement((name, age) => {
    return age >= 18;
  });

// 非同期関数
const asyncFunction = z
  .function({
    input: [z.string()],
    output: z.object({ data: z.unknown() }),
  })
  .implementAsync(async (url) => {
    const res = await fetch(url);
    return { data: await res.json() };
  });
```

> **v4 変更点**: `z.function()` はスキーマを返さなくなった。新 API は `{ input, output }` オブジェクトを受け取り、`.implement()` / `.implementAsync()` で実装する。

---

## ライブラリ作者向け: zod/v4/core

```ts
// Zod と Zod Mini の両方で動作するライブラリを構築する場合
import * as zCore from "zod/v4/core";

// $-prefixed のベースクラスを使用
function processSchema(schema: zCore.$ZodType) {
  // Zod Classic と Zod Mini の両方で動作
}
```

### ピア依存の設定

```json
{
  "peerDependencies": {
    "zod": "^3.25.0 || ^4.0.0"
  }
}
```

---

## Zod Mini（バンドルサイズ最適化）

```ts
import { z } from "zod/mini";

// メソッドチェーンの代わりに関数を使用
const schema = z.string(z.minLength(5), z.maxLength(100));

// tree-shakable — 使用しない機能はバンドルに含まれない
// コアサイズ: ~1.88KB（gzip）
```

> **規約**: バンドルサイズが厳しいフロントエンドプロジェクトでのみ Zod Mini の採用を検討すること。通常は標準の Zod を使用する。

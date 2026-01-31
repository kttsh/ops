# Zod 基本セットアップ規約

## 概要

本ドキュメントは、Zod v4 の基本セットアップ、インポート方法、プリミティブ型、パース方法の実装規約を定めるものです。
`apps/frontend` および `apps/backend` の実装時に本ガイドを遵守してください。

---

## 前提

- Zod **v4**（`zod@^4.0.0`）を使用
- TypeScript **strict モード必須**
- フロントエンド: `@tanstack/zod-adapter` / `@hono/zod-validator` と連携
- バックエンド: Hono + `@hono/zod-validator` と連携

---

## インストール

```bash
pnpm add zod
```

---

## インポート

```ts
// ✅ v4 の標準インポート
import { z } from "zod";

// ❌ 旧サブパスインポート（不要）
import { z } from "zod/v4";
```

> **注意**: `zod@^4.0.0` では `"zod"` からの直接インポートが v4 になる。`"zod/v4"` サブパスも引き続き利用可能だが、新規コードでは `"zod"` を使用すること。

---

## プリミティブ型

### 基本型

```ts
z.string()     // 文字列
z.number()     // 有限数値（Infinity は無効）
z.bigint()     // BigInt
z.boolean()    // 真偽値
z.date()       // Date オブジェクト
z.symbol()     // Symbol
z.undefined()  // undefined
z.null()       // null
```

### 特殊型

```ts
z.any()        // any 型（バリデーションなし）
z.unknown()    // unknown 型（安全な any）
z.never()      // never 型（常にエラー）
z.nan()        // NaN のみ許容
z.void()       // void（undefined を含む）
```

### リテラル型

```ts
// 単一値
z.literal("active");
z.literal(42);
z.literal(true);

// 複数値のリテラルユニオン
z.literal(["active", "inactive", "archived"]);
```

### Enum

```ts
// 文字列 Enum
const StatusSchema = z.enum(["active", "inactive", "archived"]);
type Status = z.infer<typeof StatusSchema>; // "active" | "inactive" | "archived"

// TypeScript enum / オブジェクトからの Enum
// v4 では z.nativeEnum() は非推奨。z.enum() がオブジェクトを直接受け付ける
enum Direction {
  Up = "UP",
  Down = "DOWN",
}
const DirectionSchema = z.enum(Direction);
```

### Stringbool

```ts
// 環境変数などの "true" / "false" 文字列を boolean に変換
const flagSchema = z.stringbool();
flagSchema.parse("true");  // true
flagSchema.parse("false"); // false
```

---

## 型推論

```ts
const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
});

// ✅ z.infer で型を導出（別途 interface/type を定義しない）
type User = z.infer<typeof UserSchema>;

// 入力型と出力型が異なる場合
type UserInput = z.input<typeof UserSchema>;
type UserOutput = z.output<typeof UserSchema>;
```

> **規約**: スキーマから `z.infer` で型を導出し、型の二重定義を避けること。

---

## パース方法

### parse（例外スロー）

```ts
const result = UserSchema.parse(data);
// バリデーション失敗時は ZodError をスロー
```

### safeParse（推奨）

```ts
const result = UserSchema.safeParse(data);
if (result.success) {
  console.log(result.data); // 型安全なデータ
} else {
  console.log(result.error); // ZodError
}
```

### 非同期パース

```ts
// 非同期バリデーションを含むスキーマ用
const result = await UserSchema.safeParseAsync(data);
```

> **規約**: API ハンドラーやフォーム処理では `safeParse` を使用し、例外に依存しないこと。

---

## 型の強制変換（Coercion）

```ts
// 入力を自動的に指定型に変換してからバリデーション
z.coerce.string()   // String(input)
z.coerce.number()   // Number(input)
z.coerce.boolean()  // Boolean(input)
z.coerce.bigint()   // BigInt(input)
z.coerce.date()     // new Date(input)
```

> **注意**: v4 では coerce スキーマの入力型は `unknown` になった。

---

## 整数型

```ts
// 安全整数（Number.MIN_SAFE_INTEGER 〜 Number.MAX_SAFE_INTEGER）
z.int()

// 32ビット整数
z.int32()
```

> **注意**: v4 の `z.number().int()` は safe integer のみ受け付ける。浮動小数点数は拒否される。

---

## Optional / Nullable / Nullish

```ts
z.string().optional()   // string | undefined
z.string().nullable()   // string | null
z.string().nullish()    // string | null | undefined

// Readonly
z.object({ name: z.string() }).readonly()  // Readonly<{ name: string }>
```

---

## デフォルト値

```ts
// undefined の場合にデフォルト値を使用（バリデーションをスキップ）
z.string().default("N/A");

// undefined の場合にデフォルト値を使用し、その後バリデーション実行
z.string().min(1).prefault("N/A");

// バリデーション失敗時にフォールバック値を使用
z.string().catch("fallback");
```

> **v4 変更点**: `.default()` は入力型ではなく出力型のデフォルトを設定する。バリデーション前にデフォルトを適用したい場合は `.prefault()` を使用すること。

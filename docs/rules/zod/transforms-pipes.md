# Zod Transform・Pipe・Codec 規約

## 概要

本ドキュメントは、Zod v4 の Transform、Pipe、Codec、Preprocess の実装規約を定めるものです。

---

## Transform（一方向変換）

### 基本パターン

```ts
// 入力を受け取り、変換した結果を返す
const castToString = z.transform((val) => String(val));
castToString.parse(123);  // "123"
castToString.parse(true); // "true"
```

### スキーマと組み合わせた Transform

```ts
// z.string() でバリデーション後、数値に変換
const StringToNumberSchema = z.string().transform((val) => Number(val));
type Input = z.input<typeof StringToNumberSchema>;   // string
type Output = z.output<typeof StringToNumberSchema>;  // number

// 日付文字列をDateオブジェクトに変換
const DateStringSchema = z.iso.datetime().transform((val) => new Date(val));
```

### 非同期 Transform

```ts
const UserWithAvatarSchema = z.object({
  name: z.string(),
  avatarUrl: z.url(),
}).transform(async (data) => ({
  ...data,
  avatar: await fetchImage(data.avatarUrl),
}));
```

---

## Pipe（スキーマの連鎖）

### 基本パターン

```ts
// スキーマを連鎖させ、前のスキーマの出力を次の入力に渡す
const StringToLengthSchema = z.string().pipe(z.transform((val) => val.length));
StringToLengthSchema.parse("hello"); // 5
```

### バリデーション + Transform + バリデーション

```ts
// 文字列入力 → 数値変換 → 正の整数バリデーション
const PositiveIntStringSchema = z
  .string()
  .transform((val) => Number(val))
  .pipe(z.number().int().positive());
```

### coerce の代替としての Pipe

```ts
// z.coerce.number() の代わりに明示的なパイプを使用
const ExplicitCoerceSchema = z.unknown().pipe(
  z.transform((val) => Number(val)),
  z.number()
);
```

---

## Preprocess（前処理）

```ts
// バリデーション前にデータを変換
const CoercedIntSchema = z.preprocess((val) => {
  if (typeof val === "string") return Number.parseInt(val, 10);
  return val;
}, z.int());

CoercedIntSchema.parse("42");  // 42
CoercedIntSchema.parse(42);    // 42
```

> **v4 変更点**: `z.preprocess()` は `ZodPipe` インスタンスを返す（旧 `ZodPreprocess` は削除）。

---

## Codec（双方向変換）

### 基本パターン

```ts
import { z } from "zod";

// ISO 文字列 ⇔ Date の双方向変換
const dateCodec = z.codec(
  z.iso.datetime(),  // 入力スキーマ（decode 時の入力バリデーション）
  z.date(),          // 出力スキーマ（decode 時の出力バリデーション）
  {
    decode: (isoString) => new Date(isoString),
    encode: (date) => date.toISOString(),
  }
);

// decode: 文字列 → Date
const date = dateCodec.decode("2024-01-15T10:30:00.000Z");
// Date オブジェクト

// encode: Date → 文字列
const isoString = dateCodec.encode(new Date("2024-01-15"));
// "2024-01-15T00:00:00.000Z"
```

### parse と decode の違い

```ts
// parse: 入力型は unknown（外部データ用）
dateCodec.parse("2024-01-15T10:30:00.000Z"); // OK

// decode: 入力型は型安全（内部処理用）
dateCodec.decode("2024-01-15T10:30:00.000Z"); // 型チェックあり
```

### Codec のネスト

```ts
// Codec はオブジェクト・配列内にネスト可能
const EventSchema = z.object({
  name: z.string(),
  timestamp: dateCodec,
});

// decode でネストされた codec もすべて変換
const event = z.decode(EventSchema, {
  name: "Meeting",
  timestamp: "2024-01-15T10:30:00.000Z",
});
// { name: "Meeting", timestamp: Date }

// encode で逆変換
const raw = z.encode(EventSchema, event);
// { name: "Meeting", timestamp: "2024-01-15T10:30:00.000Z" }
```

### JSON Codec

```ts
// JSON 文字列 ⇔ オブジェクトの双方向変換
const jsonCodec = z.codec(z.string(), z.json(), {
  decode: (str) => JSON.parse(str),
  encode: (val) => JSON.stringify(val),
});

// 型付き JSON codec
const UserJsonCodec = jsonCodec.pipe(
  z.object({
    name: z.string(),
    age: z.number(),
  })
);

UserJsonCodec.decode('{"name":"Alice","age":30}');
// { name: "Alice", age: 30 }
```

> **制約**: スキーマ内に `.transform()` が含まれている場合、`z.encode()` はランタイムエラーをスローする。双方向変換が必要な場合は必ず `z.codec()` を使用すること。

---

## 実装パターン

### API レスポンスの変換

```ts
// API から受信したデータを内部型に変換
const ApiUserCodec = z.codec(
  z.object({
    user_name: z.string(),
    created_at: z.iso.datetime(),
  }),
  z.object({
    userName: z.string(),
    createdAt: z.date(),
  }),
  {
    decode: (raw) => ({
      userName: raw.user_name,
      createdAt: new Date(raw.created_at),
    }),
    encode: (user) => ({
      user_name: user.userName,
      created_at: user.createdAt.toISOString(),
    }),
  }
);
```

### Search Params の変換

```ts
// URL search params のパース（文字列 → 型付き値）
const SearchParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
  q: z.string().optional(),
});
```

### 使い分けガイド

| パターン | 用途 | 使用場面 |
|---------|------|---------|
| `transform` | 一方向のデータ変換 | API レスポンスのパース、フォーム入力の正規化 |
| `pipe` | スキーマの連鎖 | バリデーション → 変換 → 再バリデーション |
| `preprocess` | バリデーション前の前処理 | 型の強制変換、データのサニタイズ |
| `codec` | 双方向の変換 | API 通信、シリアライズ/デシリアライズ |
| `coerce` | 単純な型変換 | フォーム入力、環境変数、URL パラメータ |

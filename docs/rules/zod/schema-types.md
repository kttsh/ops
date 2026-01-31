# Zod スキーマ型定義規約

## 概要

本ドキュメントは、Zod v4 のオブジェクト・配列・ユニオン・レコード等の複合型スキーマ定義の実装規約を定めるものです。

---

## オブジェクト型

### z.object()（標準）

```ts
const UserSchema = z.object({
  name: z.string(),
  email: z.email(),
  age: z.number().optional(),
});

// 不明なキーは自動的に除去される（strip）
```

### z.strictObject()（厳密モード）

```ts
// 不明なキーが含まれる場合はエラー
const StrictUserSchema = z.strictObject({
  name: z.string(),
  email: z.email(),
});
```

### z.looseObject()（寛容モード）

```ts
// 不明なキーをそのまま通す（passthrough）
const LooseUserSchema = z.looseObject({
  name: z.string(),
  email: z.email(),
});
```

> **v4 変更点**: `.strict()` / `.passthrough()` / `.strip()` メソッドは非推奨。代わりに `z.strictObject()` / `z.looseObject()` / `z.object()` を使用すること。

### z.interface()（再帰型対応）

```ts
// z.object() とほぼ同一だが、getter による再帰型をネイティブサポート
const CategorySchema = z.interface({
  name: z.string(),
  get children() {
    return z.array(CategorySchema);
  },
});
```

> 再帰型の詳細は `advanced-patterns.md` を参照。

---

## オブジェクト操作

### extend / safeExtend

```ts
const BaseSchema = z.object({ name: z.string() });

// extend: 同名キーは上書き（型は拡張される）
const ExtendedSchema = BaseSchema.extend({
  name: z.string().min(1),
  email: z.email(),
});

// safeExtend: 同名キーの上書き時にコンパイルエラー
const SafeSchema = BaseSchema.safeExtend({
  email: z.email(), // OK
  // name: z.string(), // コンパイルエラー
});
```

> **v4 変更点**: `.merge()` は非推奨。`.extend()` を使用すること。

### pick / omit

```ts
const NameOnlySchema = UserSchema.pick({ name: true });
const WithoutAgeSchema = UserSchema.omit({ age: true });
```

### partial / required

```ts
// 全フィールドを optional に
const PartialUserSchema = UserSchema.partial();

// 特定フィールドのみ optional に
const PartialNameSchema = UserSchema.partial({ name: true });

// 全フィールドを必須に
const RequiredUserSchema = UserSchema.partial().required();
```

> **v4 変更点**: `.deepPartial()` は削除された。

### keyof / shape

```ts
// キーの Enum スキーマを取得
const KeySchema = UserSchema.keyof();

// shape オブジェクトへのアクセス
const nameSchema = UserSchema.shape.name;
```

### catchall

```ts
// 定義外のキーに対するスキーマを指定
const WithCatchallSchema = z.object({
  name: z.string(),
}).catchall(z.unknown());
```

---

## 配列型

```ts
const NumbersSchema = z.array(z.number());

// バリデーション
z.array(z.string()).min(1);         // 最小要素数
z.array(z.string()).max(10);        // 最大要素数
z.array(z.string()).length(5);      // 固定長

// ショートハンド
z.string().array(); // z.array(z.string()) と同等
```

> **v4 変更点**: `.nonempty()` は `.min(1)` と同一の動作になり、`[T, ...T[]]` 型は推論されなくなった。

---

## タプル型

```ts
// 固定長・混合型の配列
const PointSchema = z.tuple([z.number(), z.number()]);
type Point = z.infer<typeof PointSchema>; // [number, number]

// 可変長要素付きタプル
const NamedPointSchema = z.tuple([z.string()], z.number());
type NamedPoint = z.infer<typeof NamedPointSchema>; // [string, ...number[]]
```

---

## ユニオン型

### z.union()

```ts
// 順次バリデーション（最初に成功したスキーマを採用）
const StringOrNumberSchema = z.union([z.string(), z.number()]);

// ショートハンド
z.string().or(z.number()); // z.union([z.string(), z.number()]) と同等
```

### z.discriminatedUnion()（推奨）

```ts
// 判別キーによる効率的なユニオン
const EventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("click"), x: z.number(), y: z.number() }),
  z.object({ type: z.literal("keypress"), key: z.string() }),
  z.object({ type: z.literal("scroll"), offset: z.number() }),
]);
```

> **規約**: 共通の判別キーがある場合は `z.discriminatedUnion()` を使用すること。パフォーマンスが大幅に向上する。

### z.xor()（排他的ユニオン）

```ts
// 正確に1つのスキーマにのみマッチすることを要求
const ExclusiveSchema = z.xor([
  z.object({ email: z.email() }),
  z.object({ phone: z.string() }),
]);
```

---

## レコード型

```ts
// キー・バリュー型の辞書
const RecordSchema = z.record(z.string(), z.number());
type RecordType = z.infer<typeof RecordSchema>; // Record<string, number>

// Enum キーによるレコード（網羅性チェックあり）
const StatusMap = z.record(
  z.enum(["active", "inactive"]),
  z.number()
);
// ✅ すべてのキーが必須

// 部分レコード（キーの網羅性を要求しない）
const PartialStatusMap = z.partialRecord(
  z.enum(["active", "inactive"]),
  z.number()
);
```

> **v4 変更点**: `z.record()` は2引数必須。Enum キーの場合は網羅性が強制される。不要な場合は `z.partialRecord()` を使用。

---

## Map / Set

```ts
const MapSchema = z.map(z.string(), z.number());
const SetSchema = z.set(z.string());

// サイズ制約
z.set(z.string()).min(1).max(10);
```

---

## インターセクション型

```ts
const IntersectionSchema = z.intersection(
  z.object({ name: z.string() }),
  z.object({ age: z.number() })
);

// ショートハンド
z.object({ name: z.string() }).and(z.object({ age: z.number() }));
```

> **注意**: v4 ではマージ競合時に `Error`（`ZodError` ではない）がスローされる。

---

## 文字列バリデーション

### 制約メソッド

```ts
z.string().min(1)              // 最小長
z.string().max(100)            // 最大長
z.string().length(10)          // 固定長
z.string().regex(/^[a-z]+$/)   // 正規表現
z.string().startsWith("https")
z.string().endsWith(".com")
z.string().includes("@")
```

### 組み込みフォーマット（トップレベル関数）

```ts
// v4 ではトップレベル関数を推奨
z.email()           // メールアドレス
z.uuid()            // UUID（RFC 9562 準拠）
z.url()             // URL
z.ipv4()            // IPv4
z.ipv6()            // IPv6
z.cidrv4()          // CIDR v4
z.cidrv6()          // CIDR v6
z.base64()          // Base64
z.jwt()             // JWT
z.iso.datetime()    // ISO 日時
z.iso.date()        // ISO 日付
z.iso.time()        // ISO 時刻
z.iso.duration()    // ISO 期間
```

> **v4 変更点**: `z.string().email()` は引き続き動作するが、`z.email()` 等のトップレベル関数が推奨される。`.ip()` は `.ipv4()` / `.ipv6()` に分離された。

### 変換メソッド

```ts
z.string().trim()          // 前後の空白除去
z.string().toLowerCase()   // 小文字変換
z.string().toUpperCase()   // 大文字変換
z.string().normalize()     // Unicode 正規化
```

### テンプレートリテラル

```ts
const RouteSchema = z.templateLiteral(["/api/", z.string(), "/", z.int()]);
type Route = z.infer<typeof RouteSchema>; // `/api/${string}/${number}`
```

---

## 数値バリデーション

```ts
z.number().gt(0)           // より大きい
z.number().gte(0)          // 以上
z.number().lt(100)         // より小さい
z.number().lte(100)        // 以下
z.number().positive()      // > 0
z.number().nonnegative()   // >= 0
z.number().negative()      // < 0
z.number().nonpositive()   // <= 0
z.number().multipleOf(5)   // 倍数
z.number().finite()        // 有限数（v4 ではデフォルト）
```

> **v4 変更点**: `Infinity` / `-Infinity` はデフォルトで無効。`.safe()` は `.int()` と同様に浮動小数点を拒否する。

---

## ファイル型

```ts
// ファイルバリデーション
z.file()
  .min(1024)            // 最小サイズ（バイト）
  .max(5 * 1024 * 1024) // 最大サイズ（5MB）
  .type("image/png")    // MIME タイプ制約
```

---

## JSON 型

```ts
// JSON エンコード可能な値を検証
z.json()
```

---

## カスタム型

```ts
// 独自の型バリデーション
const PositiveIntSchema = z.custom<PositiveInt>(
  (val) => typeof val === "number" && val > 0 && Number.isInteger(val)
);

// instanceof チェック
const DateSchema = z.instanceof(Date);
```

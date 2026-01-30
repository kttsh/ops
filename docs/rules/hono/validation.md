# Hono バリデーション規約

## 概要

本ドキュメントは、Hono を使用した API におけるリクエストバリデーションの実装規約を定めます。
バリデーションには **Zod** と **@hono/zod-validator** を使用します。

---

## 基本方針

1. **すべてのエンドポイントの入力はバリデーションする**
2. **Zod Validator Middleware を使用する**（手動バリデーションは避ける）
3. **バリデーション対象ごとにスキーマを分離する**（json / query / param / header）
4. **スキーマは再利用可能な形で定義する**

---

## Zod Validator Middleware の基本

### インポート

```ts
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
```

### バリデーション対象

| 対象 | 説明 | 主な用途 |
|------|------|----------|
| `json` | リクエストボディ（JSON） | POST / PUT のボディ |
| `query` | クエリストリング | 一覧取得のフィルタ・ページネーション |
| `param` | パスパラメータ | リソース ID |
| `header` | リクエストヘッダ | 認証トークン、If-Match 等 |
| `form` | フォームデータ | ファイルアップロード等 |

### 基本的な使い方

```ts
// routes/projects.ts
import { zValidator } from '@hono/zod-validator'
import { createProjectSchema } from '../types/project'

app.post(
  '/',
  zValidator('json', createProjectSchema),
  (c) => {
    // バリデーション済みの値を取得
    const body = c.req.valid('json')
    // body.name は string 型として推論される
    return c.json({ data: body }, 201)
  }
)
```

---

## スキーマ定義のパターン

### ファイル配置

`folder-structure.md` に従い、スキーマは `src/types/` ディレクトリに配置する。

```
apps/backend/src/types/
├── project.ts          # リソース固有のスキーマと型定義
├── common.ts           # 共通パラメータスキーマ（ID等）
└── pagination.ts       # ページネーションスキーマ
```

### リソーススキーマの定義

`types/` ディレクトリにスキーマを定義し、ルートファイルからインポートする。

```ts
// types/project.ts
import { z } from 'zod'

// 基本スキーマ（DB のカラムに対応）
export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// 作成用スキーマ（id, timestamps は除外）
export const createProjectSchema = projectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

// 更新用スキーマ（すべてのフィールドを任意に）
export const updateProjectSchema = createProjectSchema.partial()

// 型のエクスポート
export type Project = z.infer<typeof projectSchema>
export type CreateProject = z.infer<typeof createProjectSchema>
export type UpdateProject = z.infer<typeof updateProjectSchema>
```

### パスパラメータのスキーマ

```ts
// types/common.ts
import { z } from 'zod'

// ID パラメータ（UUID 形式を期待）
export const idParamSchema = z.object({
  id: z.string().uuid(),
})

// ID パラメータ（文字列）
export const stringIdParamSchema = z.object({
  id: z.string().min(1),
})
```

### ページネーションのスキーマ

```ts
// types/pagination.ts
import { z } from 'zod'

export const paginationQuerySchema = z.object({
  'page[number]': z.coerce.number().int().min(1).default(1),
  'page[size]': z.coerce.number().int().min(1).max(1000).default(20),
})

// ソート付きページネーション
export const sortablePaginationQuerySchema = paginationQuerySchema.extend({
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
})
```

---

## 複数バリデーションの組み合わせ

1つのエンドポイントで複数のバリデーションを組み合わせる。

```ts
// routes/projects.ts
import { zValidator } from '@hono/zod-validator'
import { idParamSchema } from '../types/common'
import { paginationQuerySchema } from '../types/pagination'

app.get(
  '/:id/comments',
  zValidator('param', idParamSchema),
  zValidator('query', paginationQuerySchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const query = c.req.valid('query')
    // ...
  }
)
```

---

## クエリパラメータの型変換

クエリパラメータは常に `string` で送信されるため、`z.coerce` を使って型変換する。

```ts
const querySchema = z.object({
  // 数値変換（文字列 "10" → 数値 10）
  page: z.coerce.number().int().min(1).default(1),

  // ブーリアン変換
  includeDisabled: z.coerce.boolean().default(false),

  // 文字列はそのまま
  search: z.string().optional(),

  // 列挙型
  status: z.enum(['active', 'archived', 'draft']).optional(),
})
```

---

## カスタムバリデーションフック（`src/utils/validate.ts`）

バリデーションエラー時のレスポンスをカスタマイズする場合は、フック関数を利用する。
`docs/rules/hono/error-handling.md` の `zodValidatorWithHook` を参照。
この関数は `utils/` ディレクトリに配置し、全ルートファイルから共有する。

```ts
// utils/validate.ts
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

// エラー時に RFC 9457 形式で返すカスタムバリデータ
export const validate = <T extends z.ZodType>(
  target: 'json' | 'query' | 'param' | 'form' | 'header',
  schema: T
) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        pointer: `/${issue.path.join('/')}`,
        keyword: issue.code,
        message: issue.message,
        params: {},
      }))

      return c.json(
        {
          type: 'https://example.com/problems/validation-error',
          status: 422,
          title: 'Validation Error',
          detail: 'The request contains invalid parameters',
          instance: c.req.path,
          timestamp: new Date().toISOString(),
          errors,
        },
        { status: 422, headers: { 'Content-Type': 'application/problem+json' } }
      )
    }
  })
```

---

## ヘッダバリデーションの注意事項

`header` バリデーション時は、キー名を**小文字**で指定する。大文字はマッチしない。

```ts
// routes/projects.ts - ヘッダの If-Match を検証する
app.put(
  '/:id',
  zValidator('header', z.object({
    'if-match': z.string().min(1),  // 小文字で指定する
  })),
  zValidator('json', updateProjectSchema),
  async (c) => {
    const { 'if-match': etag } = c.req.valid('header')
    const body = c.req.valid('json')
    // ...
  }
)
```

---

## バリデーション規約のチェックリスト

- [ ] すべてのエンドポイントの入力に `zValidator` を適用している
- [ ] スキーマは `types/` ディレクトリに定義し再利用している
- [ ] クエリパラメータの数値変換に `z.coerce` を使用している
- [ ] ヘッダのバリデーションキーは小文字で指定している
- [ ] バリデーションエラーは RFC 9457 形式で返している
- [ ] POST/PUT のテストで `Content-Type: application/json` ヘッダを設定している

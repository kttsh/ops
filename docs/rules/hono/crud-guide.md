# Hono CRUD API 実装ガイド

## 概要

本ドキュメントは、Hono フレームワークを使用した CRUD（Create / Read / Update / Delete）API の実装規約を定めるものです。
`apps/backend` の実装時に本ガイドを遵守してください。

---

## 前提

- ランタイム: **Node.js**（`@hono/node-server` を使用）
- バリデーション: **Zod** + **@hono/zod-validator**
- テスト: **Vitest** + `app.request()` / `testClient`
- レスポンス形式: `docs/rules/api-response.md` に従う

---

## セットアップ

### 必須パッケージ

```bash
# Hono 本体
pnpm add hono

# Node.js アダプター
pnpm add @hono/node-server

# バリデーション
pnpm add zod @hono/zod-validator
```

### エントリーポイント（`src/index.ts`）

```ts
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'
import projects from './routes/projects'

// アプリケーション初期化
const app = new Hono()

// 共通ミドルウェア
app.use('*', logger())
app.use('*', cors())
app.use('*', prettyJSON())

// ルートのマウント
app.route('/projects', projects)

// サーバー起動
const port = Number(process.env.PORT) || 3000
console.log(`Server is running on http://localhost:${port}`)
serve({ fetch: app.fetch, port })

export default app
```

---

## ルーティング構成

### ファイル構造

`docs/rules/folder-structure.md` に従い、以下のようにファイルを分割する。

```
apps/backend/src
├── index.ts              # エントリーポイント
├── routes/               # エンドポイント定義
│   └── projects.ts       # /projects のルート定義
├── services/             # ビジネスロジック
│   └── projectService.ts
├── data/                 # DBアクセスとクエリ実行
│   └── projectData.ts
├── database/             # DB接続設定
│   └── client.ts
├── types/                # 共有型定義
│   └── project.ts
├── transform/            # データ変換処理
│   └── projectTransform.ts
└── utils/                # 汎用関数
    └── response.ts       # レスポンスヘルパー
```

### ルート定義の原則

Hono のベストプラクティスに従い、**コントローラークラスを作らず、ルートファイルにハンドラを直接記述する**。
これにより TypeScript の型推論（パスパラメータ等）が正しく機能する。

```ts
// routes/projects.ts
import { Hono } from 'hono'

// 新しい Hono インスタンスを作成（app.route() でマウントされる）
const app = new Hono()

// ハンドラを直接記述する（コントローラーを分離しない）
app.get('/', (c) => {
  // パスパラメータが正しく推論される
  return c.json({ data: [] })
})

export default app
```

### RPC を利用する場合のルート定義

RPC（型安全なクライアント）を使う場合は、**メソッドチェーン**でルートを定義し `AppType` をエクスポートする。

```ts
// routes/projects.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

// メソッドチェーンで定義（RPC の型推論に必須）
const app = new Hono()
  .get('/', (c) => {
    return c.json({ data: [] }, 200)
  })
  .post(
    '/',
    zValidator('json', z.object({ name: z.string() })),
    (c) => {
      const body = c.req.valid('json')
      return c.json({ data: { id: '1', name: body.name } }, 201)
    }
  )

export default app

// RPC 用に型をエクスポート
export type ProjectsRoute = typeof app
```

---

## 各層の責務と実装パターン

`folder-structure.md` に従い、CRUD 実装は以下の層に分離する。

| 層 | ディレクトリ | 責務 |
|---|---|---|
| **ルート** | `src/routes/` | エンドポイント定義、バリデーション、レスポンス返却 |
| **サービス** | `src/services/` | ビジネスロジック、ドメインルールの適用 |
| **データ** | `src/data/` | DBアクセスとクエリ実行 |
| **データベース** | `src/database/` | DB接続設定 |
| **型定義** | `src/types/` | Zod スキーマと型定義 |
| **変換** | `src/transform/` | DB 行 ↔ API レスポンスの変換処理 |
| **汎用関数** | `src/utils/` | レスポンスヘルパー、エラーヘルパー等 |

### データ層（`src/data/`）

DBアクセスとクエリ実行のみを担当する。ビジネスロジックは含めない。

```ts
// data/projectData.ts
import { db } from '../database/client'

export const projectData = {
  async findAll(page: number, pageSize: number) {
    const offset = (page - 1) * pageSize
    const items = await db
      .selectFrom('projects')
      .selectAll()
      .limit(pageSize)
      .offset(offset)
      .execute()

    const [{ count }] = await db
      .selectFrom('projects')
      .select(db.fn.countAll().as('count'))
      .execute()

    return { items, totalCount: Number(count) }
  },

  async findById(id: string) {
    return db
      .selectFrom('projects')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
  },

  async findByName(name: string) {
    return db
      .selectFrom('projects')
      .selectAll()
      .where('name', '=', name)
      .executeTakeFirst()
  },

  async create(data: { name: string; description?: string }) {
    return db
      .insertInto('projects')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow()
  },

  async update(id: string, data: { name?: string; description?: string }) {
    return db
      .updateTable('projects')
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
  },

  async delete(id: string) {
    return db
      .deleteFrom('projects')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
  },
}
```

### データ変換層（`src/transform/`）

DB の行データと API レスポンスの形式を変換する。

```ts
// transform/projectTransform.ts
import type { Project } from '../types/project'

// DB 行 → API レスポンス形式に変換
export function toProjectResponse(row: {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
```

### サービス層（`src/services/`）

ビジネスロジックを担当する。データ層を呼び出し、変換層でレスポンス形式に変換する。

```ts
// services/projectService.ts
import { HTTPException } from 'hono/http-exception'
import { projectData } from '../data/projectData'
import { toProjectResponse } from '../transform/projectTransform'

export const projectService = {
  async findAll(query: { page: number; pageSize: number }) {
    const result = await projectData.findAll(query.page, query.pageSize)
    return {
      items: result.items.map(toProjectResponse),
      totalCount: result.totalCount,
    }
  },

  async findById(id: string) {
    const project = await projectData.findById(id)
    if (!project) {
      throw new HTTPException(404, {
        message: `Project with ID '${id}' not found`,
      })
    }
    return toProjectResponse(project)
  },

  async create(data: { name: string; description?: string }) {
    const existing = await projectData.findByName(data.name)
    if (existing) {
      throw new HTTPException(409, {
        message: `Project with name '${data.name}' already exists`,
      })
    }
    const created = await projectData.create(data)
    return toProjectResponse(created)
  },

  async update(id: string, data: { name?: string; description?: string }) {
    const updated = await projectData.update(id, data)
    if (!updated) {
      throw new HTTPException(404, {
        message: `Project with ID '${id}' not found`,
      })
    }
    return toProjectResponse(updated)
  },

  async delete(id: string) {
    const deleted = await projectData.delete(id)
    if (!deleted) {
      throw new HTTPException(404, {
        message: `Project with ID '${id}' not found`,
      })
    }
  },
}
```

---

## CRUD 実装パターン（ルート層）

ルート層（`src/routes/`）では、バリデーションとレスポンス返却のみを行い、ビジネスロジックはサービス層に委譲する。

### 一覧取得（GET /resources）

```ts
// routes/projects.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { paginationQuerySchema } from '../types/pagination'
import { projectService } from '../services/projectService'

const app = new Hono()

app.get(
  '/',
  zValidator('query', paginationQuerySchema),
  async (c) => {
    const query = c.req.valid('query')
    const result = await projectService.findAll({
      page: query['page[number]'],
      pageSize: query['page[size]'],
    })

    return c.json({
      data: result.items,
      meta: {
        pagination: {
          currentPage: query['page[number]'],
          pageSize: query['page[size]'],
          totalItems: result.totalCount,
          totalPages: Math.ceil(result.totalCount / query['page[size]']),
        },
      },
    }, 200)
  }
)
```

### 単一取得（GET /resources/:id）

```ts
// routes/projects.ts（続き）
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  // サービス層が 404 を throw するため、ルート層でのエラーチェックは不要
  const project = await projectService.findById(id)
  return c.json({ data: project }, 200)
})
```

### 新規作成（POST /resources）

```ts
// routes/projects.ts（続き）
import { createProjectSchema } from '../types/project'

app.post(
  '/',
  zValidator('json', createProjectSchema),
  async (c) => {
    const body = c.req.valid('json')
    const created = await projectService.create(body)

    // Location ヘッダにリソースの URL を返す
    c.header('Location', `/projects/${created.id}`)

    return c.json({ data: created }, 201)
  }
)
```

### 更新（PUT /resources/:id）

```ts
// routes/projects.ts（続き）
import { updateProjectSchema } from '../types/project'

app.put(
  '/:id',
  zValidator('json', updateProjectSchema),
  async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    // サービス層が 404 を throw するため、ルート層でのエラーチェックは不要
    const updated = await projectService.update(id, body)
    return c.json({ data: updated }, 200)
  }
)
```

### 削除（DELETE /resources/:id）

```ts
// routes/projects.ts（続き）
app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  // サービス層が 404 を throw するため、ルート層でのエラーチェックは不要
  await projectService.delete(id)

  // ソフトデリートの場合も 204 No Content を返す
  return c.body(null, 204)
})
```

---

## ルートのマウント

```ts
// index.ts
import { Hono } from 'hono'
import projects from './routes/projects'
import users from './routes/users'

const app = new Hono()

// basePath で API バージョニングも可能
const api = new Hono().basePath('/api')
api.route('/projects', projects)
api.route('/users', users)

app.route('/', api)
```

---

## レスポンスの統一

### 成功レスポンス

`docs/rules/api-response.md` に従い、以下の形式で返す。

```ts
// 単一リソース
return c.json({ data: resource }, 200)

// 一覧（ページネーション付き）
return c.json({
  data: resources,
  meta: {
    pagination: { currentPage, pageSize, totalItems, totalPages },
  },
}, 200)

// 新規作成
c.header('Location', `/resources/${id}`)
return c.json({ data: created }, 201)

// 削除（コンテンツなし）
return c.body(null, 204)
```

### ステータスコードの明示

RPC の型推論を正しく機能させるため、`c.json()` の第2引数にステータスコードを**必ず明示する**。

```ts
// ステータスコードを必ず指定する
return c.json({ data: resource }, 200)     // OK
return c.json({ data: created }, 201)      // Created
return c.json({ error: 'not found' }, 404) // Not Found
```

---

## テスト

### 基本的なテストパターン（`app.request()`）

```ts
import { describe, test, expect } from 'vitest'
import app from '../routes/projects'

describe('Projects API', () => {
  test('GET / は一覧を返す', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty('data')
  })

  test('POST / は新規リソースを作成する', async () => {
    const res = await app.request('/', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Project' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toBeTruthy()
  })

  test('GET /:id で存在しないリソースは 404 を返す', async () => {
    const res = await app.request('/non-existent-id')
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })
})
```

### 型安全なテスト（`testClient`）

`testClient` を利用する場合、ルートは**メソッドチェーン**で定義する必要がある。

```ts
import { testClient } from 'hono/testing'
import app from '../routes/projects'

describe('Projects API (typed)', () => {
  const client = testClient(app)

  test('GET / は一覧を返す', async () => {
    const res = await client.index.$get()
    expect(res.status).toBe(200)
  })
})
```

### テスト時の注意事項

- `json` / `form` バリデーションのテスト時は、`Content-Type` ヘッダを**必ず設定する**。
- `header` バリデーションのテスト時は、キー名を**小文字**で指定する。

```ts
// JSON リクエストのテスト（Content-Type 必須）
const res = await app.request('/posts', {
  method: 'POST',
  body: JSON.stringify({ title: 'Hello' }),
  headers: new Headers({ 'Content-Type': 'application/json' }),
})
```

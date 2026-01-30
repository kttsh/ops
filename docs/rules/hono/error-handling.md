# Hono エラーハンドリング規約

## 概要

本ドキュメントは、Hono を使用した API におけるエラーハンドリングの実装規約を定めます。
エラーレスポンスの形式は `docs/rules/api-response.md` の **RFC 9457 Problem Details** 形式に準拠します。

---

## エラーレスポンス形式

すべてのエラーは **RFC 9457 Problem Details** 形式で返す。Content-Type は `application/problem+json` を使用する。

```ts
// types/problemDetail.ts - 型定義は types/ ディレクトリに配置する
type ProblemDetail = {
  type: string       // 問題タイプを識別する URI
  status: number     // HTTP ステータスコード
  title: string      // 問題タイプの要約（同一 type では固定）
  detail?: string    // この問題発生に特有の説明
  instance?: string  // この問題を一意に識別する URI（リクエストパス）
  requestId?: string // トレーシング用 ID
  timestamp?: string // ISO 8601 形式のタイムスタンプ
  errors?: Array<{   // バリデーションエラー詳細（任意）
    pointer: string
    keyword: string
    message: string
    params?: Record<string, unknown>
  }>
}
```

---

## HTTPException の使い方

Hono 組み込みの `HTTPException` を利用してエラーを投げる。

```ts
import { HTTPException } from 'hono/http-exception'

// 基本的な使い方
throw new HTTPException(401, { message: 'Unauthorized' })

// cause を付与してデバッグ情報を残す
app.post('/login', async (c) => {
  try {
    await authorize(c)
  } catch (cause) {
    throw new HTTPException(401, {
      message: 'Authentication failed',
      cause,
    })
  }
  return c.redirect('/')
})
```

---

## ファイル配置

`folder-structure.md` に従い、エラーハンドリング関連のファイルを以下のように配置する。

```
apps/backend/src
├── utils/
│   └── errorHelper.ts        # getProblemType, getStatusTitle 等のヘルパー
├── types/
│   └── problemDetail.ts      # ProblemDetail 型定義
└── index.ts                  # グローバルエラーハンドラの設定
```

---

## エラーヘルパー（`src/utils/errorHelper.ts`）

ステータスコードとRFC 9457のマッピングを `utils/` に配置する。

```ts
// utils/errorHelper.ts

// ステータスコードから問題タイプを取得
export function getProblemType(status: number): string {
  const map: Record<number, string> = {
    400: 'bad-request',
    401: 'unauthorized',
    403: 'forbidden',
    404: 'resource-not-found',
    409: 'conflict',
    412: 'precondition-failed',
    422: 'validation-error',
    428: 'precondition-required',
    429: 'rate-limit-exceeded',
    500: 'internal-error',
    503: 'service-unavailable',
  }
  return map[status] ?? 'internal-error'
}

// ステータスコードからタイトルを取得
export function getStatusTitle(status: number): string {
  const map: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Resource Not Found',
    409: 'Resource Conflict',
    412: 'Precondition Failed',
    422: 'Validation Error',
    428: 'Precondition Required',
    429: 'Rate Limit Exceeded',
    500: 'Internal Server Error',
    503: 'Service Unavailable',
  }
  return map[status] ?? 'Internal Server Error'
}
```

---

## グローバルエラーハンドラ（`src/index.ts`）

`app.onError` を使用して、すべての未捕捉エラーを RFC 9457 形式で統一的に処理する。
エントリーポイント（`src/index.ts`）に設定する。

```ts
// index.ts
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getProblemType, getStatusTitle } from './utils/errorHelper'

const app = new Hono()

// グローバルエラーハンドラ
app.onError((err, c) => {
  // HTTPException の場合
  if (err instanceof HTTPException) {
    const status = err.status

    return c.json(
      {
        type: `https://example.com/problems/${getProblemType(status)}`,
        status,
        title: getStatusTitle(status),
        detail: err.message,
        instance: c.req.path,
        timestamp: new Date().toISOString(),
      },
      { status, headers: { 'Content-Type': 'application/problem+json' } }
    )
  }

  // 予期しないエラーの場合
  console.error('Unexpected error:', err)

  return c.json(
    {
      type: 'https://example.com/problems/internal-error',
      status: 500,
      title: 'Internal Server Error',
      detail: 'An unexpected error occurred',
      instance: c.req.path,
      timestamp: new Date().toISOString(),
    },
    { status: 500, headers: { 'Content-Type': 'application/problem+json' } }
  )
})
```

---

## Not Found ハンドラ（`src/index.ts`）

`app.notFound` を使用して、存在しないルートへのアクセスを処理する。
グローバルエラーハンドラと同様に `src/index.ts` に設定する。

```ts
// index.ts（グローバルエラーハンドラと同じファイル）
app.notFound((c) => {
  return c.json(
    {
      type: 'https://example.com/problems/resource-not-found',
      status: 404,
      title: 'Resource Not Found',
      detail: `The requested resource '${c.req.path}' was not found`,
      instance: c.req.path,
      timestamp: new Date().toISOString(),
    },
    { status: 404, headers: { 'Content-Type': 'application/problem+json' } }
  )
})
```

**注意**: `app.notFound` はトップレベルの app でのみ呼び出される。サブルートには影響しない。

---

## バリデーションエラーのカスタムハンドリング（`src/utils/validate.ts`）

`@hono/zod-validator` のフック機能を使い、バリデーションエラーを RFC 9457 形式に変換する。
この関数は `utils/` ディレクトリに配置し、すべてのルートファイルから共有する。

```ts
// utils/validate.ts
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

// バリデーション用のカスタムフック
export const zodValidatorWithHook = <T extends z.ZodType>(
  target: 'json' | 'query' | 'param' | 'form' | 'header',
  schema: T
) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      // Zod エラーを RFC 9457 の errors 配列に変換
      const errors = result.error.issues.map((issue) => ({
        pointer: `/${issue.path.join('/')}`,
        keyword: issue.code,
        message: issue.message,
        params: 'expected' in issue ? { expected: issue.expected } : {},
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

// 使用例
app.post(
  '/',
  zodValidatorWithHook('json', z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  })),
  async (c) => {
    const body = c.req.valid('json')
    // ...
  }
)
```

---

## サービス層でのエラーハンドリング（`src/services/`）

サービス層（`src/services/`）では `HTTPException` を投げることでルート層に伝播させる。
サービス層はデータ層（`src/data/`）を呼び出し、ビジネスルールに基づいてエラーを判定する。

完全な実装例は `docs/rules/hono/crud-guide.md` のサービス層セクションを参照。

```ts
// services/projectService.ts
import { HTTPException } from 'hono/http-exception'
import { projectData } from '../data/projectData'

export const projectService = {
  async findById(id: string) {
    const project = await projectData.findById(id)
    if (!project) {
      throw new HTTPException(404, {
        message: `Project with ID '${id}' not found`,
      })
    }
    return project
  },

  async create(data: { name: string; description?: string }) {
    // ビジネスルール: 名前の重複チェック
    const existing = await projectData.findByName(data.name)
    if (existing) {
      throw new HTTPException(409, {
        message: `Project with name '${data.name}' already exists`,
      })
    }
    return projectData.create(data)
  },
}
```

---

## エラーハンドリングのチェックリスト

- [ ] グローバルエラーハンドラ (`app.onError`) を設定している
- [ ] Not Found ハンドラ (`app.notFound`) を設定している
- [ ] すべてのエラーレスポンスが RFC 9457 形式に準拠している
- [ ] バリデーションエラーは `errors` 配列に詳細を含めている
- [ ] Content-Type に `application/problem+json` を設定している
- [ ] 予期しないエラーでは内部情報を漏洩させていない
- [ ] サービス層のエラーは `HTTPException` で伝播させている

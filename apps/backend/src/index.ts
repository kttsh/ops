import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'
import { HTTPException } from 'hono/http-exception'
import { problemResponse, getProblemType, getStatusTitle } from '@/utils/errorHelper'
import type { StatusCode } from 'hono/utils/http-status'
import businessUnits from '@/routes/businessUnits'
import projectTypes from '@/routes/projectTypes'
import workTypes from '@/routes/workTypes'
import projectCases from '@/routes/projectCases'
import headcountPlanCases from '@/routes/headcountPlanCases'

const app = new Hono()

// 共通ミドルウェア
app.use('*', logger())
app.use('*', cors())
app.use('*', prettyJSON())

// グローバルエラーハンドラ
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    const status = err.status as StatusCode

    return problemResponse(c, {
      type: `https://example.com/problems/${getProblemType(status)}`,
      status,
      title: getStatusTitle(status),
      detail: err.message,
      instance: c.req.path,
      timestamp: new Date().toISOString(),
    }, status)
  }

  console.error('Unexpected error:', err)

  return problemResponse(c, {
    type: 'https://example.com/problems/internal-error',
    status: 500,
    title: 'Internal Server Error',
    detail: 'An unexpected error occurred',
    instance: c.req.path,
    timestamp: new Date().toISOString(),
  }, 500)
})

// ルートのマウント
app.route('/business-units', businessUnits)
app.route('/project-types', projectTypes)
app.route('/work-types', workTypes)
app.route('/projects/:projectId/project-cases', projectCases)
app.route('/headcount-plan-cases', headcountPlanCases)

// Not Found ハンドラ
app.notFound((c) => {
  return problemResponse(c, {
    type: 'https://example.com/problems/resource-not-found',
    status: 404,
    title: 'Resource Not Found',
    detail: `The requested resource '${c.req.path}' was not found`,
    instance: c.req.path,
    timestamp: new Date().toISOString(),
  }, 404)
})

// サーバー起動（テスト時はインポートのみ使用）
if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT) || 3000
  console.log(`Server is running on http://localhost:${port}`)
  serve({ fetch: app.fetch, port })
}

export default app

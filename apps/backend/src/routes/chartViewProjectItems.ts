import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { chartViewProjectItemService } from '@/services/chartViewProjectItemService'
import { validate } from '@/utils/validate'
import {
  createChartViewProjectItemSchema,
  updateChartViewProjectItemSchema,
  updateDisplayOrderSchema,
} from '@/types/chartViewProjectItem'

function parseIntParam(value: string, name: string): number {
  const parsed = parseInt(value, 10)
  if (isNaN(parsed) || parsed <= 0) {
    throw new HTTPException(422, {
      message: `Invalid ${name}: must be a positive integer`,
    })
  }
  return parsed
}

const app = new Hono()
  // GET / - 一覧取得
  .get('/', async (c) => {
    const chartViewId = parseIntParam(c.req.param('chartViewId'), 'chartViewId')
    const items = await chartViewProjectItemService.findAll(chartViewId)
    return c.json({ data: items }, 200)
  })
  // PUT /display-order - 一括表示順序更新（/:id より前に定義）
  .put(
    '/display-order',
    validate('json', updateDisplayOrderSchema),
    async (c) => {
      const chartViewId = parseIntParam(c.req.param('chartViewId'), 'chartViewId')
      const body = c.req.valid('json')
      const items = await chartViewProjectItemService.updateDisplayOrder(chartViewId, body)
      return c.json({ data: items }, 200)
    },
  )
  // GET /:id - 単一取得
  .get('/:id', async (c) => {
    const chartViewId = parseIntParam(c.req.param('chartViewId'), 'chartViewId')
    const id = parseIntParam(c.req.param('id'), 'id')
    const item = await chartViewProjectItemService.findById(chartViewId, id)
    return c.json({ data: item }, 200)
  })
  // POST / - 新規作成
  .post(
    '/',
    validate('json', createChartViewProjectItemSchema),
    async (c) => {
      const chartViewId = parseIntParam(c.req.param('chartViewId'), 'chartViewId')
      const body = c.req.valid('json')
      const created = await chartViewProjectItemService.create(chartViewId, body)
      c.header('Location', `/chart-views/${chartViewId}/project-items/${created.chartViewProjectItemId}`)
      return c.json({ data: created }, 201)
    },
  )
  // PUT /:id - 更新
  .put(
    '/:id',
    validate('json', updateChartViewProjectItemSchema),
    async (c) => {
      const chartViewId = parseIntParam(c.req.param('chartViewId'), 'chartViewId')
      const id = parseIntParam(c.req.param('id'), 'id')
      const body = c.req.valid('json')
      const updated = await chartViewProjectItemService.update(chartViewId, id, body)
      return c.json({ data: updated }, 200)
    },
  )
  // DELETE /:id - 物理削除
  .delete('/:id', async (c) => {
    const chartViewId = parseIntParam(c.req.param('chartViewId'), 'chartViewId')
    const id = parseIntParam(c.req.param('id'), 'id')
    await chartViewProjectItemService.delete(chartViewId, id)
    return c.body(null, 204)
  })

export default app

export type ChartViewProjectItemsRoute = typeof app

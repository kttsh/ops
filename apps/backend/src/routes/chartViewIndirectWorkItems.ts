import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { chartViewIndirectWorkItemService } from '@/services/chartViewIndirectWorkItemService'
import { validate } from '@/utils/validate'
import {
  createChartViewIndirectWorkItemSchema,
  updateChartViewIndirectWorkItemSchema,
} from '@/types/chartViewIndirectWorkItem'

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
    const items = await chartViewIndirectWorkItemService.findAll(chartViewId)
    return c.json({ data: items }, 200)
  })
  // GET /:chartViewIndirectWorkItemId - 単一取得
  .get('/:chartViewIndirectWorkItemId', async (c) => {
    const chartViewId = parseIntParam(c.req.param('chartViewId'), 'chartViewId')
    const id = parseIntParam(c.req.param('chartViewIndirectWorkItemId'), 'chartViewIndirectWorkItemId')
    const item = await chartViewIndirectWorkItemService.findById(chartViewId, id)
    return c.json({ data: item }, 200)
  })
  // POST / - 新規作成
  .post(
    '/',
    validate('json', createChartViewIndirectWorkItemSchema),
    async (c) => {
      const chartViewId = parseIntParam(c.req.param('chartViewId'), 'chartViewId')
      const body = c.req.valid('json')
      const created = await chartViewIndirectWorkItemService.create(chartViewId, body)
      c.header('Location', `/chart-views/${chartViewId}/indirect-work-items/${created.chartViewIndirectWorkItemId}`)
      return c.json({ data: created }, 201)
    },
  )
  // PUT /:chartViewIndirectWorkItemId - 更新
  .put(
    '/:chartViewIndirectWorkItemId',
    validate('json', updateChartViewIndirectWorkItemSchema),
    async (c) => {
      const chartViewId = parseIntParam(c.req.param('chartViewId'), 'chartViewId')
      const id = parseIntParam(c.req.param('chartViewIndirectWorkItemId'), 'chartViewIndirectWorkItemId')
      const body = c.req.valid('json')
      const updated = await chartViewIndirectWorkItemService.update(chartViewId, id, body)
      return c.json({ data: updated }, 200)
    },
  )
  // DELETE /:chartViewIndirectWorkItemId - 物理削除
  .delete('/:chartViewIndirectWorkItemId', async (c) => {
    const chartViewId = parseIntParam(c.req.param('chartViewId'), 'chartViewId')
    const id = parseIntParam(c.req.param('chartViewIndirectWorkItemId'), 'chartViewIndirectWorkItemId')
    await chartViewIndirectWorkItemService.delete(chartViewId, id)
    return c.body(null, 204)
  })

export default app

export type ChartViewIndirectWorkItemsRoute = typeof app

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { monthlyCapacityService } from '@/services/monthlyCapacityService'
import { validate } from '@/utils/validate'
import {
  createMonthlyCapacitySchema,
  updateMonthlyCapacitySchema,
  bulkUpsertMonthlyCapacitySchema,
} from '@/types/monthlyCapacity'

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
    const capacityScenarioId = parseIntParam(c.req.param('capacityScenarioId'), 'capacityScenarioId')
    const items = await monthlyCapacityService.findAll(capacityScenarioId)
    return c.json({ data: items }, 200)
  })
  // PUT /bulk - バルク Upsert（/:monthlyCapacityId より前に定義）
  .put(
    '/bulk',
    validate('json', bulkUpsertMonthlyCapacitySchema),
    async (c) => {
      const capacityScenarioId = parseIntParam(c.req.param('capacityScenarioId'), 'capacityScenarioId')
      const body = c.req.valid('json')
      const items = await monthlyCapacityService.bulkUpsert(capacityScenarioId, body)
      return c.json({ data: items }, 200)
    },
  )
  // GET /:monthlyCapacityId - 単一取得
  .get('/:monthlyCapacityId', async (c) => {
    const capacityScenarioId = parseIntParam(c.req.param('capacityScenarioId'), 'capacityScenarioId')
    const monthlyCapacityId = parseIntParam(c.req.param('monthlyCapacityId'), 'monthlyCapacityId')
    const monthlyCapacity = await monthlyCapacityService.findById(capacityScenarioId, monthlyCapacityId)
    return c.json({ data: monthlyCapacity }, 200)
  })
  // POST / - 新規作成
  .post(
    '/',
    validate('json', createMonthlyCapacitySchema),
    async (c) => {
      const capacityScenarioId = parseIntParam(c.req.param('capacityScenarioId'), 'capacityScenarioId')
      const body = c.req.valid('json')
      const created = await monthlyCapacityService.create(capacityScenarioId, body)
      c.header('Location', `/capacity-scenarios/${capacityScenarioId}/monthly-capacities/${created.monthlyCapacityId}`)
      return c.json({ data: created }, 201)
    },
  )
  // PUT /:monthlyCapacityId - 更新
  .put(
    '/:monthlyCapacityId',
    validate('json', updateMonthlyCapacitySchema),
    async (c) => {
      const capacityScenarioId = parseIntParam(c.req.param('capacityScenarioId'), 'capacityScenarioId')
      const monthlyCapacityId = parseIntParam(c.req.param('monthlyCapacityId'), 'monthlyCapacityId')
      const body = c.req.valid('json')
      const updated = await monthlyCapacityService.update(capacityScenarioId, monthlyCapacityId, body)
      return c.json({ data: updated }, 200)
    },
  )
  // DELETE /:monthlyCapacityId - 物理削除
  .delete('/:monthlyCapacityId', async (c) => {
    const capacityScenarioId = parseIntParam(c.req.param('capacityScenarioId'), 'capacityScenarioId')
    const monthlyCapacityId = parseIntParam(c.req.param('monthlyCapacityId'), 'monthlyCapacityId')
    await monthlyCapacityService.delete(capacityScenarioId, monthlyCapacityId)
    return c.body(null, 204)
  })

export default app

export type MonthlyCapacitiesRoute = typeof app

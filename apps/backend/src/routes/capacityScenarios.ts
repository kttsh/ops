import { Hono } from 'hono'
import { capacityScenarioService } from '@/services/capacityScenarioService'
import { validate } from '@/utils/validate'
import {
  capacityScenarioListQuerySchema,
  createCapacityScenarioSchema,
  updateCapacityScenarioSchema,
} from '@/types/capacityScenario'

const app = new Hono()
  // GET / - 一覧取得
  .get(
    '/',
    validate('query', capacityScenarioListQuerySchema),
    async (c) => {
      const query = c.req.valid('query')
      const result = await capacityScenarioService.findAll({
        page: query['page[number]'],
        pageSize: query['page[size]'],
        includeDisabled: query['filter[includeDisabled]'],
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
    },
  )
  // GET /:id - 単一取得
  .get('/:id', async (c) => {
    const id = Number(c.req.param('id'))
    const capacityScenario = await capacityScenarioService.findById(id)
    return c.json({ data: capacityScenario }, 200)
  })
  // POST / - 新規作成
  .post(
    '/',
    validate('json', createCapacityScenarioSchema),
    async (c) => {
      const body = c.req.valid('json')
      const created = await capacityScenarioService.create(body)
      c.header('Location', `/capacity-scenarios/${created.capacityScenarioId}`)
      return c.json({ data: created }, 201)
    },
  )
  // PUT /:id - 更新
  .put(
    '/:id',
    validate('json', updateCapacityScenarioSchema),
    async (c) => {
      const id = Number(c.req.param('id'))
      const body = c.req.valid('json')
      const updated = await capacityScenarioService.update(id, body)
      return c.json({ data: updated }, 200)
    },
  )
  // DELETE /:id - 論理削除
  .delete('/:id', async (c) => {
    const id = Number(c.req.param('id'))
    await capacityScenarioService.delete(id)
    return c.body(null, 204)
  })
  // POST /:id/actions/restore - 復元
  .post('/:id/actions/restore', async (c) => {
    const id = Number(c.req.param('id'))
    const restored = await capacityScenarioService.restore(id)
    return c.json({ data: restored }, 200)
  })

export default app

export type CapacityScenariosRoute = typeof app

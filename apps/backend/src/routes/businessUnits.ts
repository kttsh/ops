import { Hono } from 'hono'
import { businessUnitService } from '@/services/businessUnitService'
import { validate } from '@/utils/validate'
import {
  businessUnitListQuerySchema,
  createBusinessUnitSchema,
  updateBusinessUnitSchema,
} from '@/types/businessUnit'

const app = new Hono()
  // GET / - 一覧取得
  .get(
    '/',
    validate('query', businessUnitListQuerySchema),
    async (c) => {
      const query = c.req.valid('query')
      const result = await businessUnitService.findAll({
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
  // GET /:businessUnitCode - 単一取得
  .get('/:businessUnitCode', async (c) => {
    const code = c.req.param('businessUnitCode')
    const businessUnit = await businessUnitService.findByCode(code)
    return c.json({ data: businessUnit }, 200)
  })
  // POST / - 新規作成
  .post(
    '/',
    validate('json', createBusinessUnitSchema),
    async (c) => {
      const body = c.req.valid('json')
      const created = await businessUnitService.create(body)
      c.header('Location', `/business-units/${created.businessUnitCode}`)
      return c.json({ data: created }, 201)
    },
  )
  // PUT /:businessUnitCode - 更新
  .put(
    '/:businessUnitCode',
    validate('json', updateBusinessUnitSchema),
    async (c) => {
      const code = c.req.param('businessUnitCode')
      const body = c.req.valid('json')
      const updated = await businessUnitService.update(code, body)
      return c.json({ data: updated }, 200)
    },
  )
  // DELETE /:businessUnitCode - 論理削除
  .delete('/:businessUnitCode', async (c) => {
    const code = c.req.param('businessUnitCode')
    await businessUnitService.delete(code)
    return c.body(null, 204)
  })
  // POST /:businessUnitCode/actions/restore - 復元
  .post('/:businessUnitCode/actions/restore', async (c) => {
    const code = c.req.param('businessUnitCode')
    const restored = await businessUnitService.restore(code)
    return c.json({ data: restored }, 200)
  })

export default app

export type BusinessUnitsRoute = typeof app

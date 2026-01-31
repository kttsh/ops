import { Hono } from 'hono'
import { headcountPlanCaseService } from '@/services/headcountPlanCaseService'
import { validate } from '@/utils/validate'
import {
  headcountPlanCaseListQuerySchema,
  createHeadcountPlanCaseSchema,
  updateHeadcountPlanCaseSchema,
} from '@/types/headcountPlanCase'

const app = new Hono()
  // GET / - 一覧取得
  .get(
    '/',
    validate('query', headcountPlanCaseListQuerySchema),
    async (c) => {
      const query = c.req.valid('query')
      const result = await headcountPlanCaseService.findAll({
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
    const headcountPlanCase = await headcountPlanCaseService.findById(id)
    return c.json({ data: headcountPlanCase }, 200)
  })
  // POST / - 新規作成
  .post(
    '/',
    validate('json', createHeadcountPlanCaseSchema),
    async (c) => {
      const body = c.req.valid('json')
      const created = await headcountPlanCaseService.create(body)
      c.header('Location', `/headcount-plan-cases/${created.headcountPlanCaseId}`)
      return c.json({ data: created }, 201)
    },
  )
  // PUT /:id - 更新
  .put(
    '/:id',
    validate('json', updateHeadcountPlanCaseSchema),
    async (c) => {
      const id = Number(c.req.param('id'))
      const body = c.req.valid('json')
      const updated = await headcountPlanCaseService.update(id, body)
      return c.json({ data: updated }, 200)
    },
  )
  // DELETE /:id - 論理削除
  .delete('/:id', async (c) => {
    const id = Number(c.req.param('id'))
    await headcountPlanCaseService.delete(id)
    return c.body(null, 204)
  })
  // POST /:id/actions/restore - 復元
  .post('/:id/actions/restore', async (c) => {
    const id = Number(c.req.param('id'))
    const restored = await headcountPlanCaseService.restore(id)
    return c.json({ data: restored }, 200)
  })

export default app

export type HeadcountPlanCasesRoute = typeof app

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { projectService } from '@/services/projectService'
import { validate } from '@/utils/validate'
import {
  projectListQuerySchema,
  createProjectSchema,
  updateProjectSchema,
} from '@/types/project'

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
  .get(
    '/',
    validate('query', projectListQuerySchema),
    async (c) => {
      const query = c.req.valid('query')
      const result = await projectService.findAll({
        page: query['page[number]'],
        pageSize: query['page[size]'],
        includeDisabled: query['filter[includeDisabled]'],
        businessUnitCode: query['filter[businessUnitCode]'],
        status: query['filter[status]'],
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
    const id = parseIntParam(c.req.param('id'), 'id')
    const project = await projectService.findById(id)
    return c.json({ data: project }, 200)
  })
  // POST / - 新規作成
  .post(
    '/',
    validate('json', createProjectSchema),
    async (c) => {
      const body = c.req.valid('json')
      const created = await projectService.create(body)
      c.header('Location', `/projects/${created.projectId}`)
      return c.json({ data: created }, 201)
    },
  )
  // PUT /:id - 更新
  .put(
    '/:id',
    validate('json', updateProjectSchema),
    async (c) => {
      const id = parseIntParam(c.req.param('id'), 'id')
      const body = c.req.valid('json')
      const updated = await projectService.update(id, body)
      return c.json({ data: updated }, 200)
    },
  )
  // DELETE /:id - 論理削除
  .delete('/:id', async (c) => {
    const id = parseIntParam(c.req.param('id'), 'id')
    await projectService.delete(id)
    return c.body(null, 204)
  })
  // POST /:id/actions/restore - 復元
  .post('/:id/actions/restore', async (c) => {
    const id = parseIntParam(c.req.param('id'), 'id')
    const restored = await projectService.restore(id)
    return c.json({ data: restored }, 200)
  })

export default app

export type ProjectsRoute = typeof app

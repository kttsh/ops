import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { standardEffortMasterService } from '@/services/standardEffortMasterService'
import { validate } from '@/utils/validate'
import {
  standardEffortMasterListQuerySchema,
  createStandardEffortMasterSchema,
  updateStandardEffortMasterSchema,
} from '@/types/standardEffortMaster'

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
  .get(
    '/',
    validate('query', standardEffortMasterListQuerySchema),
    async (c) => {
      const query = c.req.valid('query')
      const result = await standardEffortMasterService.findAll({
        page: query['page[number]'],
        pageSize: query['page[size]'],
        includeDisabled: query['filter[includeDisabled]'],
        businessUnitCode: query['filter[businessUnitCode]'],
        projectTypeCode: query['filter[projectTypeCode]'],
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
  .get('/:id', async (c) => {
    const id = parseIntParam(c.req.param('id'), 'id')
    const master = await standardEffortMasterService.findById(id)
    return c.json({ data: master }, 200)
  })
  .post(
    '/',
    validate('json', createStandardEffortMasterSchema),
    async (c) => {
      const body = c.req.valid('json')
      const created = await standardEffortMasterService.create(body)
      c.header('Location', `/standard-effort-masters/${created.standardEffortId}`)
      return c.json({ data: created }, 201)
    },
  )
  .put(
    '/:id',
    validate('json', updateStandardEffortMasterSchema),
    async (c) => {
      const id = parseIntParam(c.req.param('id'), 'id')
      const body = c.req.valid('json')
      const updated = await standardEffortMasterService.update(id, body)
      return c.json({ data: updated }, 200)
    },
  )
  .delete('/:id', async (c) => {
    const id = parseIntParam(c.req.param('id'), 'id')
    await standardEffortMasterService.delete(id)
    return c.body(null, 204)
  })
  .post('/:id/actions/restore', async (c) => {
    const id = parseIntParam(c.req.param('id'), 'id')
    const restored = await standardEffortMasterService.restore(id)
    return c.json({ data: restored }, 200)
  })

export default app

export type StandardEffortMastersRoute = typeof app

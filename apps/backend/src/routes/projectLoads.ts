import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { projectLoadService } from '@/services/projectLoadService'
import { validate } from '@/utils/validate'
import {
  createProjectLoadSchema,
  updateProjectLoadSchema,
  bulkUpsertProjectLoadSchema,
} from '@/types/projectLoad'

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
    const projectCaseId = parseIntParam(c.req.param('projectCaseId'), 'projectCaseId')
    const items = await projectLoadService.findAll(projectCaseId)
    return c.json({ data: items }, 200)
  })
  // PUT /bulk - バルク Upsert（/:projectLoadId より前に定義）
  .put(
    '/bulk',
    validate('json', bulkUpsertProjectLoadSchema),
    async (c) => {
      const projectCaseId = parseIntParam(c.req.param('projectCaseId'), 'projectCaseId')
      const body = c.req.valid('json')
      const items = await projectLoadService.bulkUpsert(projectCaseId, body)
      return c.json({ data: items }, 200)
    },
  )
  // GET /:projectLoadId - 単一取得
  .get('/:projectLoadId', async (c) => {
    const projectCaseId = parseIntParam(c.req.param('projectCaseId'), 'projectCaseId')
    const projectLoadId = parseIntParam(c.req.param('projectLoadId'), 'projectLoadId')
    const projectLoad = await projectLoadService.findById(projectCaseId, projectLoadId)
    return c.json({ data: projectLoad }, 200)
  })
  // POST / - 新規作成
  .post(
    '/',
    validate('json', createProjectLoadSchema),
    async (c) => {
      const projectCaseId = parseIntParam(c.req.param('projectCaseId'), 'projectCaseId')
      const body = c.req.valid('json')
      const created = await projectLoadService.create(projectCaseId, body)
      c.header('Location', `/project-cases/${projectCaseId}/project-loads/${created.projectLoadId}`)
      return c.json({ data: created }, 201)
    },
  )
  // PUT /:projectLoadId - 更新
  .put(
    '/:projectLoadId',
    validate('json', updateProjectLoadSchema),
    async (c) => {
      const projectCaseId = parseIntParam(c.req.param('projectCaseId'), 'projectCaseId')
      const projectLoadId = parseIntParam(c.req.param('projectLoadId'), 'projectLoadId')
      const body = c.req.valid('json')
      const updated = await projectLoadService.update(projectCaseId, projectLoadId, body)
      return c.json({ data: updated }, 200)
    },
  )
  // DELETE /:projectLoadId - 物理削除
  .delete('/:projectLoadId', async (c) => {
    const projectCaseId = parseIntParam(c.req.param('projectCaseId'), 'projectCaseId')
    const projectLoadId = parseIntParam(c.req.param('projectLoadId'), 'projectLoadId')
    await projectLoadService.delete(projectCaseId, projectLoadId)
    return c.body(null, 204)
  })

export default app

export type ProjectLoadsRoute = typeof app

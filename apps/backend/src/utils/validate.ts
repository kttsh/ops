import { zValidator } from '@hono/zod-validator'
import type { z } from 'zod'
import { problemResponse } from '@/utils/errorHelper'

export const validate = <T extends z.ZodType>(
  target: 'json' | 'query' | 'param' | 'form' | 'header',
  schema: T,
) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        pointer: `/${issue.path.join('/')}`,
        keyword: issue.code,
        message: issue.message,
        params: 'expected' in issue ? { expected: issue.expected } : {},
      }))

      return problemResponse(
        c,
        {
          type: 'https://example.com/problems/validation-error',
          status: 422,
          title: 'Validation Error',
          detail: 'The request contains invalid parameters',
          instance: c.req.path,
          timestamp: new Date().toISOString(),
          errors,
        },
        422,
      )
    }
  })

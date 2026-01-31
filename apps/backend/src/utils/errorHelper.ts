import type { Context } from 'hono'
import type { ProblemDetail } from '@/types/problemDetail'
import type { StatusCode } from 'hono/utils/http-status'

export function problemResponse(c: Context, body: ProblemDetail, status: StatusCode): Response {
  c.header('Content-Type', 'application/problem+json')
  return c.body(JSON.stringify(body), status)
}

export function getProblemType(status: number): string {
  const map: Record<number, string> = {
    400: 'bad-request',
    401: 'unauthorized',
    403: 'forbidden',
    404: 'resource-not-found',
    409: 'conflict',
    412: 'precondition-failed',
    422: 'validation-error',
    428: 'precondition-required',
    429: 'rate-limit-exceeded',
    500: 'internal-error',
    503: 'service-unavailable',
  }
  return map[status] ?? 'internal-error'
}

export function getStatusTitle(status: number): string {
  const map: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Resource Not Found',
    409: 'Resource Conflict',
    412: 'Precondition Failed',
    422: 'Validation Error',
    428: 'Precondition Required',
    429: 'Rate Limit Exceeded',
    500: 'Internal Server Error',
    503: 'Service Unavailable',
  }
  return map[status] ?? 'Internal Server Error'
}

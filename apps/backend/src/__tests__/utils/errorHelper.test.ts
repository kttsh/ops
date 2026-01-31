import { describe, test, expect } from 'vitest'
import { getProblemType, getStatusTitle } from '@/utils/errorHelper'

describe('getProblemType', () => {
  test.each([
    [400, 'bad-request'],
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'resource-not-found'],
    [409, 'conflict'],
    [412, 'precondition-failed'],
    [422, 'validation-error'],
    [428, 'precondition-required'],
    [429, 'rate-limit-exceeded'],
    [500, 'internal-error'],
    [503, 'service-unavailable'],
  ])('ステータスコード %i に対して "%s" を返す', (status, expected) => {
    expect(getProblemType(status)).toBe(expected)
  })

  test('未定義のステータスコードに対して "internal-error" を返す', () => {
    expect(getProblemType(418)).toBe('internal-error')
    expect(getProblemType(999)).toBe('internal-error')
  })
})

describe('getStatusTitle', () => {
  test.each([
    [400, 'Bad Request'],
    [401, 'Unauthorized'],
    [403, 'Forbidden'],
    [404, 'Resource Not Found'],
    [409, 'Resource Conflict'],
    [412, 'Precondition Failed'],
    [422, 'Validation Error'],
    [428, 'Precondition Required'],
    [429, 'Rate Limit Exceeded'],
    [500, 'Internal Server Error'],
    [503, 'Service Unavailable'],
  ])('ステータスコード %i に対して "%s" を返す', (status, expected) => {
    expect(getStatusTitle(status)).toBe(expected)
  })

  test('未定義のステータスコードに対して "Internal Server Error" を返す', () => {
    expect(getStatusTitle(418)).toBe('Internal Server Error')
    expect(getStatusTitle(999)).toBe('Internal Server Error')
  })
})

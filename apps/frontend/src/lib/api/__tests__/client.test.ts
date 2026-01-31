import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiError, handleResponse } from '../client'
import type { ProblemDetails } from '../types'

describe('ApiError', () => {
  it('ProblemDetails からインスタンスを生成できる', () => {
    const problemDetails: ProblemDetails = {
      type: 'about:blank',
      status: 404,
      title: 'Not Found',
      detail: 'リソースが見つかりません',
    }
    const error = new ApiError(problemDetails)

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.name).toBe('ApiError')
    expect(error.message).toBe('リソースが見つかりません')
    expect(error.problemDetails).toBe(problemDetails)
  })

  it('errors フィールド付きの ProblemDetails を保持できる', () => {
    const problemDetails: ProblemDetails = {
      type: 'about:blank',
      status: 422,
      title: 'Unprocessable Entity',
      detail: 'バリデーションエラー',
      errors: [
        { field: 'name', message: '名称は必須です' },
      ],
    }
    const error = new ApiError(problemDetails)

    expect(error.problemDetails.errors).toHaveLength(1)
    expect(error.problemDetails.errors![0].field).toBe('name')
  })
})

describe('handleResponse', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('200 レスポンスからJSONを返す', async () => {
    const body = { data: { id: 1, name: 'test' } }
    const response = new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

    const result = await handleResponse<typeof body>(response)
    expect(result).toEqual(body)
  })

  it('204 レスポンスで undefined を返す', async () => {
    const response = new Response(null, { status: 204 })

    const result = await handleResponse<void>(response)
    expect(result).toBeUndefined()
  })

  it('4xx レスポンスで ApiError をスローする', async () => {
    const problemDetails: ProblemDetails = {
      type: 'about:blank',
      status: 409,
      title: 'Conflict',
      detail: '重複エラー',
    }
    const response = new Response(JSON.stringify(problemDetails), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    })

    await expect(handleResponse(response)).rejects.toThrow(ApiError)
    try {
      await handleResponse(response.clone ? new Response(JSON.stringify(problemDetails), { status: 409 }) : response)
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).problemDetails.status).toBe(409)
    }
  })

  it('5xx レスポンスで ApiError をスローする', async () => {
    const problemDetails: ProblemDetails = {
      type: 'about:blank',
      status: 500,
      title: 'Internal Server Error',
      detail: 'サーバーエラー',
    }
    const response = new Response(JSON.stringify(problemDetails), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })

    await expect(handleResponse(response)).rejects.toThrow(ApiError)
  })
})

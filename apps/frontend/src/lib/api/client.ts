import type { ProblemDetails } from './types'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiError extends Error {
  readonly problemDetails: ProblemDetails

  constructor(problemDetails: ProblemDetails) {
    super(problemDetails.detail)
    this.name = 'ApiError'
    this.problemDetails = problemDetails
  }
}

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const problemDetails: ProblemDetails = await response.json()
    throw new ApiError(problemDetails)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return response.json() as Promise<T>
}

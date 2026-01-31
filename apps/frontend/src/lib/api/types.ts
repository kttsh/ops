// --- API 共通レスポンス型 ---

export type PaginatedResponse<T> = {
  data: T[]
  meta: {
    pagination: {
      currentPage: number
      pageSize: number
      totalItems: number
      totalPages: number
    }
  }
}

export type SingleResponse<T> = {
  data: T
}

export type ProblemDetails = {
  type: string
  status: number
  title: string
  detail: string
  instance?: string
  errors?: Array<{
    field: string
    message: string
  }>
}

export type SelectOption = {
  value: string
  label: string
}

export type ApiResponse<T> = {
  ok: boolean
  data: T
  message?: string
  errors?: string[]
}

export type ApiError = {
  message: string
  code?: string
  details?: string[]
}

export type Pagination = {
  page: number
  pageSize: number
  total: number
}

export type SelectOption<T = string> = {
  label: string
  value: T
}

export type BaseEntity = {
  id: string | number
  createdAt?: string
  updatedAt?: string
}

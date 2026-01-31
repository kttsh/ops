import { z } from 'zod'

// --- 共通型を共有レイヤーから re-export ---
export type {
  PaginatedResponse,
  SingleResponse,
  ProblemDetails,
  SelectOption,
} from '@/lib/api'

// --- API レスポンス型 ---

export type BusinessUnit = {
  businessUnitCode: string
  name: string
  displayOrder: number
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

// --- Zod スキーマ ---

export const createBusinessUnitSchema = z.object({
  businessUnitCode: z
    .string()
    .min(1, 'ビジネスユニットコードは必須です')
    .max(20, 'ビジネスユニットコードは20文字以内で入力してください')
    .regex(/^[a-zA-Z0-9_-]+$/, '英数字・ハイフン・アンダースコアのみ使用できます'),
  name: z
    .string()
    .min(1, '名称は必須です')
    .max(100, '名称は100文字以内で入力してください'),
  displayOrder: z
    .number()
    .int('表示順は整数で入力してください')
    .min(0, '表示順は0以上で入力してください')
    .default(0),
})

export const updateBusinessUnitSchema = z.object({
  name: z
    .string()
    .min(1, '名称は必須です')
    .max(100, '名称は100文字以内で入力してください'),
  displayOrder: z
    .number()
    .int('表示順は整数で入力してください')
    .min(0, '表示順は0以上で入力してください')
    .optional(),
})

export const businessUnitSearchSchema = z.object({
  page: z.number().int().positive().catch(1).default(1),
  pageSize: z.number().int().min(1).max(100).catch(20).default(20),
  search: z.string().catch('').default(''),
  includeDisabled: z.boolean().catch(false).default(false),
})

// --- 入力型 ---

export type CreateBusinessUnitInput = z.infer<typeof createBusinessUnitSchema>
export type UpdateBusinessUnitInput = z.infer<typeof updateBusinessUnitSchema>
export type BusinessUnitSearchParams = z.infer<typeof businessUnitSearchSchema>

// --- API パラメータ型 ---

export type BusinessUnitListParams = {
  page: number
  pageSize: number
  includeDisabled: boolean
}

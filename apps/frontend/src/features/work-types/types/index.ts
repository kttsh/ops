import { z } from 'zod'

// --- 共通型を共有レイヤーから re-export ---
export type {
  PaginatedResponse,
  SingleResponse,
  ProblemDetails,
  SelectOption,
} from '@/lib/api'

// --- API レスポンス型 ---

export type WorkType = {
  workTypeCode: string
  name: string
  displayOrder: number
  color: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

// --- Zod スキーマ ---

const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'カラーコードは #RRGGBB 形式で入力してください')
  .nullable()
  .optional()

export const createWorkTypeSchema = z.object({
  workTypeCode: z
    .string()
    .min(1, '作業種類コードは必須です')
    .max(20, '作業種類コードは20文字以内で入力してください')
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
  color: colorSchema,
})

export const updateWorkTypeSchema = z.object({
  name: z
    .string()
    .min(1, '名称は必須です')
    .max(100, '名称は100文字以内で入力してください'),
  displayOrder: z
    .number()
    .int('表示順は整数で入力してください')
    .min(0, '表示順は0以上で入力してください')
    .optional(),
  color: colorSchema,
})

export const workTypeSearchSchema = z.object({
  search: z.string().catch('').default(''),
  includeDisabled: z.boolean().catch(false).default(false),
})

// --- 入力型 ---

export type CreateWorkTypeInput = z.infer<typeof createWorkTypeSchema>
export type UpdateWorkTypeInput = z.infer<typeof updateWorkTypeSchema>
export type WorkTypeSearchParams = z.infer<typeof workTypeSearchSchema>

// --- API パラメータ型 ---

export type WorkTypeListParams = {
  includeDisabled: boolean
}

import { z } from 'zod'

// --- 共通型を共有レイヤーから re-export ---
export type {
  PaginatedResponse,
  SingleResponse,
  ProblemDetails,
  SelectOption,
} from '@/lib/api'

// --- API レスポンス型 ---

export type Project = {
  projectId: number
  projectCode: string
  name: string
  businessUnitCode: string
  businessUnitName: string
  projectTypeCode: string | null
  projectTypeName: string | null
  startYearMonth: string
  totalManhour: number
  status: string
  durationMonths: number | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

// --- ステータス定数 ---

export const PROJECT_STATUSES = [
  { value: 'planning', label: '計画' },
  { value: 'confirmed', label: '確定' },
] as const

// --- Zod スキーマ ---

export const createProjectSchema = z.object({
  projectCode: z
    .string()
    .min(1, '案件コードは必須です')
    .max(20, '案件コードは20文字以内で入力してください')
    .regex(/^[a-zA-Z0-9_-]+$/, '英数字・ハイフン・アンダースコアのみ使用できます'),
  name: z
    .string()
    .min(1, '名称は必須です')
    .max(200, '名称は200文字以内で入力してください'),
  businessUnitCode: z
    .string()
    .min(1, '事業部は必須です'),
  projectTypeCode: z
    .string()
    .optional(),
  startYearMonth: z
    .string()
    .min(1, '開始年月は必須です')
    .regex(/^\d{6}$/, 'YYYYMM形式で入力してください'),
  totalManhour: z
    .number({ error: '総工数は数値で入力してください' })
    .positive('総工数は正の数で入力してください'),
  status: z
    .string()
    .min(1, 'ステータスは必須です'),
  durationMonths: z
    .number({ error: '期間月数は数値で入力してください' })
    .int('期間月数は整数で入力してください')
    .positive('期間月数は正の整数で入力してください')
    .nullable()
    .optional(),
})

export const updateProjectSchema = z
  .object({
    projectCode: z
      .string()
      .min(1, '案件コードは必須です')
      .max(20, '案件コードは20文字以内で入力してください')
      .regex(/^[a-zA-Z0-9_-]+$/, '英数字・ハイフン・アンダースコアのみ使用できます')
      .optional(),
    name: z
      .string()
      .min(1, '名称は必須です')
      .max(200, '名称は200文字以内で入力してください')
      .optional(),
    businessUnitCode: z
      .string()
      .min(1, '事業部は必須です')
      .optional(),
    projectTypeCode: z
      .string()
      .nullable()
      .optional(),
    startYearMonth: z
      .string()
      .regex(/^\d{6}$/, 'YYYYMM形式で入力してください')
      .optional(),
    totalManhour: z
      .number({ error: '総工数は数値で入力してください' })
      .positive('総工数は正の数で入力してください')
      .optional(),
    status: z
      .string()
      .min(1, 'ステータスは必須です')
      .optional(),
    durationMonths: z
      .number({ error: '期間月数は数値で入力してください' })
      .int('期間月数は整数で入力してください')
      .positive('期間月数は正の整数で入力してください')
      .nullable()
      .optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: '少なくとも1つのフィールドを入力してください' },
  )

export const projectSearchSchema = z.object({
  page: z.number().int().positive().catch(1).default(1),
  pageSize: z.number().int().min(1).max(100).catch(20).default(20),
  search: z.string().catch('').default(''),
  includeDisabled: z.boolean().catch(false).default(false),
})

// --- 入力型 ---

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type ProjectSearchParams = z.infer<typeof projectSearchSchema>

// --- API パラメータ型 ---

export type ProjectListParams = {
  page: number
  pageSize: number
  includeDisabled: boolean
}

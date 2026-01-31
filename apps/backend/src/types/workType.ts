import { z } from 'zod'
import { paginationQuerySchema } from '@/types/pagination'

// --- Zod スキーマ ---

/** 作成用スキーマ */
export const createWorkTypeSchema = z.object({
  workTypeCode: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().min(1).max(100),
  displayOrder: z.number().int().min(0).default(0),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
})

/** 更新用スキーマ */
export const updateWorkTypeSchema = z.object({
  name: z.string().min(1).max(100),
  displayOrder: z.number().int().min(0).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
})

/** 一覧取得クエリスキーマ（ページネーション + フィルタ） */
export const workTypeListQuerySchema = paginationQuerySchema.extend({
  'filter[includeDisabled]': z.coerce.boolean().default(false),
})

// --- TypeScript 型 ---

/** 作成リクエスト型 */
export type CreateWorkType = z.infer<typeof createWorkTypeSchema>

/** 更新リクエスト型 */
export type UpdateWorkType = z.infer<typeof updateWorkTypeSchema>

/** 一覧取得クエリ型 */
export type WorkTypeListQuery = z.infer<typeof workTypeListQuerySchema>

/** DB 行型（snake_case — DB のカラム名そのまま） */
export type WorkTypeRow = {
  work_type_code: string
  name: string
  display_order: number
  color: string | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

/** API レスポンス型（camelCase） */
export type WorkType = {
  workTypeCode: string
  name: string
  displayOrder: number
  color: string | null
  createdAt: string
  updatedAt: string
}

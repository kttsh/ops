import { z } from 'zod'
import { paginationQuerySchema } from '@/types/pagination'

// --- Zod スキーマ ---

/** 作成用スキーマ */
export const createProjectTypeSchema = z.object({
  projectTypeCode: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().min(1).max(100),
  displayOrder: z.number().int().min(0).default(0),
})

/** 更新用スキーマ */
export const updateProjectTypeSchema = z.object({
  name: z.string().min(1).max(100),
  displayOrder: z.number().int().min(0).optional(),
})

/** 一覧取得クエリスキーマ（ページネーション + フィルタ） */
export const projectTypeListQuerySchema = paginationQuerySchema.extend({
  'filter[includeDisabled]': z.coerce.boolean().default(false),
})

// --- TypeScript 型 ---

/** 作成リクエスト型 */
export type CreateProjectType = z.infer<typeof createProjectTypeSchema>

/** 更新リクエスト型 */
export type UpdateProjectType = z.infer<typeof updateProjectTypeSchema>

/** 一覧取得クエリ型 */
export type ProjectTypeListQuery = z.infer<typeof projectTypeListQuerySchema>

/** DB 行型（snake_case — DB のカラム名そのまま） */
export type ProjectTypeRow = {
  project_type_code: string
  name: string
  display_order: number
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

/** API レスポンス型（camelCase） */
export type ProjectType = {
  projectTypeCode: string
  name: string
  displayOrder: number
  createdAt: string
  updatedAt: string
}

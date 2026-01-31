import { z } from 'zod'
import { paginationQuerySchema } from '@/types/pagination'

// --- Zod スキーマ ---

/** 作成用スキーマ */
export const createCapacityScenarioSchema = z.object({
  scenarioName: z.string().min(1).max(100),
  isPrimary: z.boolean().default(false),
  description: z.string().max(500).nullish(),
})

/** 更新用スキーマ */
export const updateCapacityScenarioSchema = z.object({
  scenarioName: z.string().min(1).max(100).optional(),
  isPrimary: z.boolean().optional(),
  description: z.string().max(500).nullish(),
})

/** 一覧取得クエリスキーマ（ページネーション + フィルタ） */
export const capacityScenarioListQuerySchema = paginationQuerySchema.extend({
  'filter[includeDisabled]': z.coerce.boolean().default(false),
})

// --- TypeScript 型 ---

/** 作成リクエスト型 */
export type CreateCapacityScenario = z.infer<typeof createCapacityScenarioSchema>

/** 更新リクエスト型 */
export type UpdateCapacityScenario = z.infer<typeof updateCapacityScenarioSchema>

/** 一覧取得クエリ型 */
export type CapacityScenarioListQuery = z.infer<typeof capacityScenarioListQuerySchema>

/** DB 行型（snake_case — DB のカラム名そのまま） */
export type CapacityScenarioRow = {
  capacity_scenario_id: number
  scenario_name: string
  is_primary: boolean
  description: string | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

/** API レスポンス型（camelCase） */
export type CapacityScenario = {
  capacityScenarioId: number
  scenarioName: string
  isPrimary: boolean
  description: string | null
  createdAt: string
  updatedAt: string
}

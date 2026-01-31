import { z } from 'zod'
import { paginationQuerySchema } from '@/types/pagination'

// --- Zod スキーマ ---

/** 作成用スキーマ */
export const createChartStackOrderSettingSchema = z.object({
  targetType: z.string().min(1).max(20),
  targetId: z.number().int().positive(),
  stackOrder: z.number().int(),
})

/** 更新用スキーマ（全フィールドオプショナル） */
export const updateChartStackOrderSettingSchema = z.object({
  targetType: z.string().min(1).max(20).optional(),
  targetId: z.number().int().positive().optional(),
  stackOrder: z.number().int().optional(),
})

/** 一括 Upsert 用スキーマ */
export const bulkUpsertChartStackOrderSettingSchema = z.object({
  items: z.array(createChartStackOrderSettingSchema).min(1),
})

/** 一覧取得クエリスキーマ */
export const chartStackOrderSettingListQuerySchema = paginationQuerySchema.extend({
  'filter[targetType]': z.string().max(20).optional(),
})

// --- TypeScript 型 ---

/** 作成リクエスト型 */
export type CreateChartStackOrderSetting = z.infer<typeof createChartStackOrderSettingSchema>

/** 更新リクエスト型 */
export type UpdateChartStackOrderSetting = z.infer<typeof updateChartStackOrderSettingSchema>

/** 一括 Upsert リクエスト型 */
export type BulkUpsertChartStackOrderSetting = z.infer<typeof bulkUpsertChartStackOrderSettingSchema>

/** 一覧取得クエリ型 */
export type ChartStackOrderSettingListQuery = z.infer<typeof chartStackOrderSettingListQuerySchema>

/** DB 行型（snake_case — DB のカラム名そのまま） */
export type ChartStackOrderSettingRow = {
  chart_stack_order_setting_id: number
  target_type: string
  target_id: number
  stack_order: number
  created_at: Date
  updated_at: Date
}

/** API レスポンス型（camelCase） */
export type ChartStackOrderSetting = {
  chartStackOrderSettingId: number
  targetType: string
  targetId: number
  stackOrder: number
  createdAt: string
  updatedAt: string
}

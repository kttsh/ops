import { z } from 'zod'
import { paginationQuerySchema } from '@/types/pagination'

// --- Zod スキーマ ---

/** カラーコードバリデーション（# + 6桁16進数） */
const colorCodeSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
  message: 'colorCode must be a valid hex color code (e.g. #FF5733)',
})

/** 対象タイプバリデーション */
const targetTypeSchema = z.enum(['project', 'indirect_work'])

/** 作成用スキーマ */
export const createChartColorSettingSchema = z.object({
  targetType: targetTypeSchema,
  targetId: z.number().int().positive(),
  colorCode: colorCodeSchema,
})

/** 更新用スキーマ（全フィールドオプショナル） */
export const updateChartColorSettingSchema = z.object({
  targetType: targetTypeSchema.optional(),
  targetId: z.number().int().positive().optional(),
  colorCode: colorCodeSchema.optional(),
})

/** 一括 Upsert 用スキーマ */
export const bulkUpsertChartColorSettingSchema = z.object({
  items: z.array(createChartColorSettingSchema).min(1),
})

/** 一覧取得クエリスキーマ */
export const chartColorSettingListQuerySchema = paginationQuerySchema.extend({
  'filter[targetType]': targetTypeSchema.optional(),
})

// --- TypeScript 型 ---

/** 作成リクエスト型 */
export type CreateChartColorSetting = z.infer<typeof createChartColorSettingSchema>

/** 更新リクエスト型 */
export type UpdateChartColorSetting = z.infer<typeof updateChartColorSettingSchema>

/** 一括 Upsert リクエスト型 */
export type BulkUpsertChartColorSetting = z.infer<typeof bulkUpsertChartColorSettingSchema>

/** 一覧取得クエリ型 */
export type ChartColorSettingListQuery = z.infer<typeof chartColorSettingListQuerySchema>

/** DB 行型（snake_case — DB のカラム名そのまま） */
export type ChartColorSettingRow = {
  chart_color_setting_id: number
  target_type: string
  target_id: number
  color_code: string
  created_at: Date
  updated_at: Date
}

/** API レスポンス型（camelCase） */
export type ChartColorSetting = {
  chartColorSettingId: number
  targetType: string
  targetId: number
  colorCode: string
  createdAt: string
  updatedAt: string
}

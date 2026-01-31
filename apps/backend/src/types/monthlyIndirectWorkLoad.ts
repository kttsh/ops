import { z } from 'zod'

// --- 共通バリデーション ---

/** 年月バリデーション: YYYYMM形式（6桁数字、月は01〜12の範囲） */
const yearMonthSchema = z
  .string()
  .regex(/^\d{6}$/, 'yearMonth must be a 6-digit string in YYYYMM format')
  .refine(
    (val) => {
      const month = parseInt(val.slice(4, 6), 10)
      return month >= 1 && month <= 12
    },
    { message: 'Month part must be between 01 and 12' },
  )

/** データソース区分バリデーション */
const sourceSchema = z.enum(['calculated', 'manual'])

/** 工数バリデーション: 0以上99999999.99以下 */
const manhourSchema = z.number().min(0).max(99999999.99)

/** 事業部コードバリデーション: 1文字以上20文字以下 */
const businessUnitCodeSchema = z.string().min(1).max(20)

// --- Zod スキーマ ---

/** 作成用スキーマ */
export const createMonthlyIndirectWorkLoadSchema = z.object({
  businessUnitCode: businessUnitCodeSchema,
  yearMonth: yearMonthSchema,
  manhour: manhourSchema,
  source: sourceSchema,
})

/** 更新用スキーマ */
export const updateMonthlyIndirectWorkLoadSchema = z.object({
  businessUnitCode: businessUnitCodeSchema.optional(),
  yearMonth: yearMonthSchema.optional(),
  manhour: manhourSchema.optional(),
  source: sourceSchema.optional(),
})

/** バルク Upsert アイテムスキーマ */
const bulkUpsertItemSchema = z.object({
  businessUnitCode: businessUnitCodeSchema,
  yearMonth: yearMonthSchema,
  manhour: manhourSchema,
  source: sourceSchema,
})

/** バルク Upsert スキーマ */
export const bulkUpsertMonthlyIndirectWorkLoadSchema = z.object({
  items: z.array(bulkUpsertItemSchema).min(1),
})

// --- TypeScript 型 ---

/** 作成リクエスト型 */
export type CreateMonthlyIndirectWorkLoad = z.infer<typeof createMonthlyIndirectWorkLoadSchema>

/** 更新リクエスト型 */
export type UpdateMonthlyIndirectWorkLoad = z.infer<typeof updateMonthlyIndirectWorkLoadSchema>

/** バルク Upsert リクエスト型 */
export type BulkUpsertMonthlyIndirectWorkLoad = z.infer<typeof bulkUpsertMonthlyIndirectWorkLoadSchema>

/** DB 行型（snake_case — DB のカラム名そのまま） */
export type MonthlyIndirectWorkLoadRow = {
  monthly_indirect_work_load_id: number
  indirect_work_case_id: number
  business_unit_code: string
  year_month: string
  manhour: number
  source: string
  created_at: Date
  updated_at: Date
}

/** API レスポンス型（camelCase） */
export type MonthlyIndirectWorkLoad = {
  monthlyIndirectWorkLoadId: number
  indirectWorkCaseId: number
  businessUnitCode: string
  yearMonth: string
  manhour: number
  source: string
  createdAt: string
  updatedAt: string
}

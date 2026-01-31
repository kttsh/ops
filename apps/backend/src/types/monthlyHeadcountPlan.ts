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

/** ビジネスユニットコードバリデーション: 1〜20文字 */
const businessUnitCodeSchema = z.string().min(1).max(20)

// --- Zod スキーマ ---

/** 作成用スキーマ */
export const createMonthlyHeadcountPlanSchema = z.object({
  businessUnitCode: businessUnitCodeSchema,
  yearMonth: yearMonthSchema,
  headcount: z.number().int().min(0),
})

/** 更新用スキーマ */
export const updateMonthlyHeadcountPlanSchema = z.object({
  businessUnitCode: businessUnitCodeSchema.optional(),
  yearMonth: yearMonthSchema.optional(),
  headcount: z.number().int().min(0).optional(),
})

/** バルク Upsert アイテムスキーマ */
const bulkUpsertItemSchema = z.object({
  businessUnitCode: businessUnitCodeSchema,
  yearMonth: yearMonthSchema,
  headcount: z.number().int().min(0),
})

/** バルク Upsert スキーマ */
export const bulkUpsertMonthlyHeadcountPlanSchema = z.object({
  items: z.array(bulkUpsertItemSchema).min(1),
})

// --- TypeScript 型 ---

/** 作成リクエスト型 */
export type CreateMonthlyHeadcountPlan = z.infer<typeof createMonthlyHeadcountPlanSchema>

/** 更新リクエスト型 */
export type UpdateMonthlyHeadcountPlan = z.infer<typeof updateMonthlyHeadcountPlanSchema>

/** バルク Upsert リクエスト型 */
export type BulkUpsertMonthlyHeadcountPlan = z.infer<typeof bulkUpsertMonthlyHeadcountPlanSchema>

/** DB 行型（snake_case — DB のカラム名そのまま） */
export type MonthlyHeadcountPlanRow = {
  monthly_headcount_plan_id: number
  headcount_plan_case_id: number
  business_unit_code: string
  year_month: string
  headcount: number
  created_at: Date
  updated_at: Date
}

/** API レスポンス型（camelCase） */
export type MonthlyHeadcountPlan = {
  monthlyHeadcountPlanId: number
  headcountPlanCaseId: number
  businessUnitCode: string
  yearMonth: string
  headcount: number
  createdAt: string
  updatedAt: string
}

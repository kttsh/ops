import { z } from 'zod'

// --- Zod スキーマ ---

/** 作成用スキーマ */
export const createChartViewProjectItemSchema = z.object({
  projectId: z.number().int().positive(),
  projectCaseId: z.number().int().positive().nullable().optional(),
  displayOrder: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
})

/** 更新用スキーマ（projectId は変更不可） */
export const updateChartViewProjectItemSchema = z.object({
  projectCaseId: z.number().int().positive().nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
})

/** 一括表示順序更新用スキーマ */
export const updateDisplayOrderSchema = z.object({
  items: z
    .array(
      z.object({
        chartViewProjectItemId: z.number().int().positive(),
        displayOrder: z.number().int().min(0),
      }),
    )
    .min(1),
})

// --- TypeScript 型 ---

/** 作成リクエスト型 */
export type CreateChartViewProjectItem = z.infer<typeof createChartViewProjectItemSchema>

/** 更新リクエスト型 */
export type UpdateChartViewProjectItem = z.infer<typeof updateChartViewProjectItemSchema>

/** 一括表示順序更新リクエスト型 */
export type UpdateDisplayOrder = z.infer<typeof updateDisplayOrderSchema>

/** DB 行型（snake_case — JOIN カラム含む） */
export type ChartViewProjectItemRow = {
  chart_view_project_item_id: number
  chart_view_id: number
  project_id: number
  project_case_id: number | null
  display_order: number
  is_visible: boolean
  created_at: Date
  updated_at: Date
  // JOIN カラム
  project_code: string
  project_name: string
  case_name: string | null
}

/** API レスポンス型（camelCase） */
export type ChartViewProjectItem = {
  chartViewProjectItemId: number
  chartViewId: number
  projectId: number
  projectCaseId: number | null
  displayOrder: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
  project: {
    projectCode: string
    projectName: string
  }
  projectCase: {
    caseName: string
  } | null
}

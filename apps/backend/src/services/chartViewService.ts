import { HTTPException } from 'hono/http-exception'
import { chartViewData } from '@/data/chartViewData'
import { toChartViewResponse } from '@/transform/chartViewTransform'
import type {
  ChartView,
  CreateChartView,
  UpdateChartView,
} from '@/types/chartView'

export const chartViewService = {
  async findAll(params: {
    page: number
    pageSize: number
    includeDisabled: boolean
  }): Promise<{ items: ChartView[]; totalCount: number }> {
    const result = await chartViewData.findAll(params)
    return {
      items: result.items.map(toChartViewResponse),
      totalCount: result.totalCount,
    }
  },

  async findById(id: number): Promise<ChartView> {
    const row = await chartViewData.findById(id)
    if (!row) {
      throw new HTTPException(404, {
        message: `Chart view with ID '${id}' not found`,
      })
    }
    return toChartViewResponse(row)
  },

  async create(data: CreateChartView): Promise<ChartView> {
    const created = await chartViewData.create({
      viewName: data.viewName,
      chartType: data.chartType,
      startYearMonth: data.startYearMonth,
      endYearMonth: data.endYearMonth,
      isDefault: data.isDefault ?? false,
      description: data.description ?? null,
    })
    return toChartViewResponse(created)
  },

  async update(id: number, data: UpdateChartView): Promise<ChartView> {
    const existing = await chartViewData.findById(id)
    if (!existing) {
      throw new HTTPException(404, {
        message: `Chart view with ID '${id}' not found`,
      })
    }

    const mergedStart = data.startYearMonth ?? existing.start_year_month
    const mergedEnd = data.endYearMonth ?? existing.end_year_month
    if (mergedStart > mergedEnd) {
      throw new HTTPException(422, {
        message: 'endYearMonth must be greater than or equal to startYearMonth',
      })
    }

    const updated = await chartViewData.update(id, data)
    if (!updated) {
      throw new HTTPException(404, {
        message: `Chart view with ID '${id}' not found`,
      })
    }
    return toChartViewResponse(updated)
  },

  async delete(id: number): Promise<void> {
    const deleted = await chartViewData.softDelete(id)
    if (!deleted) {
      throw new HTTPException(404, {
        message: `Chart view with ID '${id}' not found`,
      })
    }
  },

  async restore(id: number): Promise<ChartView> {
    const existing = await chartViewData.findByIdIncludingDeleted(id)
    if (!existing) {
      throw new HTTPException(404, {
        message: `Chart view with ID '${id}' not found`,
      })
    }
    if (!existing.deleted_at) {
      throw new HTTPException(404, {
        message: `Chart view with ID '${id}' not found`,
      })
    }
    const restored = await chartViewData.restore(id)
    return toChartViewResponse(restored!)
  },
}

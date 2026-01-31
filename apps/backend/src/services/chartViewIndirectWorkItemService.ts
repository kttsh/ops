import { HTTPException } from 'hono/http-exception'
import { chartViewIndirectWorkItemData } from '@/data/chartViewIndirectWorkItemData'
import { toChartViewIndirectWorkItemResponse } from '@/transform/chartViewIndirectWorkItemTransform'
import type {
  ChartViewIndirectWorkItem,
  CreateChartViewIndirectWorkItem,
  UpdateChartViewIndirectWorkItem,
} from '@/types/chartViewIndirectWorkItem'

export const chartViewIndirectWorkItemService = {
  async findAll(chartViewId: number): Promise<ChartViewIndirectWorkItem[]> {
    const exists = await chartViewIndirectWorkItemData.chartViewExists(chartViewId)
    if (!exists) {
      throw new HTTPException(404, {
        message: `Chart view with ID '${chartViewId}' not found`,
      })
    }

    const rows = await chartViewIndirectWorkItemData.findAll(chartViewId)
    return rows.map(toChartViewIndirectWorkItemResponse)
  },

  async findById(chartViewId: number, id: number): Promise<ChartViewIndirectWorkItem> {
    const row = await chartViewIndirectWorkItemData.findById(id)
    if (!row) {
      throw new HTTPException(404, {
        message: `Chart view indirect work item with ID '${id}' not found`,
      })
    }
    if (row.chart_view_id !== chartViewId) {
      throw new HTTPException(404, {
        message: `Chart view indirect work item with ID '${id}' not found`,
      })
    }
    return toChartViewIndirectWorkItemResponse(row)
  },

  async create(chartViewId: number, data: CreateChartViewIndirectWorkItem): Promise<ChartViewIndirectWorkItem> {
    const exists = await chartViewIndirectWorkItemData.chartViewExists(chartViewId)
    if (!exists) {
      throw new HTTPException(404, {
        message: `Chart view with ID '${chartViewId}' not found`,
      })
    }

    const caseExists = await chartViewIndirectWorkItemData.indirectWorkCaseExists(data.indirectWorkCaseId)
    if (!caseExists) {
      throw new HTTPException(422, {
        message: `Indirect work case with ID '${data.indirectWorkCaseId}' not found`,
      })
    }

    const duplicate = await chartViewIndirectWorkItemData.duplicateExists(chartViewId, data.indirectWorkCaseId)
    if (duplicate) {
      throw new HTTPException(409, {
        message: `Indirect work case with ID '${data.indirectWorkCaseId}' already exists in chart view '${chartViewId}'`,
      })
    }

    const created = await chartViewIndirectWorkItemData.create({
      chartViewId,
      indirectWorkCaseId: data.indirectWorkCaseId,
      displayOrder: data.displayOrder,
      isVisible: data.isVisible,
    })
    return toChartViewIndirectWorkItemResponse(created)
  },

  async update(chartViewId: number, id: number, data: UpdateChartViewIndirectWorkItem): Promise<ChartViewIndirectWorkItem> {
    const existing = await chartViewIndirectWorkItemData.findById(id)
    if (!existing) {
      throw new HTTPException(404, {
        message: `Chart view indirect work item with ID '${id}' not found`,
      })
    }
    if (existing.chart_view_id !== chartViewId) {
      throw new HTTPException(404, {
        message: `Chart view indirect work item with ID '${id}' not found`,
      })
    }

    const updated = await chartViewIndirectWorkItemData.update(id, data)
    if (!updated) {
      throw new HTTPException(404, {
        message: `Chart view indirect work item with ID '${id}' not found`,
      })
    }
    return toChartViewIndirectWorkItemResponse(updated)
  },

  async delete(chartViewId: number, id: number): Promise<void> {
    const existing = await chartViewIndirectWorkItemData.findById(id)
    if (!existing) {
      throw new HTTPException(404, {
        message: `Chart view indirect work item with ID '${id}' not found`,
      })
    }
    if (existing.chart_view_id !== chartViewId) {
      throw new HTTPException(404, {
        message: `Chart view indirect work item with ID '${id}' not found`,
      })
    }

    await chartViewIndirectWorkItemData.deleteById(id)
  },
}

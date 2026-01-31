import { HTTPException } from 'hono/http-exception'
import { chartViewProjectItemData } from '@/data/chartViewProjectItemData'
import { toChartViewProjectItemResponse } from '@/transform/chartViewProjectItemTransform'
import type {
  ChartViewProjectItem,
  CreateChartViewProjectItem,
  UpdateChartViewProjectItem,
  UpdateDisplayOrder,
} from '@/types/chartViewProjectItem'

export const chartViewProjectItemService = {
  async findAll(chartViewId: number): Promise<ChartViewProjectItem[]> {
    const exists = await chartViewProjectItemData.chartViewExists(chartViewId)
    if (!exists) {
      throw new HTTPException(404, {
        message: `Chart view with ID '${chartViewId}' not found`,
      })
    }

    const rows = await chartViewProjectItemData.findAll(chartViewId)
    return rows.map(toChartViewProjectItemResponse)
  },

  async findById(chartViewId: number, id: number): Promise<ChartViewProjectItem> {
    const row = await chartViewProjectItemData.findById(id)
    if (!row) {
      throw new HTTPException(404, {
        message: `Chart view project item with ID '${id}' not found`,
      })
    }
    if (row.chart_view_id !== chartViewId) {
      throw new HTTPException(404, {
        message: `Chart view project item with ID '${id}' not found`,
      })
    }
    return toChartViewProjectItemResponse(row)
  },

  async create(chartViewId: number, data: CreateChartViewProjectItem): Promise<ChartViewProjectItem> {
    const chartViewExists = await chartViewProjectItemData.chartViewExists(chartViewId)
    if (!chartViewExists) {
      throw new HTTPException(404, {
        message: `Chart view with ID '${chartViewId}' not found`,
      })
    }

    const projectExists = await chartViewProjectItemData.projectExists(data.projectId)
    if (!projectExists) {
      throw new HTTPException(422, {
        message: `Project with ID '${data.projectId}' not found`,
      })
    }

    if (data.projectCaseId != null) {
      const caseBelongs = await chartViewProjectItemData.projectCaseBelongsToProject(
        data.projectCaseId,
        data.projectId,
      )
      if (!caseBelongs) {
        throw new HTTPException(422, {
          message: `Project case with ID '${data.projectCaseId}' not found or does not belong to project '${data.projectId}'`,
        })
      }
    }

    const created = await chartViewProjectItemData.create({
      chartViewId,
      projectId: data.projectId,
      projectCaseId: data.projectCaseId ?? null,
      displayOrder: data.displayOrder,
      isVisible: data.isVisible,
    })
    return toChartViewProjectItemResponse(created)
  },

  async update(chartViewId: number, id: number, data: UpdateChartViewProjectItem): Promise<ChartViewProjectItem> {
    const existing = await chartViewProjectItemData.findById(id)
    if (!existing) {
      throw new HTTPException(404, {
        message: `Chart view project item with ID '${id}' not found`,
      })
    }
    if (existing.chart_view_id !== chartViewId) {
      throw new HTTPException(404, {
        message: `Chart view project item with ID '${id}' not found`,
      })
    }

    if (data.projectCaseId !== undefined && data.projectCaseId !== null) {
      const caseBelongs = await chartViewProjectItemData.projectCaseBelongsToProject(
        data.projectCaseId,
        existing.project_id,
      )
      if (!caseBelongs) {
        throw new HTTPException(422, {
          message: `Project case with ID '${data.projectCaseId}' not found or does not belong to project '${existing.project_id}'`,
        })
      }
    }

    const updated = await chartViewProjectItemData.update(id, data)
    if (!updated) {
      throw new HTTPException(404, {
        message: `Chart view project item with ID '${id}' not found`,
      })
    }
    return toChartViewProjectItemResponse(updated)
  },

  async delete(chartViewId: number, id: number): Promise<void> {
    const existing = await chartViewProjectItemData.findById(id)
    if (!existing) {
      throw new HTTPException(404, {
        message: `Chart view project item with ID '${id}' not found`,
      })
    }
    if (existing.chart_view_id !== chartViewId) {
      throw new HTTPException(404, {
        message: `Chart view project item with ID '${id}' not found`,
      })
    }

    await chartViewProjectItemData.deleteById(id)
  },

  async updateDisplayOrder(chartViewId: number, data: UpdateDisplayOrder): Promise<ChartViewProjectItem[]> {
    const chartViewExists = await chartViewProjectItemData.chartViewExists(chartViewId)
    if (!chartViewExists) {
      throw new HTTPException(404, {
        message: `Chart view with ID '${chartViewId}' not found`,
      })
    }

    for (const item of data.items) {
      const row = await chartViewProjectItemData.findById(item.chartViewProjectItemId)
      if (!row || row.chart_view_id !== chartViewId) {
        throw new HTTPException(422, {
          message: `Chart view project item with ID '${item.chartViewProjectItemId}' does not belong to chart view '${chartViewId}'`,
        })
      }
    }

    await chartViewProjectItemData.updateDisplayOrders(data.items)

    const rows = await chartViewProjectItemData.findAll(chartViewId)
    return rows.map(toChartViewProjectItemResponse)
  },
}

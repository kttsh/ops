import { HTTPException } from 'hono/http-exception'
import { chartStackOrderSettingData } from '@/data/chartStackOrderSettingData'
import { toChartStackOrderSettingResponse } from '@/transform/chartStackOrderSettingTransform'
import type {
  ChartStackOrderSetting,
  CreateChartStackOrderSetting,
  UpdateChartStackOrderSetting,
} from '@/types/chartStackOrderSetting'

export const chartStackOrderSettingService = {
  async findAll(params: {
    page: number
    pageSize: number
    targetType?: string
  }): Promise<{ items: ChartStackOrderSetting[]; totalCount: number }> {
    const result = await chartStackOrderSettingData.findAll(params)
    return {
      items: result.items.map(toChartStackOrderSettingResponse),
      totalCount: result.totalCount,
    }
  },

  async findById(id: number): Promise<ChartStackOrderSetting> {
    const row = await chartStackOrderSettingData.findById(id)
    if (!row) {
      throw new HTTPException(404, {
        message: `Chart stack order setting with ID '${id}' not found`,
      })
    }
    return toChartStackOrderSettingResponse(row)
  },

  async create(data: CreateChartStackOrderSetting): Promise<ChartStackOrderSetting> {
    const existing = await chartStackOrderSettingData.findByTarget(data.targetType, data.targetId)
    if (existing) {
      throw new HTTPException(409, {
        message: `Chart stack order setting with target type '${data.targetType}' and target ID '${data.targetId}' already exists`,
      })
    }

    const created = await chartStackOrderSettingData.create(data)
    return toChartStackOrderSettingResponse(created)
  },

  async update(id: number, data: UpdateChartStackOrderSetting): Promise<ChartStackOrderSetting> {
    const existing = await chartStackOrderSettingData.findById(id)
    if (!existing) {
      throw new HTTPException(404, {
        message: `Chart stack order setting with ID '${id}' not found`,
      })
    }

    const targetType = data.targetType ?? existing.target_type
    const targetId = data.targetId ?? existing.target_id

    if (data.targetType !== undefined || data.targetId !== undefined) {
      const duplicate = await chartStackOrderSettingData.findByTargetExcluding(
        targetType,
        targetId,
        id,
      )
      if (duplicate) {
        throw new HTTPException(409, {
          message: `Chart stack order setting with target type '${targetType}' and target ID '${targetId}' already exists`,
        })
      }
    }

    const updated = await chartStackOrderSettingData.update(id, data)
    if (!updated) {
      throw new HTTPException(404, {
        message: `Chart stack order setting with ID '${id}' not found`,
      })
    }
    return toChartStackOrderSettingResponse(updated)
  },

  async delete(id: number): Promise<void> {
    const existing = await chartStackOrderSettingData.findById(id)
    if (!existing) {
      throw new HTTPException(404, {
        message: `Chart stack order setting with ID '${id}' not found`,
      })
    }

    await chartStackOrderSettingData.hardDelete(id)
  },

  async bulkUpsert(
    items: CreateChartStackOrderSetting[],
  ): Promise<ChartStackOrderSetting[]> {
    // 入力配列内の (targetType, targetId) 重複チェック
    const keys = items.map((i) => `${i.targetType}:${i.targetId}`)
    const uniqueKeys = new Set(keys)
    if (uniqueKeys.size !== keys.length) {
      throw new HTTPException(422, {
        message: 'Duplicate targetType and targetId combination found in items',
      })
    }

    const rows = await chartStackOrderSettingData.bulkUpsert(items)
    return rows.map(toChartStackOrderSettingResponse)
  },
}

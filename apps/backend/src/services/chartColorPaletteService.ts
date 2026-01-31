import { HTTPException } from 'hono/http-exception'
import { chartColorPaletteData } from '@/data/chartColorPaletteData'
import { toChartColorPaletteResponse } from '@/transform/chartColorPaletteTransform'
import type {
  ChartColorPalette,
  CreateChartColorPalette,
  UpdateChartColorPalette,
} from '@/types/chartColorPalette'

export const chartColorPaletteService = {
  async findAll(): Promise<ChartColorPalette[]> {
    const rows = await chartColorPaletteData.findAll()
    return rows.map(toChartColorPaletteResponse)
  },

  async findById(paletteId: number): Promise<ChartColorPalette> {
    const row = await chartColorPaletteData.findById(paletteId)
    if (!row) {
      throw new HTTPException(404, {
        message: `Chart color palette with ID '${paletteId}' not found`,
      })
    }
    return toChartColorPaletteResponse(row)
  },

  async create(data: CreateChartColorPalette): Promise<ChartColorPalette> {
    const row = await chartColorPaletteData.create(data)
    return toChartColorPaletteResponse(row)
  },

  async update(paletteId: number, data: UpdateChartColorPalette): Promise<ChartColorPalette> {
    const existing = await chartColorPaletteData.findById(paletteId)
    if (!existing) {
      throw new HTTPException(404, {
        message: `Chart color palette with ID '${paletteId}' not found`,
      })
    }

    const updated = await chartColorPaletteData.update(paletteId, data)
    return toChartColorPaletteResponse(updated!)
  },

  async delete(paletteId: number): Promise<void> {
    const existing = await chartColorPaletteData.findById(paletteId)
    if (!existing) {
      throw new HTTPException(404, {
        message: `Chart color palette with ID '${paletteId}' not found`,
      })
    }

    await chartColorPaletteData.deleteById(paletteId)
  },
}

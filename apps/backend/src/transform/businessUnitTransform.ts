import type { BusinessUnitRow, BusinessUnit } from '@/types/businessUnit'

export function toBusinessUnitResponse(row: BusinessUnitRow): BusinessUnit {
  return {
    businessUnitCode: row.business_unit_code,
    name: row.name,
    displayOrder: row.display_order,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

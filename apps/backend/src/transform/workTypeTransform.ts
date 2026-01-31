import type { WorkTypeRow, WorkType } from '@/types/workType'

export function toWorkTypeResponse(row: WorkTypeRow): WorkType {
  return {
    workTypeCode: row.work_type_code,
    name: row.name,
    displayOrder: row.display_order,
    color: row.color,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

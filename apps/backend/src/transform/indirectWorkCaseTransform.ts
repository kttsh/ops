import type {
	IndirectWorkCase,
	IndirectWorkCaseRow,
} from "@/types/indirectWorkCase";

export function toIndirectWorkCaseResponse(
	row: IndirectWorkCaseRow,
): IndirectWorkCase {
	return {
		indirectWorkCaseId: row.indirect_work_case_id,
		caseName: row.case_name,
		isPrimary: row.is_primary,
		description: row.description,
		businessUnitCode: row.business_unit_code,
		businessUnitName: row.business_unit_name,
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString(),
		deletedAt: row.deleted_at?.toISOString() ?? null,
	};
}

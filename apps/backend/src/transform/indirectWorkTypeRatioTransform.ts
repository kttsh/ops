import type {
	IndirectWorkTypeRatio,
	IndirectWorkTypeRatioRow,
} from "@/types/indirectWorkTypeRatio";

export function toIndirectWorkTypeRatioResponse(
	row: IndirectWorkTypeRatioRow,
): IndirectWorkTypeRatio {
	return {
		indirectWorkTypeRatioId: row.indirect_work_type_ratio_id,
		indirectWorkCaseId: row.indirect_work_case_id,
		workTypeCode: row.work_type_code,
		fiscalYear: row.fiscal_year,
		ratio: row.ratio,
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString(),
	};
}

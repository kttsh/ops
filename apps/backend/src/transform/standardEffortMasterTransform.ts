import type {
	StandardEffortMasterDetail,
	StandardEffortMasterRow,
	StandardEffortMasterSummary,
	StandardEffortWeight,
	StandardEffortWeightRow,
} from "@/types/standardEffortMaster";

export function toSummaryResponse(
	row: StandardEffortMasterRow,
): StandardEffortMasterSummary {
	return {
		standardEffortId: row.standard_effort_id,
		businessUnitCode: row.business_unit_code,
		projectTypeCode: row.project_type_code,
		name: row.name,
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString(),
	};
}

export function toWeightResponse(
	row: StandardEffortWeightRow,
): StandardEffortWeight {
	return {
		standardEffortWeightId: row.standard_effort_weight_id,
		progressRate: row.progress_rate,
		weight: row.weight,
	};
}

export function toDetailResponse(
	row: StandardEffortMasterRow,
	weights: StandardEffortWeightRow[],
): StandardEffortMasterDetail {
	return {
		...toSummaryResponse(row),
		weights: weights.map(toWeightResponse),
	};
}

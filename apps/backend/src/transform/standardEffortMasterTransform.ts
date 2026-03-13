import type {
	StandardEffortMasterDetail,
	StandardEffortMasterRow,
	StandardEffortMasterSummary,
	StandardEffortWeight,
	StandardEffortWeightRow,
} from "@/types/standardEffortMaster";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toSummaryResponse = createFieldMapper<
	StandardEffortMasterRow,
	StandardEffortMasterSummary
>({
	standardEffortId: "standard_effort_id",
	businessUnitCode: "business_unit_code",
	projectTypeCode: "project_type_code",
	name: "name",
	createdAt: "created_at",
	updatedAt: "updated_at",
});

export const toWeightResponse = createFieldMapper<
	StandardEffortWeightRow,
	StandardEffortWeight
>({
	standardEffortWeightId: "standard_effort_weight_id",
	progressRate: "progress_rate",
	weight: "weight",
});

export function toDetailResponse(
	row: StandardEffortMasterRow,
	weights: StandardEffortWeightRow[],
): StandardEffortMasterDetail {
	return {
		...toSummaryResponse(row),
		weights: weights.map(toWeightResponse),
	};
}

import type {
	IndirectWorkTypeRatio,
	IndirectWorkTypeRatioRow,
} from "@/types/indirectWorkTypeRatio";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toIndirectWorkTypeRatioResponse = createFieldMapper<
	IndirectWorkTypeRatioRow,
	IndirectWorkTypeRatio
>({
	indirectWorkTypeRatioId: "indirect_work_type_ratio_id",
	indirectWorkCaseId: "indirect_work_case_id",
	workTypeCode: "work_type_code",
	fiscalYear: "fiscal_year",
	ratio: "ratio",
	createdAt: "created_at",
	updatedAt: "updated_at",
});

import type {
	Project,
	ProjectCaseSummary,
	ProjectCaseSummaryRow,
	ProjectRow,
} from "@/types/project";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toProjectResponse = createFieldMapper<ProjectRow, Project>({
	projectId: "project_id",
	projectCode: "project_code",
	name: "name",
	businessUnitCode: "business_unit_code",
	businessUnitName: "business_unit_name",
	projectTypeCode: "project_type_code",
	projectTypeName: "project_type_name",
	startYearMonth: "start_year_month",
	totalManhour: "total_manhour",
	status: { field: "status", transform: (v) => v.toLowerCase() },
	durationMonths: "duration_months",
	fiscalYear: "fiscal_year",
	nickname: "nickname",
	customerName: "customer_name",
	orderNumber: "order_number",
	calculationBasis: "calculation_basis",
	remarks: "remarks",
	region: "region",
	createdAt: "created_at",
	updatedAt: "updated_at",
	deletedAt: "deleted_at",
	cases: { computed: () => [] as ProjectCaseSummary[] },
});

export const toProjectCaseSummaryResponse = createFieldMapper<
	ProjectCaseSummaryRow,
	ProjectCaseSummary
>({
	projectCaseId: "project_case_id",
	caseName: "case_name",
	isPrimary: "is_primary",
});

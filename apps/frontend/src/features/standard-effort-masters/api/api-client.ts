import type { BusinessUnit } from "@/features/business-units/types";
import type { ProjectType } from "@/features/project-types/types";
import type {
	CreateStandardEffortMasterInput,
	StandardEffortMaster,
	StandardEffortMasterDetail,
	StandardEffortMasterListParams,
	UpdateStandardEffortMasterInput,
} from "@/features/standard-effort-masters/types";
import {
	type PaginatedResponse,
	API_BASE_URL,
	createCrudClient,
	handleResponse,
} from "@/lib/api";

// --- createCrudClient（fetchList 以外の CRUD 操作） ---

const client = createCrudClient<
	StandardEffortMasterDetail,
	CreateStandardEffortMasterInput,
	UpdateStandardEffortMasterInput,
	number,
	StandardEffortMasterListParams
>({
	resourcePath: "standard-effort-masters",
	paginated: true,
});

export const {
	fetchDetail: fetchStandardEffortMaster,
	create: createStandardEffortMaster,
	update: updateStandardEffortMaster,
	delete: deleteStandardEffortMaster,
	restore: restoreStandardEffortMaster,
} = client;

// --- カスタム fetchList（BU/PT フィルタ対応） ---

export async function fetchStandardEffortMasters(
	params: StandardEffortMasterListParams,
): Promise<PaginatedResponse<StandardEffortMaster>> {
	const searchParams = new URLSearchParams({
		"page[number]": String(params.page),
		"page[size]": String(params.pageSize),
		"filter[includeDisabled]": String(params.includeDisabled),
	});
	if (params.businessUnitCode) {
		searchParams.set("filter[businessUnitCode]", params.businessUnitCode);
	}
	if (params.projectTypeCode) {
		searchParams.set("filter[projectTypeCode]", params.projectTypeCode);
	}
	const response = await fetch(
		`${API_BASE_URL}/standard-effort-masters?${searchParams}`,
	);
	return handleResponse<PaginatedResponse<StandardEffortMaster>>(response);
}

export { ApiError } from "@/lib/api";

// --- BU/PT Select 用フェッチ関数 ---

export async function fetchBusinessUnitsForSelect(): Promise<
	PaginatedResponse<BusinessUnit>
> {
	const searchParams = new URLSearchParams({
		"page[number]": "1",
		"page[size]": "1000",
	});
	const response = await fetch(
		`${API_BASE_URL}/business-units?${searchParams}`,
	);
	return handleResponse<PaginatedResponse<BusinessUnit>>(response);
}

export async function fetchProjectTypesForSelect(): Promise<
	PaginatedResponse<ProjectType>
> {
	const response = await fetch(`${API_BASE_URL}/project-types`);
	return handleResponse<PaginatedResponse<ProjectType>>(response);
}

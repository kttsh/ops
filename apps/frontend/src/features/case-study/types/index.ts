import { z } from "zod";

// --- 共通型を共有レイヤーから re-export ---
export type {
	PaginatedResponse,
	ProblemDetails,
	SelectOption,
	SingleResponse,
} from "@/lib/api";

// ============================================================
// ProjectCase
// ============================================================

export type ProjectCase = {
	projectCaseId: number;
	projectId: number;
	caseName: string;
	isPrimary: boolean;
	description: string | null;
	calculationType: "STANDARD" | "MANUAL";
	standardEffortId: number | null;
	startYearMonth: string | null;
	durationMonths: number | null;
	totalManhour: number | null;
	createdAt: string;
	updatedAt: string;
	projectName: string;
	standardEffortName: string | null;
};

export const createProjectCaseSchema = z
	.object({
		caseName: z
			.string()
			.min(1, "ケース名は必須です")
			.max(100, "ケース名は100文字以内で入力してください"),
		calculationType: z.enum(["STANDARD", "MANUAL"]),
		standardEffortId: z.number().int().positive().nullable().default(null),
		description: z
			.string()
			.max(500, "説明は500文字以内で入力してください")
			.nullable()
			.default(null),
		isPrimary: z.boolean().default(false),
		startYearMonth: z
			.string()
			.regex(/^\d{6}$/, "YYYYMM形式で入力してください")
			.nullable()
			.default(null),
		durationMonths: z
			.number()
			.int("期間月数は整数で入力してください")
			.positive("期間月数は正の整数で入力してください")
			.nullable()
			.default(null),
		totalManhour: z
			.number()
			.int("総工数は整数で入力してください")
			.min(0, "総工数は0以上で入力してください")
			.nullable()
			.default(null),
	})
	.refine(
		(data) =>
			data.calculationType !== "STANDARD" || data.standardEffortId !== null,
		{
			path: ["standardEffortId"],
			message: "STANDARDモードの場合、標準工数マスタの選択は必須です",
		},
	);

export const updateProjectCaseSchema = z.object({
	caseName: z
		.string()
		.min(1, "ケース名は必須です")
		.max(100, "ケース名は100文字以内で入力してください")
		.optional(),
	calculationType: z.enum(["STANDARD", "MANUAL"]).optional(),
	standardEffortId: z.number().int().positive().nullable().optional(),
	description: z
		.string()
		.max(500, "説明は500文字以内で入力してください")
		.nullable()
		.optional(),
	isPrimary: z.boolean().optional(),
	startYearMonth: z
		.string()
		.regex(/^\d{6}$/, "YYYYMM形式で入力してください")
		.nullable()
		.optional(),
	durationMonths: z
		.number()
		.int("期間月数は整数で入力してください")
		.positive("期間月数は正の整数で入力してください")
		.nullable()
		.optional(),
	totalManhour: z
		.number()
		.int("総工数は整数で入力してください")
		.min(0, "総工数は0以上で入力してください")
		.nullable()
		.optional(),
});

export type CreateProjectCaseInput = z.infer<typeof createProjectCaseSchema>;
export type UpdateProjectCaseInput = z.infer<typeof updateProjectCaseSchema>;

export type ProjectCaseListParams = {
	page?: number;
	pageSize?: number;
	includeDisabled?: boolean;
};

// ============================================================
// ProjectLoad
// ============================================================

export type ProjectLoad = {
	projectLoadId: number;
	projectCaseId: number;
	yearMonth: string;
	manhour: number;
	createdAt: string;
	updatedAt: string;
};

export const bulkProjectLoadSchema = z.object({
	items: z
		.array(
			z.object({
				yearMonth: z.string().regex(/^\d{6}$/, "YYYYMM形式で入力してください"),
				manhour: z.number().int().min(0).max(99999999),
			}),
		)
		.min(1),
});

export type BulkProjectLoadInput = z.infer<typeof bulkProjectLoadSchema>;

// ============================================================
// StandardEffortMaster
// ============================================================

export type StandardEffortMaster = {
	standardEffortId: number;
	businessUnitCode: string;
	projectTypeCode: string;
	name: string;
	createdAt: string;
	updatedAt: string;
};

export type StandardEffortWeight = {
	standardEffortWeightId: number;
	progressRate: number;
	weight: number;
};

export type StandardEffortMasterDetail = StandardEffortMaster & {
	weights: StandardEffortWeight[];
};

export type StandardEffortMasterListParams = {
	page?: number;
	pageSize?: number;
	includeDisabled?: boolean;
	businessUnitCode?: string;
	projectTypeCode?: string;
};

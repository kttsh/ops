import { z } from "zod";

// --- API レスポンス型 ---

export type HeadcountPlanCase = {
	headcountPlanCaseId: number;
	caseName: string;
	description: string | null;
	businessUnitCode: string | null;
	businessUnitName: string | null;
	isPrimary: boolean;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
};

export type MonthlyHeadcountPlan = {
	monthlyHeadcountPlanId: number;
	headcountPlanCaseId: number;
	businessUnitCode: string;
	yearMonth: string;
	headcount: number;
	createdAt: string;
	updatedAt: string;
};

// --- Zod スキーマ ---

export const createHeadcountPlanCaseSchema = z.object({
	caseName: z
		.string()
		.min(1, "名前を入力してください")
		.max(100, "名前は100文字以内で入力してください"),
	description: z
		.string()
		.max(500, "説明は500文字以内で入力してください")
		.optional()
		.default(""),
	isPrimary: z.boolean().default(false),
	businessUnitCode: z.string().optional(),
});

export const updateHeadcountPlanCaseSchema = z.object({
	caseName: z
		.string()
		.min(1, "名前を入力してください")
		.max(100, "名前は100文字以内で入力してください"),
	description: z
		.string()
		.max(500, "説明は500文字以内で入力してください")
		.optional()
		.default(""),
	isPrimary: z.boolean().default(false),
});

export const monthlyHeadcountSchema = z.object({
	yearMonth: z.string(),
	headcount: z
		.number()
		.int("0以上の整数を入力してください")
		.min(0, "0以上の整数を入力してください"),
});

export const bulkMonthlyHeadcountSchema = z.object({
	items: z.array(
		z.object({
			businessUnitCode: z.string(),
			yearMonth: z.string(),
			headcount: z
				.number()
				.int("0以上の整数を入力してください")
				.min(0, "0以上の整数を入力してください"),
		}),
	),
});

// --- 入力型 ---

export type CreateHeadcountPlanCaseInput = z.infer<
	typeof createHeadcountPlanCaseSchema
>;
export type UpdateHeadcountPlanCaseInput = z.infer<
	typeof updateHeadcountPlanCaseSchema
>;
export type MonthlyHeadcountInput = z.infer<typeof monthlyHeadcountSchema>;
export type BulkMonthlyHeadcountInput = z.infer<
	typeof bulkMonthlyHeadcountSchema
>;

// --- API パラメータ型 ---

export type HeadcountPlanCaseListParams = {
	businessUnitCode?: string;
	includeDisabled?: boolean;
};

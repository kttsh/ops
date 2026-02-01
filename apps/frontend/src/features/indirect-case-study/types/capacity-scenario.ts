import { z } from "zod";

// --- API レスポンス型 ---

export type CapacityScenario = {
	capacityScenarioId: number;
	scenarioName: string;
	isPrimary: boolean;
	description: string | null;
	hoursPerPerson: number;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
};

export type MonthlyCapacity = {
	monthlyCapacityId: number;
	capacityScenarioId: number;
	businessUnitCode: string;
	yearMonth: string;
	capacity: number;
	createdAt: string;
	updatedAt: string;
};

export type CalculateCapacityResult = {
	calculated: number;
	hoursPerPerson: number;
	items: MonthlyCapacity[];
};

// --- Zod スキーマ ---

export const createCapacityScenarioSchema = z.object({
	scenarioName: z
		.string()
		.min(1, "名前を入力してください")
		.max(100, "名前は100文字以内で入力してください"),
	description: z
		.string()
		.max(500, "説明は500文字以内で入力してください")
		.optional()
		.default(""),
	hoursPerPerson: z
		.number()
		.gt(0, "0超〜744の範囲で入力してください")
		.lte(744, "0超〜744の範囲で入力してください")
		.default(160.0),
	isPrimary: z.boolean().default(false),
});

export const updateCapacityScenarioSchema = z.object({
	scenarioName: z
		.string()
		.min(1, "名前を入力してください")
		.max(100, "名前は100文字以内で入力してください"),
	description: z
		.string()
		.max(500, "説明は500文字以内で入力してください")
		.optional()
		.default(""),
	hoursPerPerson: z
		.number()
		.gt(0, "0超〜744の範囲で入力してください")
		.lte(744, "0超〜744の範囲で入力してください"),
	isPrimary: z.boolean().default(false),
});

// --- 入力型 ---

export type CreateCapacityScenarioInput = z.infer<
	typeof createCapacityScenarioSchema
>;
export type UpdateCapacityScenarioInput = z.infer<
	typeof updateCapacityScenarioSchema
>;

// --- API パラメータ型 ---

export type CapacityScenarioListParams = {
	includeDisabled?: boolean;
};

export type CalculateCapacityParams = {
	capacityScenarioId: number;
	headcountPlanCaseId: number;
	businessUnitCodes?: string[];
	yearMonthFrom?: string;
	yearMonthTo?: string;
};

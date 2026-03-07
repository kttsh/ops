import { z } from "zod";
import type { SoftDeletableEntity } from "@/lib/types/base-entity";

// --- 共通型を共有レイヤーから re-export ---
export type {
	PaginatedResponse,
	ProblemDetails,
	SelectOption,
	SingleResponse,
} from "@/lib/api";

// --- API レスポンス型 ---

export interface StandardEffortMaster extends SoftDeletableEntity {
	standardEffortId: number;
	businessUnitCode: string;
	projectTypeCode: string;
	name: string;
}

export type StandardEffortWeight = {
	standardEffortWeightId: number;
	progressRate: number;
	weight: number;
};

export type StandardEffortMasterDetail = StandardEffortMaster & {
	weights: StandardEffortWeight[];
};

// --- 入力型 ---

export type WeightInput = {
	progressRate: number;
	weight: number;
};

// --- 定数 ---

export const PROGRESS_RATES = Array.from({ length: 21 }, (_, i) => i * 5);

export const DEFAULT_WEIGHTS: WeightInput[] = PROGRESS_RATES.map((rate) => ({
	progressRate: rate,
	weight: 0,
}));

// --- Zod スキーマ ---

export const weightInputSchema = z.object({
	progressRate: z.number().int().min(0).max(100),
	weight: z.number().int().min(0, "重みは0以上の整数で入力してください"),
});

export const createStandardEffortMasterSchema = z.object({
	businessUnitCode: z.string().min(1, "事業部は必須です"),
	projectTypeCode: z.string().min(1, "案件タイプは必須です"),
	name: z
		.string()
		.min(1, "パターン名は必須です")
		.max(100, "パターン名は100文字以内で入力してください"),
	weights: z
		.array(weightInputSchema)
		.length(21, "重みは21区間すべて入力してください"),
});

export const updateStandardEffortMasterSchema = z.object({
	name: z
		.string()
		.min(1, "パターン名は必須です")
		.max(100, "パターン名は100文字以内で入力してください"),
	weights: z
		.array(weightInputSchema)
		.length(21, "重みは21区間すべて入力してください"),
});

export const standardEffortMasterSearchSchema = z.object({
	page: z.number().int().positive().catch(1).default(1),
	pageSize: z.number().int().min(1).max(100).catch(20).default(20),
	search: z.string().catch("").default(""),
	includeDisabled: z.boolean().catch(false).default(false),
	businessUnitCode: z.string().catch("").default(""),
	projectTypeCode: z.string().catch("").default(""),
});

// --- 推論型 ---

export type CreateStandardEffortMasterInput = z.infer<
	typeof createStandardEffortMasterSchema
>;
export type UpdateStandardEffortMasterInput = z.infer<
	typeof updateStandardEffortMasterSchema
>;
export type StandardEffortMasterSearchParams = z.infer<
	typeof standardEffortMasterSearchSchema
>;

// --- API パラメータ型 ---

export type StandardEffortMasterListParams = {
	page: number;
	pageSize: number;
	includeDisabled: boolean;
	businessUnitCode: string;
	projectTypeCode: string;
};

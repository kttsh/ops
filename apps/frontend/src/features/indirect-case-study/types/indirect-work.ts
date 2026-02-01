import { z } from "zod";

// --- API レスポンス型 ---

export type IndirectWorkCase = {
	indirectWorkCaseId: number;
	caseName: string;
	isPrimary: boolean;
	description: string | null;
	businessUnitCode: string;
	businessUnitName: string | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
};

export type IndirectWorkTypeRatio = {
	indirectWorkTypeRatioId: number;
	indirectWorkCaseId: number;
	workTypeCode: string;
	fiscalYear: number;
	ratio: number;
	createdAt: string;
	updatedAt: string;
};

export type MonthlyIndirectWorkLoad = {
	monthlyIndirectWorkLoadId: number;
	indirectWorkCaseId: number;
	businessUnitCode: string;
	yearMonth: string;
	manhour: number;
	source: "calculated" | "manual";
	createdAt: string;
	updatedAt: string;
};

// --- Zod スキーマ ---

export const createIndirectWorkCaseSchema = z.object({
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

export const updateIndirectWorkCaseSchema = z.object({
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

/** UI上は0〜100%で入力し、API送信時に0〜1に変換する */
export const indirectWorkRatioInputSchema = z.object({
	workTypeCode: z.string(),
	fiscalYear: z.number().int(),
	ratio: z
		.number()
		.min(0, "0〜100%の範囲で入力してください")
		.max(100, "0〜100%の範囲で入力してください"),
});

export const bulkIndirectWorkRatioSchema = z.object({
	items: z.array(
		z.object({
			workTypeCode: z.string(),
			fiscalYear: z.number().int(),
			ratio: z
				.number()
				.min(0, "0〜1の範囲で入力してください")
				.max(1, "0〜1の範囲で入力してください"),
		}),
	),
});

export const bulkMonthlyIndirectWorkLoadSchema = z.object({
	items: z.array(
		z.object({
			businessUnitCode: z.string(),
			yearMonth: z.string(),
			manhour: z.number().min(0),
			source: z.enum(["calculated", "manual"]),
		}),
	),
});

// --- 入力型 ---

export type CreateIndirectWorkCaseInput = z.infer<
	typeof createIndirectWorkCaseSchema
>;
export type UpdateIndirectWorkCaseInput = z.infer<
	typeof updateIndirectWorkCaseSchema
>;
export type IndirectWorkRatioInput = z.infer<
	typeof indirectWorkRatioInputSchema
>;
export type BulkIndirectWorkRatioInput = z.infer<
	typeof bulkIndirectWorkRatioSchema
>;
export type BulkMonthlyIndirectWorkLoadInput = z.infer<
	typeof bulkMonthlyIndirectWorkLoadSchema
>;

// --- API パラメータ型 ---

export type IndirectWorkCaseListParams = {
	businessUnitCode?: string;
	includeDisabled?: boolean;
};

import { z } from "zod";
import { includeDisabledFilterSchema } from "@/types/common";
import { paginationQuerySchema } from "@/types/pagination";

// --- Zod Schemas ---

/** Weight item schema */
export const weightItemSchema = z.object({
	progressRate: z.number().int().min(0).max(100),
	weight: z.number().int().min(0),
});

/** Create schema */
export const createStandardEffortMasterSchema = z.object({
	businessUnitCode: z
		.string()
		.min(1)
		.max(20)
		.regex(/^[a-zA-Z0-9_-]+$/),
	projectTypeCode: z
		.string()
		.min(1)
		.max(20)
		.regex(/^[a-zA-Z0-9_-]+$/),
	name: z.string().min(1).max(100),
	weights: z.array(weightItemSchema).optional(),
});

/** Update schema */
export const updateStandardEffortMasterSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	weights: z.array(weightItemSchema).optional(),
});

/** List query schema */
export const standardEffortMasterListQuerySchema = paginationQuerySchema.extend(
	{
		"filter[includeDisabled]": includeDisabledFilterSchema,
		"filter[businessUnitCode]": z.string().optional(),
		"filter[projectTypeCode]": z.string().optional(),
	},
);

// --- TypeScript Types ---

export type WeightItem = z.infer<typeof weightItemSchema>;
export type CreateStandardEffortMaster = z.infer<
	typeof createStandardEffortMasterSchema
>;
export type UpdateStandardEffortMaster = z.infer<
	typeof updateStandardEffortMasterSchema
>;
export type StandardEffortMasterListQuery = z.infer<
	typeof standardEffortMasterListQuerySchema
>;

/** DB row type - master (snake_case) */
export type StandardEffortMasterRow = {
	standard_effort_id: number;
	business_unit_code: string;
	project_type_code: string;
	name: string;
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
};

/** DB row type - weight (snake_case) */
export type StandardEffortWeightRow = {
	standard_effort_weight_id: number;
	standard_effort_id: number;
	progress_rate: number;
	weight: number;
	created_at: Date;
	updated_at: Date;
};

/** API response type - master summary (camelCase, for list) */
export type StandardEffortMasterSummary = {
	standardEffortId: number;
	businessUnitCode: string;
	projectTypeCode: string;
	name: string;
	createdAt: string;
	updatedAt: string;
};

/** API response type - weight (camelCase) */
export type StandardEffortWeight = {
	standardEffortWeightId: number;
	progressRate: number;
	weight: number;
};

/** API response type - master detail (camelCase, with weights) */
export type StandardEffortMasterDetail = StandardEffortMasterSummary & {
	weights: StandardEffortWeight[];
};

// --- Bulk Import/Export ---

/** Bulk import item schema */
export const bulkImportItemSchema = z.object({
	standardEffortId: z.number().int().positive(),
	weights: z.array(weightItemSchema).min(1),
});

/** Bulk import request schema */
export const bulkImportStandardEffortSchema = z.object({
	items: z.array(bulkImportItemSchema).min(1),
});

export type BulkImportItem = z.infer<typeof bulkImportItemSchema>;
export type BulkImportStandardEffort = z.infer<
	typeof bulkImportStandardEffortSchema
>;

/** Bulk export row type */
export type StandardEffortExportRow = {
	standardEffortId: number;
	name: string;
	businessUnitCode: string;
	projectTypeCode: string;
	weights: Array<{ progressRate: number; weight: number }>;
};

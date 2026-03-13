import { z } from "zod";
import {
	codeSchema,
	colorCodeSchema,
	displayOrderSchema,
	nameSchema,
} from "@/lib/schemas/master-entity-schema";
import type { MasterEntity } from "@/lib/types/base-entity";
// --- API レスポンス型 ---

export interface WorkType extends MasterEntity {
	workTypeCode: string;
	color: string | null;
}

// --- Zod スキーマ ---

export const createWorkTypeSchema = z.object({
	workTypeCode: codeSchema,
	name: nameSchema,
	displayOrder: displayOrderSchema.default(0),
	color: colorCodeSchema,
});

export const updateWorkTypeSchema = z.object({
	name: nameSchema,
	displayOrder: displayOrderSchema.optional(),
	color: colorCodeSchema,
});

export const workTypeSearchSchema = z.object({
	search: z.string().catch("").default(""),
	includeDisabled: z.boolean().catch(false).default(false),
});

// --- 入力型 ---

export type CreateWorkTypeInput = z.infer<typeof createWorkTypeSchema>;
export type UpdateWorkTypeInput = z.infer<typeof updateWorkTypeSchema>;
export type WorkTypeSearchParams = z.infer<typeof workTypeSearchSchema>;

// --- API パラメータ型 ---

export type WorkTypeListParams = {
	includeDisabled: boolean;
};

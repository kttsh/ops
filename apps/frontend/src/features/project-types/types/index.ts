import { z } from "zod";
import {
	codeSchema,
	displayOrderSchema,
	nameSchema,
} from "@/lib/schemas/master-entity-schema";
import type { MasterEntity } from "@/lib/types/base-entity";

// --- 共通型を共有レイヤーから re-export ---
export type {
	PaginatedResponse,
	ProblemDetails,
	SelectOption,
	SingleResponse,
} from "@/lib/api";

// --- API レスポンス型 ---

export interface ProjectType extends MasterEntity {
	projectTypeCode: string;
}

// --- Zod スキーマ ---

export const createProjectTypeSchema = z.object({
	projectTypeCode: codeSchema,
	name: nameSchema,
	displayOrder: displayOrderSchema.default(0),
});

export const updateProjectTypeSchema = z.object({
	name: nameSchema,
	displayOrder: displayOrderSchema.optional(),
});

export const projectTypeSearchSchema = z.object({
	search: z.string().catch("").default(""),
	includeDisabled: z.boolean().catch(false).default(false),
});

// --- 入力型 ---

export type CreateProjectTypeInput = z.infer<typeof createProjectTypeSchema>;
export type UpdateProjectTypeInput = z.infer<typeof updateProjectTypeSchema>;
export type ProjectTypeSearchParams = z.infer<typeof projectTypeSearchSchema>;

// --- API パラメータ型 ---

export type ProjectTypeListParams = {
	includeDisabled: boolean;
};

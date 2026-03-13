import { z } from "zod";
import {
	codeSchema,
	displayOrderSchema,
	nameSchema,
} from "@/lib/schemas/master-entity-schema";
import type { MasterEntity } from "@/lib/types/base-entity";
// --- API レスポンス型 ---

export interface BusinessUnit extends MasterEntity {
	businessUnitCode: string;
}

// --- Zod スキーマ ---

export const createBusinessUnitSchema = z.object({
	businessUnitCode: codeSchema,
	name: nameSchema,
	displayOrder: displayOrderSchema.default(0),
});

export const updateBusinessUnitSchema = z.object({
	name: nameSchema,
	displayOrder: displayOrderSchema.optional(),
});

export const businessUnitSearchSchema = z.object({
	page: z.number().int().positive().catch(1).default(1),
	pageSize: z.number().int().min(1).max(100).catch(20).default(20),
	search: z.string().catch("").default(""),
	includeDisabled: z.boolean().catch(false).default(false),
});

// --- 入力型 ---

export type CreateBusinessUnitInput = z.infer<typeof createBusinessUnitSchema>;
export type UpdateBusinessUnitInput = z.infer<typeof updateBusinessUnitSchema>;
export type BusinessUnitSearchParams = z.infer<typeof businessUnitSearchSchema>;

// --- API パラメータ型 ---

export type BusinessUnitListParams = {
	page: number;
	pageSize: number;
	includeDisabled: boolean;
};

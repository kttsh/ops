import { z } from "zod";
import {
	businessUnitCodeSchema,
	includeDisabledFilterSchema,
} from "@/types/common";
import { paginationQuerySchema } from "@/types/pagination";

// --- Zod スキーマ ---

/** 作成用スキーマ */
export const createBusinessUnitSchema = z.object({
	businessUnitCode: businessUnitCodeSchema,
	name: z.string().min(1).max(100),
	displayOrder: z.number().int().min(0).default(0),
});

/** 更新用スキーマ */
export const updateBusinessUnitSchema = z.object({
	name: z.string().min(1).max(100),
	displayOrder: z.number().int().min(0).optional(),
});

/** 一覧取得クエリスキーマ（ページネーション + フィルタ） */
export const businessUnitListQuerySchema = paginationQuerySchema.extend({
	"filter[includeDisabled]": includeDisabledFilterSchema,
});

// --- TypeScript 型 ---

/** 作成リクエスト型 */
export type CreateBusinessUnit = z.infer<typeof createBusinessUnitSchema>;

/** 更新リクエスト型 */
export type UpdateBusinessUnit = z.infer<typeof updateBusinessUnitSchema>;

/** 一覧取得クエリ型 */
export type BusinessUnitListQuery = z.infer<typeof businessUnitListQuerySchema>;

/** DB 行型（snake_case — DB のカラム名そのまま） */
export type BusinessUnitRow = {
	business_unit_code: string;
	name: string;
	display_order: number;
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
};

/** API レスポンス型（camelCase） */
export type BusinessUnit = {
	businessUnitCode: string;
	name: string;
	displayOrder: number;
	createdAt: string;
	updatedAt: string;
};

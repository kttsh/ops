import { HTTPException } from "hono/http-exception";
import { workTypeData } from "@/data/workTypeData";
import { toWorkTypeResponse } from "@/transform/workTypeTransform";
import type {
	CreateWorkType,
	UpdateWorkType,
	WorkType,
} from "@/types/workType";

export const workTypeService = {
	async findAll(params: {
		page: number;
		pageSize: number;
		includeDisabled: boolean;
	}): Promise<{ items: WorkType[]; totalCount: number }> {
		const result = await workTypeData.findAll(params);
		return {
			items: result.items.map(toWorkTypeResponse),
			totalCount: result.totalCount,
		};
	},

	async findByCode(code: string): Promise<WorkType> {
		const row = await workTypeData.findByCode(code);
		if (!row) {
			throw new HTTPException(404, {
				message: `Work type with code '${code}' not found`,
			});
		}
		return toWorkTypeResponse(row);
	},

	async create(data: CreateWorkType): Promise<WorkType> {
		const existing = await workTypeData.findByCodeIncludingDeleted(
			data.workTypeCode,
		);
		if (existing) {
			const detail = existing.deleted_at
				? `Work type with code '${data.workTypeCode}' already exists (soft-deleted). Use restore to reactivate it.`
				: `Work type with code '${data.workTypeCode}' already exists`;
			throw new HTTPException(409, { message: detail });
		}
		const created = await workTypeData.create({
			workTypeCode: data.workTypeCode,
			name: data.name,
			displayOrder: data.displayOrder,
			color: data.color ?? null,
		});
		return toWorkTypeResponse(created);
	},

	async update(code: string, data: UpdateWorkType): Promise<WorkType> {
		const updated = await workTypeData.update(code, data);
		if (!updated) {
			throw new HTTPException(404, {
				message: `Work type with code '${code}' not found`,
			});
		}
		return toWorkTypeResponse(updated);
	},

	async delete(code: string): Promise<void> {
		const hasRefs = await workTypeData.hasReferences(code);
		if (hasRefs) {
			throw new HTTPException(409, {
				message: `Work type with code '${code}' is referenced by other resources and cannot be deleted`,
			});
		}
		const deleted = await workTypeData.softDelete(code);
		if (!deleted) {
			throw new HTTPException(404, {
				message: `Work type with code '${code}' not found`,
			});
		}
	},

	async restore(code: string): Promise<WorkType> {
		const existing = await workTypeData.findByCodeIncludingDeleted(code);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Work type with code '${code}' not found`,
			});
		}
		if (!existing.deleted_at) {
			throw new HTTPException(409, {
				message: `Work type with code '${code}' is not soft-deleted`,
			});
		}
		const restored = await workTypeData.restore(code);
		return toWorkTypeResponse(restored!);
	},
};

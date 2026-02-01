import { HTTPException } from "hono/http-exception";
import { projectTypeData } from "@/data/projectTypeData";
import { toProjectTypeResponse } from "@/transform/projectTypeTransform";
import type {
	CreateProjectType,
	ProjectType,
	UpdateProjectType,
} from "@/types/projectType";

export const projectTypeService = {
	async findAll(params: {
		page: number;
		pageSize: number;
		includeDisabled: boolean;
	}): Promise<{ items: ProjectType[]; totalCount: number }> {
		const result = await projectTypeData.findAll(params);
		return {
			items: result.items.map(toProjectTypeResponse),
			totalCount: result.totalCount,
		};
	},

	async findByCode(code: string): Promise<ProjectType> {
		const row = await projectTypeData.findByCode(code);
		if (!row) {
			throw new HTTPException(404, {
				message: `Project type with code '${code}' not found`,
			});
		}
		return toProjectTypeResponse(row);
	},

	async create(data: CreateProjectType): Promise<ProjectType> {
		const existing = await projectTypeData.findByCodeIncludingDeleted(
			data.projectTypeCode,
		);
		if (existing) {
			const detail = existing.deleted_at
				? `Project type with code '${data.projectTypeCode}' already exists (soft-deleted). Use restore to reactivate it.`
				: `Project type with code '${data.projectTypeCode}' already exists`;
			throw new HTTPException(409, { message: detail });
		}
		const created = await projectTypeData.create(data);
		return toProjectTypeResponse(created);
	},

	async update(code: string, data: UpdateProjectType): Promise<ProjectType> {
		const updated = await projectTypeData.update(code, data);
		if (!updated) {
			throw new HTTPException(404, {
				message: `Project type with code '${code}' not found`,
			});
		}
		return toProjectTypeResponse(updated);
	},

	async delete(code: string): Promise<void> {
		const hasRefs = await projectTypeData.hasReferences(code);
		if (hasRefs) {
			throw new HTTPException(409, {
				message: `Project type with code '${code}' is referenced by other resources and cannot be deleted`,
			});
		}
		const deleted = await projectTypeData.softDelete(code);
		if (!deleted) {
			throw new HTTPException(404, {
				message: `Project type with code '${code}' not found`,
			});
		}
	},

	async restore(code: string): Promise<ProjectType> {
		const existing = await projectTypeData.findByCodeIncludingDeleted(code);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Project type with code '${code}' not found`,
			});
		}
		if (!existing.deleted_at) {
			throw new HTTPException(409, {
				message: `Project type with code '${code}' is not soft-deleted`,
			});
		}
		const restored = await projectTypeData.restore(code);
		return toProjectTypeResponse(restored!);
	},
};

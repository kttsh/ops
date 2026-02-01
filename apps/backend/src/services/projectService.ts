import { HTTPException } from "hono/http-exception";
import { businessUnitData } from "@/data/businessUnitData";
import { projectData } from "@/data/projectData";
import { projectTypeData } from "@/data/projectTypeData";
import { toProjectResponse } from "@/transform/projectTransform";
import type { CreateProject, Project, UpdateProject } from "@/types/project";

export const projectService = {
	async findAll(params: {
		page: number;
		pageSize: number;
		includeDisabled: boolean;
		businessUnitCodes?: string[];
		status?: string;
	}): Promise<{ items: Project[]; totalCount: number }> {
		const result = await projectData.findAll(params);
		return {
			items: result.items.map(toProjectResponse),
			totalCount: result.totalCount,
		};
	},

	async findById(id: number): Promise<Project> {
		const row = await projectData.findById(id);
		if (!row) {
			throw new HTTPException(404, {
				message: `Project with ID '${id}' not found`,
			});
		}
		return toProjectResponse(row);
	},

	async create(data: CreateProject): Promise<Project> {
		// businessUnitCode の存在チェック
		const bu = await businessUnitData.findByCode(data.businessUnitCode);
		if (!bu) {
			throw new HTTPException(422, {
				message: `Business unit with code '${data.businessUnitCode}' not found`,
			});
		}

		// projectTypeCode の存在チェック（指定された場合）
		if (data.projectTypeCode) {
			const pt = await projectTypeData.findByCode(data.projectTypeCode);
			if (!pt) {
				throw new HTTPException(422, {
					message: `Project type with code '${data.projectTypeCode}' not found`,
				});
			}
		}

		// projectCode の重複チェック
		const existing = await projectData.findByProjectCode(data.projectCode);
		if (existing) {
			throw new HTTPException(409, {
				message: `Project with code '${data.projectCode}' already exists`,
			});
		}

		const created = await projectData.create(data);
		return toProjectResponse(created);
	},

	async update(id: number, data: UpdateProject): Promise<Project> {
		// 対象案件の存在チェック
		const existing = await projectData.findById(id);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Project with ID '${id}' not found`,
			});
		}

		// businessUnitCode の存在チェック（指定された場合）
		if (data.businessUnitCode) {
			const bu = await businessUnitData.findByCode(data.businessUnitCode);
			if (!bu) {
				throw new HTTPException(422, {
					message: `Business unit with code '${data.businessUnitCode}' not found`,
				});
			}
		}

		// projectTypeCode の存在チェック（指定された場合、null以外）
		if (data.projectTypeCode !== undefined && data.projectTypeCode !== null) {
			const pt = await projectTypeData.findByCode(data.projectTypeCode);
			if (!pt) {
				throw new HTTPException(422, {
					message: `Project type with code '${data.projectTypeCode}' not found`,
				});
			}
		}

		// projectCode の重複チェック（変更される場合、自身を除外）
		if (data.projectCode) {
			const duplicated = await projectData.findByProjectCode(data.projectCode);
			if (duplicated && duplicated.project_id !== id) {
				throw new HTTPException(409, {
					message: `Project with code '${data.projectCode}' already exists`,
				});
			}
		}

		const updated = await projectData.update(
			id,
			data as Record<string, unknown>,
		);
		if (!updated) {
			throw new HTTPException(404, {
				message: `Project with ID '${id}' not found`,
			});
		}
		return toProjectResponse(updated);
	},

	async delete(id: number): Promise<void> {
		const existing = await projectData.findById(id);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Project with ID '${id}' not found`,
			});
		}

		const hasRefs = await projectData.hasReferences(id);
		if (hasRefs) {
			throw new HTTPException(409, {
				message: `Project with ID '${id}' is referenced by other resources and cannot be deleted`,
			});
		}

		await projectData.softDelete(id);
	},

	async restore(id: number): Promise<Project> {
		const existing = await projectData.findByIdIncludingDeleted(id);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Project with ID '${id}' not found`,
			});
		}
		if (!existing.deleted_at) {
			throw new HTTPException(409, {
				message: `Project with ID '${id}' is not soft-deleted`,
			});
		}

		// 復元時の projectCode 重複チェック
		const duplicated = await projectData.findByProjectCode(
			existing.project_code,
		);
		if (duplicated) {
			throw new HTTPException(409, {
				message: `Project with code '${existing.project_code}' conflicts with an existing active project`,
			});
		}

		const restored = await projectData.restore(id);
		return toProjectResponse(restored!);
	},
};

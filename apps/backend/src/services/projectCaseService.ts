import { HTTPException } from "hono/http-exception";
import { projectCaseData } from "@/data/projectCaseData";
import { toProjectCaseResponse } from "@/transform/projectCaseTransform";
import type {
	CreateProjectCase,
	ProjectCase,
	UpdateProjectCase,
} from "@/types/projectCase";

export const projectCaseService = {
	async findAll(params: {
		projectId: number;
		page: number;
		pageSize: number;
		includeDisabled: boolean;
	}): Promise<{ items: ProjectCase[]; totalCount: number }> {
		const exists = await projectCaseData.projectExists(params.projectId);
		if (!exists) {
			throw new HTTPException(404, {
				message: `Project with ID '${params.projectId}' not found`,
			});
		}

		const result = await projectCaseData.findAll(params);
		return {
			items: result.items.map(toProjectCaseResponse),
			totalCount: result.totalCount,
		};
	},

	async findById(
		projectId: number,
		projectCaseId: number,
	): Promise<ProjectCase> {
		const row = await projectCaseData.findById(projectCaseId);
		if (!row) {
			throw new HTTPException(404, {
				message: `Project case with ID '${projectCaseId}' not found`,
			});
		}
		if (row.project_id !== projectId) {
			throw new HTTPException(404, {
				message: `Project case with ID '${projectCaseId}' not found`,
			});
		}
		return toProjectCaseResponse(row);
	},

	async create(
		projectId: number,
		data: CreateProjectCase,
	): Promise<ProjectCase> {
		const exists = await projectCaseData.projectExists(projectId);
		if (!exists) {
			throw new HTTPException(404, {
				message: `Project with ID '${projectId}' not found`,
			});
		}

		if (data.calculationType === "STANDARD" && !data.standardEffortId) {
			throw new HTTPException(422, {
				message:
					"standardEffortId is required when calculationType is STANDARD",
			});
		}

		if (data.standardEffortId) {
			const seExists = await projectCaseData.standardEffortExists(
				data.standardEffortId,
			);
			if (!seExists) {
				throw new HTTPException(422, {
					message: `Standard effort with ID '${data.standardEffortId}' not found`,
				});
			}
		}

		const created = await projectCaseData.create({
			projectId,
			caseName: data.caseName,
			isPrimary: data.isPrimary,
			description: data.description ?? null,
			calculationType: data.calculationType,
			standardEffortId: data.standardEffortId ?? null,
			startYearMonth: data.startYearMonth ?? null,
			durationMonths: data.durationMonths ?? null,
			totalManhour: data.totalManhour ?? null,
		});
		return toProjectCaseResponse(created);
	},

	async update(
		projectId: number,
		projectCaseId: number,
		data: UpdateProjectCase,
	): Promise<ProjectCase> {
		const existing = await projectCaseData.findById(projectCaseId);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Project case with ID '${projectCaseId}' not found`,
			});
		}
		if (existing.project_id !== projectId) {
			throw new HTTPException(404, {
				message: `Project case with ID '${projectCaseId}' not found`,
			});
		}

		const effectiveCalculationType =
			data.calculationType ?? existing.calculation_type;
		const effectiveStandardEffortId =
			data.standardEffortId !== undefined
				? data.standardEffortId
				: existing.standard_effort_id;

		if (effectiveCalculationType === "STANDARD" && !effectiveStandardEffortId) {
			throw new HTTPException(422, {
				message:
					"standardEffortId is required when calculationType is STANDARD",
			});
		}

		if (data.standardEffortId) {
			const seExists = await projectCaseData.standardEffortExists(
				data.standardEffortId,
			);
			if (!seExists) {
				throw new HTTPException(422, {
					message: `Standard effort with ID '${data.standardEffortId}' not found`,
				});
			}
		}

		const updated = await projectCaseData.update(projectCaseId, data);
		if (!updated) {
			throw new HTTPException(404, {
				message: `Project case with ID '${projectCaseId}' not found`,
			});
		}
		return toProjectCaseResponse(updated);
	},

	async delete(projectId: number, projectCaseId: number): Promise<void> {
		const existing = await projectCaseData.findById(projectCaseId);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Project case with ID '${projectCaseId}' not found`,
			});
		}
		if (existing.project_id !== projectId) {
			throw new HTTPException(404, {
				message: `Project case with ID '${projectCaseId}' not found`,
			});
		}

		const hasRefs = await projectCaseData.hasReferences(projectCaseId);
		if (hasRefs) {
			throw new HTTPException(409, {
				message: `Project case with ID '${projectCaseId}' is referenced by other resources and cannot be deleted`,
			});
		}

		await projectCaseData.softDelete(projectCaseId);
	},

	async restore(
		projectId: number,
		projectCaseId: number,
	): Promise<ProjectCase> {
		const existing =
			await projectCaseData.findByIdIncludingDeleted(projectCaseId);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Project case with ID '${projectCaseId}' not found`,
			});
		}
		if (existing.project_id !== projectId) {
			throw new HTTPException(404, {
				message: `Project case with ID '${projectCaseId}' not found`,
			});
		}
		if (!existing.deleted_at) {
			throw new HTTPException(409, {
				message: `Project case with ID '${projectCaseId}' is not soft-deleted`,
			});
		}

		const restored = await projectCaseData.restore(projectCaseId);
		return toProjectCaseResponse(restored!);
	},
};

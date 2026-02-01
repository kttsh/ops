import { HTTPException } from "hono/http-exception";
import { projectChangeHistoryData } from "@/data/projectChangeHistoryData";
import { toProjectChangeHistoryResponse } from "@/transform/projectChangeHistoryTransform";
import type {
	CreateProjectChangeHistory,
	ProjectChangeHistory,
} from "@/types/projectChangeHistory";

export const projectChangeHistoryService = {
	async findAll(projectId: number): Promise<ProjectChangeHistory[]> {
		const exists = await projectChangeHistoryData.projectExists(projectId);
		if (!exists) {
			throw new HTTPException(404, {
				message: `Project with ID '${projectId}' not found`,
			});
		}

		const rows = await projectChangeHistoryData.findAll(projectId);
		return rows.map(toProjectChangeHistoryResponse);
	},

	async findById(
		projectId: number,
		projectChangeHistoryId: number,
	): Promise<ProjectChangeHistory> {
		const row = await projectChangeHistoryData.findById(projectChangeHistoryId);
		if (!row) {
			throw new HTTPException(404, {
				message: `Project change history with ID '${projectChangeHistoryId}' not found`,
			});
		}
		if (row.project_id !== projectId) {
			throw new HTTPException(404, {
				message: `Project change history with ID '${projectChangeHistoryId}' not found`,
			});
		}
		return toProjectChangeHistoryResponse(row);
	},

	async create(
		projectId: number,
		data: CreateProjectChangeHistory,
	): Promise<ProjectChangeHistory> {
		const exists = await projectChangeHistoryData.projectExists(projectId);
		if (!exists) {
			throw new HTTPException(404, {
				message: `Project with ID '${projectId}' not found`,
			});
		}

		const created = await projectChangeHistoryData.create({
			projectId,
			changeType: data.changeType,
			fieldName: data.fieldName,
			oldValue: data.oldValue,
			newValue: data.newValue,
			changedBy: data.changedBy,
		});
		return toProjectChangeHistoryResponse(created);
	},

	async delete(
		projectId: number,
		projectChangeHistoryId: number,
	): Promise<void> {
		const row = await projectChangeHistoryData.findById(projectChangeHistoryId);
		if (!row) {
			throw new HTTPException(404, {
				message: `Project change history with ID '${projectChangeHistoryId}' not found`,
			});
		}
		if (row.project_id !== projectId) {
			throw new HTTPException(404, {
				message: `Project change history with ID '${projectChangeHistoryId}' not found`,
			});
		}

		await projectChangeHistoryData.deleteById(projectChangeHistoryId);
	},
};

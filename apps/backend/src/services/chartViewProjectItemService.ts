import { HTTPException } from "hono/http-exception";
import { chartViewProjectItemData } from "@/data/chartViewProjectItemData";
import { toChartViewProjectItemResponse } from "@/transform/chartViewProjectItemTransform";
import type {
	BulkUpsertChartViewProjectItem,
	ChartViewProjectItem,
	CreateChartViewProjectItem,
	UpdateChartViewProjectItem,
	UpdateDisplayOrder,
} from "@/types/chartViewProjectItem";

export const chartViewProjectItemService = {
	async findAll(chartViewId: number): Promise<ChartViewProjectItem[]> {
		const exists = await chartViewProjectItemData.chartViewExists(chartViewId);
		if (!exists) {
			throw new HTTPException(404, {
				message: `Chart view with ID '${chartViewId}' not found`,
			});
		}

		const rows = await chartViewProjectItemData.findAll(chartViewId);
		return rows.map(toChartViewProjectItemResponse);
	},

	async findById(
		chartViewId: number,
		id: number,
	): Promise<ChartViewProjectItem> {
		const row = await chartViewProjectItemData.findById(id);
		if (!row) {
			throw new HTTPException(404, {
				message: `Chart view project item with ID '${id}' not found`,
			});
		}
		if (row.chart_view_id !== chartViewId) {
			throw new HTTPException(404, {
				message: `Chart view project item with ID '${id}' not found`,
			});
		}
		return toChartViewProjectItemResponse(row);
	},

	async create(
		chartViewId: number,
		data: CreateChartViewProjectItem,
	): Promise<ChartViewProjectItem> {
		const chartViewExists =
			await chartViewProjectItemData.chartViewExists(chartViewId);
		if (!chartViewExists) {
			throw new HTTPException(404, {
				message: `Chart view with ID '${chartViewId}' not found`,
			});
		}

		const projectExists = await chartViewProjectItemData.projectExists(
			data.projectId,
		);
		if (!projectExists) {
			throw new HTTPException(422, {
				message: `Project with ID '${data.projectId}' not found`,
			});
		}

		if (data.projectCaseId != null) {
			const caseBelongs =
				await chartViewProjectItemData.projectCaseBelongsToProject(
					data.projectCaseId,
					data.projectId,
				);
			if (!caseBelongs) {
				throw new HTTPException(422, {
					message: `Project case with ID '${data.projectCaseId}' not found or does not belong to project '${data.projectId}'`,
				});
			}
		}

		const created = await chartViewProjectItemData.create({
			chartViewId,
			projectId: data.projectId,
			projectCaseId: data.projectCaseId ?? null,
			displayOrder: data.displayOrder,
			isVisible: data.isVisible,
			color: data.color ?? null,
		});
		return toChartViewProjectItemResponse(created);
	},

	async update(
		chartViewId: number,
		id: number,
		data: UpdateChartViewProjectItem,
	): Promise<ChartViewProjectItem> {
		const existing = await chartViewProjectItemData.findById(id);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Chart view project item with ID '${id}' not found`,
			});
		}
		if (existing.chart_view_id !== chartViewId) {
			throw new HTTPException(404, {
				message: `Chart view project item with ID '${id}' not found`,
			});
		}

		if (data.projectCaseId !== undefined && data.projectCaseId !== null) {
			const caseBelongs =
				await chartViewProjectItemData.projectCaseBelongsToProject(
					data.projectCaseId,
					existing.project_id,
				);
			if (!caseBelongs) {
				throw new HTTPException(422, {
					message: `Project case with ID '${data.projectCaseId}' not found or does not belong to project '${existing.project_id}'`,
				});
			}
		}

		const updated = await chartViewProjectItemData.update(id, data);
		if (!updated) {
			throw new HTTPException(404, {
				message: `Chart view project item with ID '${id}' not found`,
			});
		}
		return toChartViewProjectItemResponse(updated);
	},

	async delete(chartViewId: number, id: number): Promise<void> {
		const existing = await chartViewProjectItemData.findById(id);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Chart view project item with ID '${id}' not found`,
			});
		}
		if (existing.chart_view_id !== chartViewId) {
			throw new HTTPException(404, {
				message: `Chart view project item with ID '${id}' not found`,
			});
		}

		await chartViewProjectItemData.deleteById(id);
	},

	async bulkUpsert(
		chartViewId: number,
		data: BulkUpsertChartViewProjectItem,
	): Promise<ChartViewProjectItem[]> {
		const chartViewExists =
			await chartViewProjectItemData.chartViewExists(chartViewId);
		if (!chartViewExists) {
			throw new HTTPException(404, {
				message: `Chart view with ID '${chartViewId}' not found`,
			});
		}

		for (const item of data.items) {
			const projectExists = await chartViewProjectItemData.projectExists(
				item.projectId,
			);
			if (!projectExists) {
				throw new HTTPException(422, {
					message: `Project with ID '${item.projectId}' not found`,
				});
			}

			if (item.projectCaseId != null) {
				const caseBelongs =
					await chartViewProjectItemData.projectCaseBelongsToProject(
						item.projectCaseId,
						item.projectId,
					);
				if (!caseBelongs) {
					throw new HTTPException(422, {
						message: `Project case with ID '${item.projectCaseId}' not found or does not belong to project '${item.projectId}'`,
					});
				}
			}
		}

		const rows = await chartViewProjectItemData.bulkUpsert(
			chartViewId,
			data.items.map((item) => ({
				projectId: item.projectId,
				projectCaseId: item.projectCaseId ?? null,
				displayOrder: item.displayOrder,
				isVisible: item.isVisible,
				color: item.color ?? null,
			})),
		);
		return rows.map(toChartViewProjectItemResponse);
	},

	async updateDisplayOrder(
		chartViewId: number,
		data: UpdateDisplayOrder,
	): Promise<ChartViewProjectItem[]> {
		const chartViewExists =
			await chartViewProjectItemData.chartViewExists(chartViewId);
		if (!chartViewExists) {
			throw new HTTPException(404, {
				message: `Chart view with ID '${chartViewId}' not found`,
			});
		}

		for (const item of data.items) {
			const row = await chartViewProjectItemData.findById(
				item.chartViewProjectItemId,
			);
			if (!row || row.chart_view_id !== chartViewId) {
				throw new HTTPException(422, {
					message: `Chart view project item with ID '${item.chartViewProjectItemId}' does not belong to chart view '${chartViewId}'`,
				});
			}
		}

		await chartViewProjectItemData.updateDisplayOrders(data.items);

		const rows = await chartViewProjectItemData.findAll(chartViewId);
		return rows.map(toChartViewProjectItemResponse);
	},
};

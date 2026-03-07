import { HTTPException } from "hono/http-exception";
import { chartViewCapacityItemData } from "@/data/chartViewCapacityItemData";
import { toChartViewCapacityItemResponse } from "@/transform/chartViewCapacityItemTransform";
import type {
	BulkUpsertChartViewCapacityItem,
	ChartViewCapacityItem,
} from "@/types/chartViewCapacityItem";

export const chartViewCapacityItemService = {
	async findAll(chartViewId: number): Promise<ChartViewCapacityItem[]> {
		const exists = await chartViewCapacityItemData.chartViewExists(chartViewId);
		if (!exists) {
			throw new HTTPException(404, {
				message: `Chart view with ID '${chartViewId}' not found`,
			});
		}

		const rows = await chartViewCapacityItemData.findAll(chartViewId);
		return rows.map(toChartViewCapacityItemResponse);
	},

	async bulkUpsert(
		chartViewId: number,
		data: BulkUpsertChartViewCapacityItem,
	): Promise<ChartViewCapacityItem[]> {
		const chartViewExists =
			await chartViewCapacityItemData.chartViewExists(chartViewId);
		if (!chartViewExists) {
			throw new HTTPException(404, {
				message: `Chart view with ID '${chartViewId}' not found`,
			});
		}

		// items 内のシナリオID重複チェック
		const scenarioIds = data.items.map((item) => item.capacityScenarioId);
		const uniqueIds = new Set(scenarioIds);
		if (uniqueIds.size !== scenarioIds.length) {
			throw new HTTPException(422, {
				message: "Duplicate capacity scenario IDs in request",
			});
		}

		// 全シナリオIDの存在確認
		if (scenarioIds.length > 0) {
			const allExist =
				await chartViewCapacityItemData.capacityScenariosExist(scenarioIds);
			if (!allExist) {
				throw new HTTPException(422, {
					message: "One or more capacity scenario IDs do not exist",
				});
			}
		}

		const rows = await chartViewCapacityItemData.bulkUpsert(
			chartViewId,
			data.items.map((item) => ({
				capacityScenarioId: item.capacityScenarioId,
				isVisible: item.isVisible,
				colorCode: item.colorCode,
			})),
		);
		return rows.map(toChartViewCapacityItemResponse);
	},
};

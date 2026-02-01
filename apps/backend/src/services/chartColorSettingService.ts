import { HTTPException } from "hono/http-exception";
import { chartColorSettingData } from "@/data/chartColorSettingData";
import { toChartColorSettingResponse } from "@/transform/chartColorSettingTransform";
import type {
	ChartColorSetting,
	CreateChartColorSetting,
	UpdateChartColorSetting,
} from "@/types/chartColorSetting";

export const chartColorSettingService = {
	async findAll(params: {
		page: number;
		pageSize: number;
		targetType?: string;
	}): Promise<{ items: ChartColorSetting[]; totalCount: number }> {
		const result = await chartColorSettingData.findAll(params);
		return {
			items: result.items.map(toChartColorSettingResponse),
			totalCount: result.totalCount,
		};
	},

	async findById(id: number): Promise<ChartColorSetting> {
		const row = await chartColorSettingData.findById(id);
		if (!row) {
			throw new HTTPException(404, {
				message: `Chart color setting with ID '${id}' not found`,
			});
		}
		return toChartColorSettingResponse(row);
	},

	async create(data: CreateChartColorSetting): Promise<ChartColorSetting> {
		const existing = await chartColorSettingData.findByTarget(
			data.targetType,
			data.targetCode,
		);
		if (existing) {
			throw new HTTPException(409, {
				message: `Chart color setting for target_type '${data.targetType}' and target_code '${data.targetCode}' already exists`,
			});
		}

		const created = await chartColorSettingData.create(data);
		return toChartColorSettingResponse(created);
	},

	async update(
		id: number,
		data: UpdateChartColorSetting,
	): Promise<ChartColorSetting> {
		const existing = await chartColorSettingData.findById(id);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Chart color setting with ID '${id}' not found`,
			});
		}

		const targetType = data.targetType ?? existing.target_type;
		const targetCode = data.targetCode ?? existing.target_code;

		if (data.targetType !== undefined || data.targetCode !== undefined) {
			const duplicate = await chartColorSettingData.findByTargetExcluding(
				targetType,
				targetCode,
				id,
			);
			if (duplicate) {
				throw new HTTPException(409, {
					message: `Chart color setting for target_type '${targetType}' and target_code '${targetCode}' already exists`,
				});
			}
		}

		const updated = await chartColorSettingData.update(id, data);
		if (!updated) {
			throw new HTTPException(404, {
				message: `Chart color setting with ID '${id}' not found`,
			});
		}
		return toChartColorSettingResponse(updated);
	},

	async delete(id: number): Promise<void> {
		const existing = await chartColorSettingData.findById(id);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Chart color setting with ID '${id}' not found`,
			});
		}

		await chartColorSettingData.hardDelete(id);
	},

	async bulkUpsert(
		items: CreateChartColorSetting[],
	): Promise<ChartColorSetting[]> {
		const rows = await chartColorSettingData.bulkUpsert(items);
		return rows.map(toChartColorSettingResponse);
	},
};

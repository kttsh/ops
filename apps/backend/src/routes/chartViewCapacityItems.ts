import { Hono } from "hono";
import { chartViewCapacityItemService } from "@/services/chartViewCapacityItemService";
import { bulkUpsertChartViewCapacityItemSchema } from "@/types/chartViewCapacityItem";
import { parseIntParam } from "@/utils/parseParams";
import { validate } from "@/utils/validate";

const app = new Hono()
	// GET / - 一覧取得
	.get("/", async (c) => {
		const chartViewId = parseIntParam(
			c.req.param("chartViewId"),
			"chartViewId",
		);
		const items = await chartViewCapacityItemService.findAll(chartViewId);
		return c.json({ data: items }, 200);
	})
	// PUT /bulk - 一括 upsert
	.put(
		"/bulk",
		validate("json", bulkUpsertChartViewCapacityItemSchema),
		async (c) => {
			const chartViewId = parseIntParam(
				c.req.param("chartViewId"),
				"chartViewId",
			);
			const body = c.req.valid("json");
			const items = await chartViewCapacityItemService.bulkUpsert(
				chartViewId,
				body,
			);
			return c.json({ data: items }, 200);
		},
	);

export default app;

export type ChartViewCapacityItemsRoute = typeof app;

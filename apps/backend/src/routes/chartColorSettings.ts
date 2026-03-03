import { Hono } from "hono";
import { chartColorSettingService } from "@/services/chartColorSettingService";
import {
	bulkUpsertChartColorSettingSchema,
	chartColorSettingListQuerySchema,
	createChartColorSettingSchema,
	updateChartColorSettingSchema,
} from "@/types/chartColorSetting";
import { parseIntParam } from "@/utils/parseParams";
import { buildPaginatedResponse } from "@/utils/responseHelper";
import { validate } from "@/utils/validate";

const app = new Hono()
	// PUT /bulk - 一括 Upsert（/:id より前に定義）
	.put(
		"/bulk",
		validate("json", bulkUpsertChartColorSettingSchema),
		async (c) => {
			const body = c.req.valid("json");
			const results = await chartColorSettingService.bulkUpsert(body.items);
			return c.json({ data: results }, 200);
		},
	)
	// GET / - 一覧取得
	.get("/", validate("query", chartColorSettingListQuerySchema), async (c) => {
		const query = c.req.valid("query");
		const result = await chartColorSettingService.findAll({
			page: query["page[number]"],
			pageSize: query["page[size]"],
			targetType: query["filter[targetType]"],
		});

		return c.json(
			buildPaginatedResponse(result, {
				page: query["page[number]"],
				pageSize: query["page[size]"],
			}),
			200,
		);
	})
	// GET /:id - 個別取得
	.get("/:id", async (c) => {
		const id = parseIntParam(c.req.param("id"), "id");
		const item = await chartColorSettingService.findById(id);
		return c.json({ data: item }, 200);
	})
	// POST / - 作成
	.post("/", validate("json", createChartColorSettingSchema), async (c) => {
		const body = c.req.valid("json");
		const created = await chartColorSettingService.create(body);
		c.header(
			"Location",
			`/chart-color-settings/${created.chartColorSettingId}`,
		);
		return c.json({ data: created }, 201);
	})
	// PUT /:id - 更新
	.put("/:id", validate("json", updateChartColorSettingSchema), async (c) => {
		const id = parseIntParam(c.req.param("id"), "id");
		const body = c.req.valid("json");
		const updated = await chartColorSettingService.update(id, body);
		return c.json({ data: updated }, 200);
	})
	// DELETE /:id - 物理削除
	.delete("/:id", async (c) => {
		const id = parseIntParam(c.req.param("id"), "id");
		await chartColorSettingService.delete(id);
		return c.body(null, 204);
	});

export default app;

export type ChartColorSettingsRoute = typeof app;

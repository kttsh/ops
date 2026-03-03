import { Hono } from "hono";
import { chartViewService } from "@/services/chartViewService";
import {
	chartViewListQuerySchema,
	createChartViewSchema,
	updateChartViewSchema,
} from "@/types/chartView";
import {
	buildPaginatedResponse,
	setLocationHeader,
} from "@/utils/responseHelper";
import { validate } from "@/utils/validate";

const app = new Hono()
	// GET / - 一覧取得
	.get("/", validate("query", chartViewListQuerySchema), async (c) => {
		const query = c.req.valid("query");
		const result = await chartViewService.findAll({
			page: query["page[number]"],
			pageSize: query["page[size]"],
			includeDisabled: query["filter[includeDisabled]"],
		});

		return c.json(
			buildPaginatedResponse(result, {
				page: query["page[number]"],
				pageSize: query["page[size]"],
			}),
			200,
		);
	})
	// GET /:id - 単一取得
	.get("/:id", async (c) => {
		const id = Number(c.req.param("id"));
		const chartView = await chartViewService.findById(id);
		return c.json({ data: chartView }, 200);
	})
	// POST / - 新規作成
	.post("/", validate("json", createChartViewSchema), async (c) => {
		const body = c.req.valid("json");
		const created = await chartViewService.create(body);
		setLocationHeader(c, "/chart-views", created.chartViewId);
		return c.json({ data: created }, 201);
	})
	// PUT /:id - 更新
	.put("/:id", validate("json", updateChartViewSchema), async (c) => {
		const id = Number(c.req.param("id"));
		const body = c.req.valid("json");
		const updated = await chartViewService.update(id, body);
		return c.json({ data: updated }, 200);
	})
	// DELETE /:id - 論理削除
	.delete("/:id", async (c) => {
		const id = Number(c.req.param("id"));
		await chartViewService.delete(id);
		return c.body(null, 204);
	})
	// POST /:id/actions/restore - 復元
	.post("/:id/actions/restore", async (c) => {
		const id = Number(c.req.param("id"));
		const restored = await chartViewService.restore(id);
		return c.json({ data: restored }, 200);
	});

export default app;

export type ChartViewsRoute = typeof app;

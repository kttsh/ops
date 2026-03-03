import { Hono } from "hono";
import { capacityScenarioService } from "@/services/capacityScenarioService";
import {
	calculateCapacitySchema,
	capacityScenarioListQuerySchema,
	createCapacityScenarioSchema,
	updateCapacityScenarioSchema,
} from "@/types/capacityScenario";
import {
	buildPaginatedResponse,
	setLocationHeader,
} from "@/utils/responseHelper";
import { validate } from "@/utils/validate";

const app = new Hono()
	// GET / - 一覧取得
	.get("/", validate("query", capacityScenarioListQuerySchema), async (c) => {
		const query = c.req.valid("query");
		const result = await capacityScenarioService.findAll({
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
		const capacityScenario = await capacityScenarioService.findById(id);
		return c.json({ data: capacityScenario }, 200);
	})
	// POST / - 新規作成
	.post("/", validate("json", createCapacityScenarioSchema), async (c) => {
		const body = c.req.valid("json");
		const created = await capacityScenarioService.create(body);
		setLocationHeader(c, "/capacity-scenarios", created.capacityScenarioId);
		return c.json({ data: created }, 201);
	})
	// PUT /:id - 更新
	.put("/:id", validate("json", updateCapacityScenarioSchema), async (c) => {
		const id = Number(c.req.param("id"));
		const body = c.req.valid("json");
		const updated = await capacityScenarioService.update(id, body);
		return c.json({ data: updated }, 200);
	})
	// DELETE /:id - 論理削除
	.delete("/:id", async (c) => {
		const id = Number(c.req.param("id"));
		await capacityScenarioService.delete(id);
		return c.body(null, 204);
	})
	// POST /:id/actions/restore - 復元
	.post("/:id/actions/restore", async (c) => {
		const id = Number(c.req.param("id"));
		const restored = await capacityScenarioService.restore(id);
		return c.json({ data: restored }, 200);
	})
	// POST /:id/actions/calculate - 自動計算
	.post(
		"/:id/actions/calculate",
		validate("json", calculateCapacitySchema),
		async (c) => {
			const id = Number(c.req.param("id"));
			const body = c.req.valid("json");
			const result = await capacityScenarioService.calculate(id, body);
			return c.json({ data: result }, 200);
		},
	);

export default app;

export type CapacityScenariosRoute = typeof app;

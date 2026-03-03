import { Hono } from "hono";
import { workTypeService } from "@/services/workTypeService";
import {
	createWorkTypeSchema,
	updateWorkTypeSchema,
	workTypeListQuerySchema,
} from "@/types/workType";
import {
	buildPaginatedResponse,
	setLocationHeader,
} from "@/utils/responseHelper";
import { validate } from "@/utils/validate";

const app = new Hono()
	// GET / - 一覧取得
	.get("/", validate("query", workTypeListQuerySchema), async (c) => {
		const query = c.req.valid("query");
		const result = await workTypeService.findAll({
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
	// GET /:workTypeCode - 単一取得
	.get("/:workTypeCode", async (c) => {
		const code = c.req.param("workTypeCode");
		const workType = await workTypeService.findByCode(code);
		return c.json({ data: workType }, 200);
	})
	// POST / - 新規作成
	.post("/", validate("json", createWorkTypeSchema), async (c) => {
		const body = c.req.valid("json");
		const created = await workTypeService.create(body);
		setLocationHeader(c, "/work-types", created.workTypeCode);
		return c.json({ data: created }, 201);
	})
	// PUT /:workTypeCode - 更新
	.put("/:workTypeCode", validate("json", updateWorkTypeSchema), async (c) => {
		const code = c.req.param("workTypeCode");
		const body = c.req.valid("json");
		const updated = await workTypeService.update(code, body);
		return c.json({ data: updated }, 200);
	})
	// DELETE /:workTypeCode - 論理削除
	.delete("/:workTypeCode", async (c) => {
		const code = c.req.param("workTypeCode");
		await workTypeService.delete(code);
		return c.body(null, 204);
	})
	// POST /:workTypeCode/actions/restore - 復元
	.post("/:workTypeCode/actions/restore", async (c) => {
		const code = c.req.param("workTypeCode");
		const restored = await workTypeService.restore(code);
		return c.json({ data: restored }, 200);
	});

export default app;

export type WorkTypesRoute = typeof app;

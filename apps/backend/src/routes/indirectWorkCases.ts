import { Hono } from "hono";
import { indirectWorkCaseService } from "@/services/indirectWorkCaseService";
import {
	createIndirectWorkCaseSchema,
	indirectWorkCaseListQuerySchema,
	updateIndirectWorkCaseSchema,
} from "@/types/indirectWorkCase";
import { validate } from "@/utils/validate";

const app = new Hono()
	// GET / - 一覧取得
	.get("/", validate("query", indirectWorkCaseListQuerySchema), async (c) => {
		const query = c.req.valid("query");
		const result = await indirectWorkCaseService.findAll({
			page: query["page[number]"],
			pageSize: query["page[size]"],
			includeDisabled: query["filter[includeDisabled]"],
			businessUnitCode: query["filter[businessUnitCode]"],
		});

		return c.json(
			{
				data: result.items,
				meta: {
					pagination: {
						currentPage: query["page[number]"],
						pageSize: query["page[size]"],
						totalItems: result.totalCount,
						totalPages: Math.ceil(result.totalCount / query["page[size]"]),
					},
				},
			},
			200,
		);
	})
	// GET /:id - 単一取得
	.get("/:id", async (c) => {
		const id = Number(c.req.param("id"));
		const indirectWorkCase = await indirectWorkCaseService.findById(id);
		return c.json({ data: indirectWorkCase }, 200);
	})
	// POST / - 新規作成
	.post("/", validate("json", createIndirectWorkCaseSchema), async (c) => {
		const body = c.req.valid("json");
		const created = await indirectWorkCaseService.create(body);
		c.header("Location", `/indirect-work-cases/${created.indirectWorkCaseId}`);
		return c.json({ data: created }, 201);
	})
	// PUT /:id - 更新
	.put("/:id", validate("json", updateIndirectWorkCaseSchema), async (c) => {
		const id = Number(c.req.param("id"));
		const body = c.req.valid("json");
		const updated = await indirectWorkCaseService.update(id, body);
		return c.json({ data: updated }, 200);
	})
	// DELETE /:id - 論理削除
	.delete("/:id", async (c) => {
		const id = Number(c.req.param("id"));
		await indirectWorkCaseService.delete(id);
		return c.body(null, 204);
	})
	// POST /:id/actions/restore - 復元
	.post("/:id/actions/restore", async (c) => {
		const id = Number(c.req.param("id"));
		const restored = await indirectWorkCaseService.restore(id);
		return c.json({ data: restored }, 200);
	});

export default app;

export type IndirectWorkCasesRoute = typeof app;

import { Hono } from "hono";
import { projectTypeService } from "@/services/projectTypeService";
import {
	createProjectTypeSchema,
	projectTypeListQuerySchema,
	updateProjectTypeSchema,
} from "@/types/projectType";
import { validate } from "@/utils/validate";

const app = new Hono()
	// GET / - 一覧取得
	.get("/", validate("query", projectTypeListQuerySchema), async (c) => {
		const query = c.req.valid("query");
		const result = await projectTypeService.findAll({
			page: query["page[number]"],
			pageSize: query["page[size]"],
			includeDisabled: query["filter[includeDisabled]"],
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
	// GET /:projectTypeCode - 単一取得
	.get("/:projectTypeCode", async (c) => {
		const code = c.req.param("projectTypeCode");
		const projectType = await projectTypeService.findByCode(code);
		return c.json({ data: projectType }, 200);
	})
	// POST / - 新規作成
	.post("/", validate("json", createProjectTypeSchema), async (c) => {
		const body = c.req.valid("json");
		const created = await projectTypeService.create(body);
		c.header("Location", `/project-types/${created.projectTypeCode}`);
		return c.json({ data: created }, 201);
	})
	// PUT /:projectTypeCode - 更新
	.put(
		"/:projectTypeCode",
		validate("json", updateProjectTypeSchema),
		async (c) => {
			const code = c.req.param("projectTypeCode");
			const body = c.req.valid("json");
			const updated = await projectTypeService.update(code, body);
			return c.json({ data: updated }, 200);
		},
	)
	// DELETE /:projectTypeCode - 論理削除
	.delete("/:projectTypeCode", async (c) => {
		const code = c.req.param("projectTypeCode");
		await projectTypeService.delete(code);
		return c.body(null, 204);
	})
	// POST /:projectTypeCode/actions/restore - 復元
	.post("/:projectTypeCode/actions/restore", async (c) => {
		const code = c.req.param("projectTypeCode");
		const restored = await projectTypeService.restore(code);
		return c.json({ data: restored }, 200);
	});

export default app;

export type ProjectTypesRoute = typeof app;

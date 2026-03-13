import { Hono } from "hono";
import { projectService } from "@/services/projectService";
import {
	createProjectSchema,
	projectListQuerySchema,
	updateProjectSchema,
} from "@/types/project";
import { parseIntParam } from "@/utils/parseParams";
import {
	buildPaginatedResponse,
	setLocationHeader,
} from "@/utils/responseHelper";
import { validate } from "@/utils/validate";

const app = new Hono()
	// GET / - 一覧取得
	.get("/", validate("query", projectListQuerySchema), async (c) => {
		const query = c.req.valid("query");
		const businessUnitCodes = query["filter[businessUnitCodes]"]
			? query["filter[businessUnitCodes]"].split(",").filter(Boolean)
			: undefined;

		const result = await projectService.findAll({
			page: query["page[number]"],
			pageSize: query["page[size]"],
			includeDisabled: query["filter[includeDisabled]"],
			businessUnitCodes,
			status: query["filter[status]"],
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
		const id = parseIntParam(c.req.param("id"), "id");
		const project = await projectService.findById(id);
		return c.json({ data: project }, 200);
	})
	// POST / - 新規作成
	.post("/", validate("json", createProjectSchema), async (c) => {
		const body = c.req.valid("json");
		const created = await projectService.create(body);
		setLocationHeader(c, "/projects", created.projectId);
		return c.json({ data: created }, 201);
	})
	// PUT /:id - 更新
	.put("/:id", validate("json", updateProjectSchema), async (c) => {
		const id = parseIntParam(c.req.param("id"), "id");
		const body = c.req.valid("json");
		const updated = await projectService.update(id, body);
		return c.json({ data: updated }, 200);
	})
	// DELETE /:id - 論理削除
	.delete("/:id", async (c) => {
		const id = parseIntParam(c.req.param("id"), "id");
		await projectService.delete(id);
		return c.body(null, 204);
	})
	// POST /:id/actions/restore - 復元
	.post("/:id/actions/restore", async (c) => {
		const id = parseIntParam(c.req.param("id"), "id");
		const restored = await projectService.restore(id);
		return c.json({ data: restored }, 200);
	});

export default app;

export type ProjectsRoute = typeof app;

import { Hono } from "hono";
import { projectChangeHistoryService } from "@/services/projectChangeHistoryService";
import { createProjectChangeHistorySchema } from "@/types/projectChangeHistory";
import { parseIntParam } from "@/utils/parseParams";
import { validate } from "@/utils/validate";

const app = new Hono()
	// GET / - 一覧取得
	.get("/", async (c) => {
		const projectId = parseIntParam(c.req.param("projectId"), "projectId");
		const result = await projectChangeHistoryService.findAll(projectId);
		return c.json({ data: result }, 200);
	})
	// GET /:projectChangeHistoryId - 単一取得
	.get("/:projectChangeHistoryId", async (c) => {
		const projectId = parseIntParam(c.req.param("projectId"), "projectId");
		const projectChangeHistoryId = parseIntParam(
			c.req.param("projectChangeHistoryId"),
			"projectChangeHistoryId",
		);
		const item = await projectChangeHistoryService.findById(
			projectId,
			projectChangeHistoryId,
		);
		return c.json({ data: item }, 200);
	})
	// POST / - 新規作成
	.post("/", validate("json", createProjectChangeHistorySchema), async (c) => {
		const projectId = parseIntParam(c.req.param("projectId"), "projectId");
		const body = c.req.valid("json");
		const created = await projectChangeHistoryService.create(projectId, body);
		c.header(
			"Location",
			`/projects/${projectId}/change-history/${created.projectChangeHistoryId}`,
		);
		return c.json({ data: created }, 201);
	})
	// DELETE /:projectChangeHistoryId - 物理削除
	.delete("/:projectChangeHistoryId", async (c) => {
		const projectId = parseIntParam(c.req.param("projectId"), "projectId");
		const projectChangeHistoryId = parseIntParam(
			c.req.param("projectChangeHistoryId"),
			"projectChangeHistoryId",
		);
		await projectChangeHistoryService.delete(projectId, projectChangeHistoryId);
		return c.body(null, 204);
	});

export default app;

export type ProjectChangeHistoryRoute = typeof app;

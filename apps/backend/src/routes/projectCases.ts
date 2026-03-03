import { Hono } from "hono";
import { projectCaseService } from "@/services/projectCaseService";
import {
	createProjectCaseSchema,
	projectCaseListQuerySchema,
	updateProjectCaseSchema,
} from "@/types/projectCase";
import { parseIntParam } from "@/utils/parseParams";
import { buildPaginatedResponse } from "@/utils/responseHelper";
import { validate } from "@/utils/validate";

const app = new Hono()
	// GET / - 一覧取得
	.get("/", validate("query", projectCaseListQuerySchema), async (c) => {
		const projectId = parseIntParam(c.req.param("projectId"), "projectId");
		const query = c.req.valid("query");
		const result = await projectCaseService.findAll({
			projectId,
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
	// GET /:projectCaseId - 単一取得
	.get("/:projectCaseId", async (c) => {
		const projectId = parseIntParam(c.req.param("projectId"), "projectId");
		const projectCaseId = parseIntParam(
			c.req.param("projectCaseId"),
			"projectCaseId",
		);
		const projectCase = await projectCaseService.findById(
			projectId,
			projectCaseId,
		);
		return c.json({ data: projectCase }, 200);
	})
	// POST / - 新規作成
	.post("/", validate("json", createProjectCaseSchema), async (c) => {
		const projectId = parseIntParam(c.req.param("projectId"), "projectId");
		const body = c.req.valid("json");
		const created = await projectCaseService.create(projectId, body);
		c.header(
			"Location",
			`/projects/${projectId}/project-cases/${created.projectCaseId}`,
		);
		return c.json({ data: created }, 201);
	})
	// PUT /:projectCaseId - 更新
	.put(
		"/:projectCaseId",
		validate("json", updateProjectCaseSchema),
		async (c) => {
			const projectId = parseIntParam(c.req.param("projectId"), "projectId");
			const projectCaseId = parseIntParam(
				c.req.param("projectCaseId"),
				"projectCaseId",
			);
			const body = c.req.valid("json");
			const updated = await projectCaseService.update(
				projectId,
				projectCaseId,
				body,
			);
			return c.json({ data: updated }, 200);
		},
	)
	// DELETE /:projectCaseId - 論理削除
	.delete("/:projectCaseId", async (c) => {
		const projectId = parseIntParam(c.req.param("projectId"), "projectId");
		const projectCaseId = parseIntParam(
			c.req.param("projectCaseId"),
			"projectCaseId",
		);
		await projectCaseService.delete(projectId, projectCaseId);
		return c.body(null, 204);
	})
	// POST /:projectCaseId/actions/restore - 復元
	.post("/:projectCaseId/actions/restore", async (c) => {
		const projectId = parseIntParam(c.req.param("projectId"), "projectId");
		const projectCaseId = parseIntParam(
			c.req.param("projectCaseId"),
			"projectCaseId",
		);
		const restored = await projectCaseService.restore(projectId, projectCaseId);
		return c.json({ data: restored }, 200);
	});

export default app;

export type ProjectCasesRoute = typeof app;

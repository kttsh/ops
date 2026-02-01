import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { projectCaseService } from "@/services/projectCaseService";
import {
	createProjectCaseSchema,
	projectCaseListQuerySchema,
	updateProjectCaseSchema,
} from "@/types/projectCase";
import { validate } from "@/utils/validate";

function parseIntParam(value: string | undefined, name: string): number {
	if (!value) {
		throw new HTTPException(422, {
			message: `Missing required parameter: ${name}`,
		});
	}
	const parsed = parseInt(value, 10);
	if (Number.isNaN(parsed) || parsed <= 0) {
		throw new HTTPException(422, {
			message: `Invalid ${name}: must be a positive integer`,
		});
	}
	return parsed;
}

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

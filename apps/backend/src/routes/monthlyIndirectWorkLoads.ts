import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { monthlyIndirectWorkLoadService } from "@/services/monthlyIndirectWorkLoadService";
import {
	bulkUpsertMonthlyIndirectWorkLoadSchema,
	createMonthlyIndirectWorkLoadSchema,
	updateMonthlyIndirectWorkLoadSchema,
} from "@/types/monthlyIndirectWorkLoad";
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
	.get("/", async (c) => {
		const indirectWorkCaseId = parseIntParam(
			c.req.param("indirectWorkCaseId"),
			"indirectWorkCaseId",
		);
		const items =
			await monthlyIndirectWorkLoadService.findAll(indirectWorkCaseId);
		return c.json({ data: items }, 200);
	})
	// PUT /bulk - バルク Upsert（/:monthlyIndirectWorkLoadId より前に定義）
	.put(
		"/bulk",
		validate("json", bulkUpsertMonthlyIndirectWorkLoadSchema),
		async (c) => {
			const indirectWorkCaseId = parseIntParam(
				c.req.param("indirectWorkCaseId"),
				"indirectWorkCaseId",
			);
			const body = c.req.valid("json");
			const items = await monthlyIndirectWorkLoadService.bulkUpsert(
				indirectWorkCaseId,
				body,
			);
			return c.json({ data: items }, 200);
		},
	)
	// GET /:monthlyIndirectWorkLoadId - 単一取得
	.get("/:monthlyIndirectWorkLoadId", async (c) => {
		const indirectWorkCaseId = parseIntParam(
			c.req.param("indirectWorkCaseId"),
			"indirectWorkCaseId",
		);
		const monthlyIndirectWorkLoadId = parseIntParam(
			c.req.param("monthlyIndirectWorkLoadId"),
			"monthlyIndirectWorkLoadId",
		);
		const item = await monthlyIndirectWorkLoadService.findById(
			indirectWorkCaseId,
			monthlyIndirectWorkLoadId,
		);
		return c.json({ data: item }, 200);
	})
	// POST / - 新規作成
	.post(
		"/",
		validate("json", createMonthlyIndirectWorkLoadSchema),
		async (c) => {
			const indirectWorkCaseId = parseIntParam(
				c.req.param("indirectWorkCaseId"),
				"indirectWorkCaseId",
			);
			const body = c.req.valid("json");
			const created = await monthlyIndirectWorkLoadService.create(
				indirectWorkCaseId,
				body,
			);
			c.header(
				"Location",
				`/indirect-work-cases/${indirectWorkCaseId}/monthly-indirect-work-loads/${created.monthlyIndirectWorkLoadId}`,
			);
			return c.json({ data: created }, 201);
		},
	)
	// PUT /:monthlyIndirectWorkLoadId - 更新
	.put(
		"/:monthlyIndirectWorkLoadId",
		validate("json", updateMonthlyIndirectWorkLoadSchema),
		async (c) => {
			const indirectWorkCaseId = parseIntParam(
				c.req.param("indirectWorkCaseId"),
				"indirectWorkCaseId",
			);
			const monthlyIndirectWorkLoadId = parseIntParam(
				c.req.param("monthlyIndirectWorkLoadId"),
				"monthlyIndirectWorkLoadId",
			);
			const body = c.req.valid("json");
			const updated = await monthlyIndirectWorkLoadService.update(
				indirectWorkCaseId,
				monthlyIndirectWorkLoadId,
				body,
			);
			return c.json({ data: updated }, 200);
		},
	)
	// DELETE /:monthlyIndirectWorkLoadId - 物理削除
	.delete("/:monthlyIndirectWorkLoadId", async (c) => {
		const indirectWorkCaseId = parseIntParam(
			c.req.param("indirectWorkCaseId"),
			"indirectWorkCaseId",
		);
		const monthlyIndirectWorkLoadId = parseIntParam(
			c.req.param("monthlyIndirectWorkLoadId"),
			"monthlyIndirectWorkLoadId",
		);
		await monthlyIndirectWorkLoadService.delete(
			indirectWorkCaseId,
			monthlyIndirectWorkLoadId,
		);
		return c.body(null, 204);
	});

export default app;

export type MonthlyIndirectWorkLoadsRoute = typeof app;

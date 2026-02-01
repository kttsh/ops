import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { indirectWorkTypeRatioService } from "@/services/indirectWorkTypeRatioService";
import {
	bulkUpsertIndirectWorkTypeRatioSchema,
	createIndirectWorkTypeRatioSchema,
	updateIndirectWorkTypeRatioSchema,
} from "@/types/indirectWorkTypeRatio";
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
			await indirectWorkTypeRatioService.findAll(indirectWorkCaseId);
		return c.json({ data: items }, 200);
	})
	// PUT /bulk - バルク Upsert（/:indirectWorkTypeRatioId より前に定義）
	.put(
		"/bulk",
		validate("json", bulkUpsertIndirectWorkTypeRatioSchema),
		async (c) => {
			const indirectWorkCaseId = parseIntParam(
				c.req.param("indirectWorkCaseId"),
				"indirectWorkCaseId",
			);
			const body = c.req.valid("json");
			const items = await indirectWorkTypeRatioService.bulkUpsert(
				indirectWorkCaseId,
				body,
			);
			return c.json({ data: items }, 200);
		},
	)
	// GET /:indirectWorkTypeRatioId - 単一取得
	.get("/:indirectWorkTypeRatioId", async (c) => {
		const indirectWorkCaseId = parseIntParam(
			c.req.param("indirectWorkCaseId"),
			"indirectWorkCaseId",
		);
		const indirectWorkTypeRatioId = parseIntParam(
			c.req.param("indirectWorkTypeRatioId"),
			"indirectWorkTypeRatioId",
		);
		const ratio = await indirectWorkTypeRatioService.findById(
			indirectWorkCaseId,
			indirectWorkTypeRatioId,
		);
		return c.json({ data: ratio }, 200);
	})
	// POST / - 新規作成
	.post("/", validate("json", createIndirectWorkTypeRatioSchema), async (c) => {
		const indirectWorkCaseId = parseIntParam(
			c.req.param("indirectWorkCaseId"),
			"indirectWorkCaseId",
		);
		const body = c.req.valid("json");
		const created = await indirectWorkTypeRatioService.create(
			indirectWorkCaseId,
			body,
		);
		c.header(
			"Location",
			`/indirect-work-cases/${indirectWorkCaseId}/indirect-work-type-ratios/${created.indirectWorkTypeRatioId}`,
		);
		return c.json({ data: created }, 201);
	})
	// PUT /:indirectWorkTypeRatioId - 更新
	.put(
		"/:indirectWorkTypeRatioId",
		validate("json", updateIndirectWorkTypeRatioSchema),
		async (c) => {
			const indirectWorkCaseId = parseIntParam(
				c.req.param("indirectWorkCaseId"),
				"indirectWorkCaseId",
			);
			const indirectWorkTypeRatioId = parseIntParam(
				c.req.param("indirectWorkTypeRatioId"),
				"indirectWorkTypeRatioId",
			);
			const body = c.req.valid("json");
			const updated = await indirectWorkTypeRatioService.update(
				indirectWorkCaseId,
				indirectWorkTypeRatioId,
				body,
			);
			return c.json({ data: updated }, 200);
		},
	)
	// DELETE /:indirectWorkTypeRatioId - 物理削除
	.delete("/:indirectWorkTypeRatioId", async (c) => {
		const indirectWorkCaseId = parseIntParam(
			c.req.param("indirectWorkCaseId"),
			"indirectWorkCaseId",
		);
		const indirectWorkTypeRatioId = parseIntParam(
			c.req.param("indirectWorkTypeRatioId"),
			"indirectWorkTypeRatioId",
		);
		await indirectWorkTypeRatioService.delete(
			indirectWorkCaseId,
			indirectWorkTypeRatioId,
		);
		return c.body(null, 204);
	});

export default app;

export type IndirectWorkTypeRatiosRoute = typeof app;

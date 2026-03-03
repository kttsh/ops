import { Hono } from "hono";
import { monthlyHeadcountPlanService } from "@/services/monthlyHeadcountPlanService";
import {
	bulkUpsertMonthlyHeadcountPlanSchema,
	createMonthlyHeadcountPlanSchema,
	updateMonthlyHeadcountPlanSchema,
} from "@/types/monthlyHeadcountPlan";
import { parseIntParam } from "@/utils/parseParams";
import { validate } from "@/utils/validate";

const app = new Hono()
	// GET / - 一覧取得
	.get("/", async (c) => {
		const headcountPlanCaseId = parseIntParam(
			c.req.param("headcountPlanCaseId"),
			"headcountPlanCaseId",
		);
		const businessUnitCode = c.req.query("businessUnitCode");
		const items = await monthlyHeadcountPlanService.findAll(
			headcountPlanCaseId,
			businessUnitCode,
		);
		return c.json({ data: items }, 200);
	})
	// PUT /bulk - バルク Upsert（/:monthlyHeadcountPlanId より前に定義）
	.put(
		"/bulk",
		validate("json", bulkUpsertMonthlyHeadcountPlanSchema),
		async (c) => {
			const headcountPlanCaseId = parseIntParam(
				c.req.param("headcountPlanCaseId"),
				"headcountPlanCaseId",
			);
			const body = c.req.valid("json");
			const items = await monthlyHeadcountPlanService.bulkUpsert(
				headcountPlanCaseId,
				body,
			);
			return c.json({ data: items }, 200);
		},
	)
	// GET /:monthlyHeadcountPlanId - 単一取得
	.get("/:monthlyHeadcountPlanId", async (c) => {
		const headcountPlanCaseId = parseIntParam(
			c.req.param("headcountPlanCaseId"),
			"headcountPlanCaseId",
		);
		const monthlyHeadcountPlanId = parseIntParam(
			c.req.param("monthlyHeadcountPlanId"),
			"monthlyHeadcountPlanId",
		);
		const plan = await monthlyHeadcountPlanService.findById(
			headcountPlanCaseId,
			monthlyHeadcountPlanId,
		);
		return c.json({ data: plan }, 200);
	})
	// POST / - 新規作成
	.post("/", validate("json", createMonthlyHeadcountPlanSchema), async (c) => {
		const headcountPlanCaseId = parseIntParam(
			c.req.param("headcountPlanCaseId"),
			"headcountPlanCaseId",
		);
		const body = c.req.valid("json");
		const created = await monthlyHeadcountPlanService.create(
			headcountPlanCaseId,
			body,
		);
		c.header(
			"Location",
			`/headcount-plan-cases/${headcountPlanCaseId}/monthly-headcount-plans/${created.monthlyHeadcountPlanId}`,
		);
		return c.json({ data: created }, 201);
	})
	// PUT /:monthlyHeadcountPlanId - 更新
	.put(
		"/:monthlyHeadcountPlanId",
		validate("json", updateMonthlyHeadcountPlanSchema),
		async (c) => {
			const headcountPlanCaseId = parseIntParam(
				c.req.param("headcountPlanCaseId"),
				"headcountPlanCaseId",
			);
			const monthlyHeadcountPlanId = parseIntParam(
				c.req.param("monthlyHeadcountPlanId"),
				"monthlyHeadcountPlanId",
			);
			const body = c.req.valid("json");
			const updated = await monthlyHeadcountPlanService.update(
				headcountPlanCaseId,
				monthlyHeadcountPlanId,
				body,
			);
			return c.json({ data: updated }, 200);
		},
	)
	// DELETE /:monthlyHeadcountPlanId - 物理削除
	.delete("/:monthlyHeadcountPlanId", async (c) => {
		const headcountPlanCaseId = parseIntParam(
			c.req.param("headcountPlanCaseId"),
			"headcountPlanCaseId",
		);
		const monthlyHeadcountPlanId = parseIntParam(
			c.req.param("monthlyHeadcountPlanId"),
			"monthlyHeadcountPlanId",
		);
		await monthlyHeadcountPlanService.delete(
			headcountPlanCaseId,
			monthlyHeadcountPlanId,
		);
		return c.body(null, 204);
	});

export default app;

export type MonthlyHeadcountPlansRoute = typeof app;

import { Hono } from "hono";
import { standardEffortMasterService } from "@/services/standardEffortMasterService";
import {
	bulkImportStandardEffortSchema,
	createStandardEffortMasterSchema,
	standardEffortMasterListQuerySchema,
	updateStandardEffortMasterSchema,
} from "@/types/standardEffortMaster";
import { parseIntParam } from "@/utils/parseParams";
import { buildPaginatedResponse } from "@/utils/responseHelper";
import { validate } from "@/utils/validate";

const app = new Hono()
	.get(
		"/",
		validate("query", standardEffortMasterListQuerySchema),
		async (c) => {
			const query = c.req.valid("query");
			const result = await standardEffortMasterService.findAll({
				page: query["page[number]"],
				pageSize: query["page[size]"],
				includeDisabled: query["filter[includeDisabled]"],
				businessUnitCode: query["filter[businessUnitCode]"],
				projectTypeCode: query["filter[projectTypeCode]"],
			});

			return c.json(
				buildPaginatedResponse(result, {
					page: query["page[number]"],
					pageSize: query["page[size]"],
				}),
				200,
			);
		},
	)
	.get("/:id", async (c) => {
		const id = parseIntParam(c.req.param("id"), "id");
		const master = await standardEffortMasterService.findById(id);
		return c.json({ data: master }, 200);
	})
	.post("/", validate("json", createStandardEffortMasterSchema), async (c) => {
		const body = c.req.valid("json");
		const created = await standardEffortMasterService.create(body);
		c.header(
			"Location",
			`/standard-effort-masters/${created.standardEffortId}`,
		);
		return c.json({ data: created }, 201);
	})
	.put(
		"/:id",
		validate("json", updateStandardEffortMasterSchema),
		async (c) => {
			const id = parseIntParam(c.req.param("id"), "id");
			const body = c.req.valid("json");
			const updated = await standardEffortMasterService.update(id, body);
			return c.json({ data: updated }, 200);
		},
	)
	.delete("/:id", async (c) => {
		const id = parseIntParam(c.req.param("id"), "id");
		await standardEffortMasterService.delete(id);
		return c.body(null, 204);
	})
	.get("/actions/export", async (c) => {
		const businessUnitCode = c.req.query("filter[businessUnitCode]");
		const result = await standardEffortMasterService.getExportData(
			businessUnitCode || undefined,
		);
		return c.json(result, 200);
	})
	.post(
		"/actions/import",
		validate("json", bulkImportStandardEffortSchema),
		async (c) => {
			const body = c.req.valid("json");
			const result = await standardEffortMasterService.bulkImport(body.items);
			return c.json(result, 200);
		},
	)
	.post("/:id/actions/restore", async (c) => {
		const id = parseIntParam(c.req.param("id"), "id");
		const restored = await standardEffortMasterService.restore(id);
		return c.json({ data: restored }, 200);
	});

export default app;

export type StandardEffortMastersRoute = typeof app;

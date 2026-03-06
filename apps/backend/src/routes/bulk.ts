import { Hono } from "hono";
import { importExportService } from "@/services/importExportService";
import { bulkImportSchema } from "@/types/importExport";
import { validate } from "@/utils/validate";

const app = new Hono()
	// GET /export-project-loads - 一括エクスポート
	.get("/export-project-loads", async (c) => {
		const result = await importExportService.getExportData();
		return c.json(result, 200);
	})
	// POST /import-project-loads - 一括インポート
	.post(
		"/import-project-loads",
		validate("json", bulkImportSchema),
		async (c) => {
			const body = c.req.valid("json");
			const result = await importExportService.bulkImport(body);
			return c.json({ data: result }, 200);
		},
	);

export default app;

export type BulkRoute = typeof app;

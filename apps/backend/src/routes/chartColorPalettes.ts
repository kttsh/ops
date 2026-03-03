import { Hono } from "hono";
import { chartColorPaletteService } from "@/services/chartColorPaletteService";
import {
	createChartColorPaletteSchema,
	updateChartColorPaletteSchema,
} from "@/types/chartColorPalette";
import { parseIntParam } from "@/utils/parseParams";
import { validate } from "@/utils/validate";

const app = new Hono()
	.get("/", async (c) => {
		const palettes = await chartColorPaletteService.findAll();
		return c.json({ data: palettes }, 200);
	})
	.get("/:paletteId", async (c) => {
		const paletteId = parseIntParam(c.req.param("paletteId"), "paletteId");
		const palette = await chartColorPaletteService.findById(paletteId);
		return c.json({ data: palette }, 200);
	})
	.post("/", validate("json", createChartColorPaletteSchema), async (c) => {
		const body = c.req.valid("json");
		const created = await chartColorPaletteService.create(body);
		c.header(
			"Location",
			`/chart-color-palettes/${created.chartColorPaletteId}`,
		);
		return c.json({ data: created }, 201);
	})
	.put(
		"/:paletteId",
		validate("json", updateChartColorPaletteSchema),
		async (c) => {
			const paletteId = parseIntParam(c.req.param("paletteId"), "paletteId");
			const body = c.req.valid("json");
			const updated = await chartColorPaletteService.update(paletteId, body);
			return c.json({ data: updated }, 200);
		},
	)
	.delete("/:paletteId", async (c) => {
		const paletteId = parseIntParam(c.req.param("paletteId"), "paletteId");
		await chartColorPaletteService.delete(paletteId);
		return c.body(null, 204);
	});

export default app;

export type ChartColorPalettesRoute = typeof app;

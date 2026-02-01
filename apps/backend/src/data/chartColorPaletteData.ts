import sql from "mssql";
import { getPool } from "@/database/client";
import type { ChartColorPaletteRow } from "@/types/chartColorPalette";

export const chartColorPaletteData = {
	async findAll(): Promise<ChartColorPaletteRow[]> {
		const pool = await getPool();
		const result = await pool.request().query<ChartColorPaletteRow>(
			`SELECT chart_color_palette_id, name, color_code, display_order, created_at, updated_at
         FROM chart_color_palettes
         ORDER BY display_order ASC`,
		);

		return result.recordset;
	},

	async findById(paletteId: number): Promise<ChartColorPaletteRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("paletteId", sql.Int, paletteId)
			.query<ChartColorPaletteRow>(
				`SELECT chart_color_palette_id, name, color_code, display_order, created_at, updated_at
         FROM chart_color_palettes
         WHERE chart_color_palette_id = @paletteId`,
			);

		return result.recordset[0];
	},

	async create(data: {
		name: string;
		colorCode: string;
		displayOrder: number;
	}): Promise<ChartColorPaletteRow> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("name", sql.NVarChar(100), data.name)
			.input("colorCode", sql.VarChar(7), data.colorCode)
			.input("displayOrder", sql.Int, data.displayOrder)
			.query<ChartColorPaletteRow>(
				`INSERT INTO chart_color_palettes (name, color_code, display_order)
         OUTPUT INSERTED.chart_color_palette_id, INSERTED.name, INSERTED.color_code, INSERTED.display_order, INSERTED.created_at, INSERTED.updated_at
         VALUES (@name, @colorCode, @displayOrder)`,
			);

		return result.recordset[0];
	},

	async update(
		paletteId: number,
		data: {
			name: string;
			colorCode: string;
			displayOrder?: number;
		},
	): Promise<ChartColorPaletteRow | undefined> {
		const pool = await getPool();

		const setClauses = [
			"name = @name",
			"color_code = @colorCode",
			"updated_at = GETDATE()",
		];

		const request = pool
			.request()
			.input("paletteId", sql.Int, paletteId)
			.input("name", sql.NVarChar(100), data.name)
			.input("colorCode", sql.VarChar(7), data.colorCode);

		if (data.displayOrder !== undefined) {
			setClauses.push("display_order = @displayOrder");
			request.input("displayOrder", sql.Int, data.displayOrder);
		}

		const result = await request.query<ChartColorPaletteRow>(
			`UPDATE chart_color_palettes
       SET ${setClauses.join(", ")}
       OUTPUT INSERTED.chart_color_palette_id, INSERTED.name, INSERTED.color_code, INSERTED.display_order, INSERTED.created_at, INSERTED.updated_at
       WHERE chart_color_palette_id = @paletteId`,
		);

		return result.recordset[0];
	},

	async deleteById(paletteId: number): Promise<boolean> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("paletteId", sql.Int, paletteId)
			.query(
				`DELETE FROM chart_color_palettes
         WHERE chart_color_palette_id = @paletteId`,
			);

		return result.rowsAffected[0] > 0;
	},
};

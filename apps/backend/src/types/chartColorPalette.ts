import { z } from "zod";
import { colorCodeSchema } from "@/types/common";

// --- Zod Schemas ---

/** 作成用スキーマ */
export const createChartColorPaletteSchema = z.object({
	name: z.string().min(1).max(100),
	colorCode: colorCodeSchema,
	displayOrder: z.number().int().default(0),
});

/** 更新用スキーマ */
export const updateChartColorPaletteSchema = z.object({
	name: z.string().min(1).max(100),
	colorCode: colorCodeSchema,
	displayOrder: z.number().int().optional(),
});

// --- TypeScript Types ---

export type CreateChartColorPalette = z.infer<
	typeof createChartColorPaletteSchema
>;
export type UpdateChartColorPalette = z.infer<
	typeof updateChartColorPaletteSchema
>;

/** DB 行型 (snake_case) */
export type ChartColorPaletteRow = {
	chart_color_palette_id: number;
	name: string;
	color_code: string;
	display_order: number;
	created_at: Date;
	updated_at: Date;
};

/** API レスポンス型 (camelCase) */
export type ChartColorPalette = {
	chartColorPaletteId: number;
	name: string;
	colorCode: string;
	displayOrder: number;
	createdAt: string;
	updatedAt: string;
};

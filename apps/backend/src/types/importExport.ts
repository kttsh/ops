import { z } from "zod";
import { yearMonthSchema } from "@/types/common";

// --- 共通バリデーション ---

const manhourSchema = z.number().int().min(0).max(99999999);

// --- Zod スキーマ ---

/** インポートアイテムスキーマ */
export const bulkImportItemSchema = z.object({
	projectCaseId: z.number().int().positive(),
	yearMonth: yearMonthSchema,
	manhour: manhourSchema,
});

/** インポートリクエストスキーマ */
export const bulkImportSchema = z.object({
	items: z.array(bulkImportItemSchema).min(1),
});

// --- TypeScript 型 ---

/** インポートアイテム型 */
export type BulkImportItem = z.infer<typeof bulkImportItemSchema>;

/** インポートリクエスト型 */
export type BulkImportInput = z.infer<typeof bulkImportSchema>;

/** インポート結果型 */
export type BulkImportResult = {
	updatedCases: number;
	updatedRecords: number;
};

/** エクスポート行型 */
export type ExportRow = {
	projectCaseId: number;
	projectName: string;
	caseName: string;
	loads: Array<{ yearMonth: string; manhour: number }>;
};

/** エクスポートレスポンス型 */
export type ExportDataResponse = {
	data: ExportRow[];
	yearMonths: string[];
};

/** DB エクスポート行型（snake_case） */
export type ExportDataRow = {
	project_case_id: number;
	project_name: string;
	case_name: string;
	year_month: string;
	manhour: number;
};

import { z } from "zod";

// --- Zod スキーマ ---

/** 作成用スキーマ */
export const createProjectChangeHistorySchema = z.object({
	changeType: z.string().min(1).max(50),
	fieldName: z.string().max(100).optional(),
	oldValue: z.string().max(1000).optional(),
	newValue: z.string().max(1000).optional(),
	changedBy: z.string().min(1).max(100),
});

// --- TypeScript 型 ---

/** 作成リクエスト型 */
export type CreateProjectChangeHistory = z.infer<
	typeof createProjectChangeHistorySchema
>;

/** DB 行型（snake_case） */
export type ProjectChangeHistoryRow = {
	project_change_history_id: number;
	project_id: number;
	change_type: string;
	field_name: string | null;
	old_value: string | null;
	new_value: string | null;
	changed_by: string;
	changed_at: Date;
};

/** API レスポンス型（camelCase） */
export type ProjectChangeHistory = {
	projectChangeHistoryId: number;
	projectId: number;
	changeType: string;
	fieldName: string | null;
	oldValue: string | null;
	newValue: string | null;
	changedBy: string;
	changedAt: string;
};

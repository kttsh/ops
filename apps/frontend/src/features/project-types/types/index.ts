import { z } from "zod";

// --- 共通型を共有レイヤーから re-export ---
export type {
	PaginatedResponse,
	ProblemDetails,
	SelectOption,
	SingleResponse,
} from "@/lib/api";

// --- API レスポンス型 ---

export type ProjectType = {
	projectTypeCode: string;
	name: string;
	displayOrder: number;
	createdAt: string;
	updatedAt: string;
	deletedAt?: string | null;
};

// --- Zod スキーマ ---

export const createProjectTypeSchema = z.object({
	projectTypeCode: z
		.string()
		.min(1, "案件タイプコードは必須です")
		.max(20, "案件タイプコードは20文字以内で入力してください")
		.regex(
			/^[a-zA-Z0-9_-]+$/,
			"英数字・ハイフン・アンダースコアのみ使用できます",
		),
	name: z
		.string()
		.min(1, "名称は必須です")
		.max(100, "名称は100文字以内で入力してください"),
	displayOrder: z
		.number()
		.int("表示順は整数で入力してください")
		.min(0, "表示順は0以上で入力してください")
		.default(0),
});

export const updateProjectTypeSchema = z.object({
	name: z
		.string()
		.min(1, "名称は必須です")
		.max(100, "名称は100文字以内で入力してください"),
	displayOrder: z
		.number()
		.int("表示順は整数で入力してください")
		.min(0, "表示順は0以上で入力してください")
		.optional(),
});

export const projectTypeSearchSchema = z.object({
	search: z.string().catch("").default(""),
	includeDisabled: z.boolean().catch(false).default(false),
});

// --- 入力型 ---

export type CreateProjectTypeInput = z.infer<typeof createProjectTypeSchema>;
export type UpdateProjectTypeInput = z.infer<typeof updateProjectTypeSchema>;
export type ProjectTypeSearchParams = z.infer<typeof projectTypeSearchSchema>;

// --- API パラメータ型 ---

export type ProjectTypeListParams = {
	includeDisabled: boolean;
};

import { z } from "zod";
import { yearMonthSchema } from "@/types/common";

// --- CSV変換ヘルパー ---

const csvToStringArray = z.string().transform((val) =>
	val
		.split(",")
		.map((s) => s.trim())
		.filter((s) => s.length > 0),
);

const csvToNumberArray = z
	.string()
	.transform((val) => val.split(",").map((s) => Number(s.trim())));

// --- クエリパラメータスキーマ ---

export const chartDataQuerySchema = z
	.object({
		businessUnitCodes: csvToStringArray
			.refine((arr) => arr.length > 0, "1件以上指定してください")
			.refine(
				(arr) => arr.every((c) => c.length >= 1 && c.length <= 20),
				"各コードは1〜20文字で指定してください",
			),
		startYearMonth: yearMonthSchema,
		endYearMonth: yearMonthSchema,
		chartViewId: z.coerce.number().int().positive().optional(),
		capacityScenarioIds: csvToNumberArray.optional(),
		indirectWorkCaseIds: csvToNumberArray.optional(),
		projectIds: csvToNumberArray.optional(),
		projectCaseIds: csvToNumberArray.optional(),
	})
	.refine(
		(data) => data.startYearMonth <= data.endYearMonth,
		"startYearMonthはendYearMonth以前を指定してください",
	)
	.refine((data) => {
		const startYear = parseInt(data.startYearMonth.slice(0, 4), 10);
		const startMonth = parseInt(data.startYearMonth.slice(4, 6), 10);
		const endYear = parseInt(data.endYearMonth.slice(0, 4), 10);
		const endMonth = parseInt(data.endYearMonth.slice(4, 6), 10);
		const months = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
		return months <= 60;
	}, "期間は60ヶ月以内で指定してください");

// --- TypeScript 型 ---

/** クエリパラメータ型（Zodバリデーション後） */
export type ChartDataQuery = z.infer<typeof chartDataQuerySchema>;

/** サービス層パラメータ型 */
export type ChartDataServiceParams = {
	businessUnitCodes: string[];
	startYearMonth: string;
	endYearMonth: string;
	projectIds?: number[];
	projectCaseIds?: number[];
	chartViewId?: number;
	capacityScenarioIds?: number[];
	indirectWorkCaseIds?: number[];
};

/** 種類別内訳 */
export type IndirectWorkTypeBreakdown = {
	workTypeCode: string;
	workTypeName: string;
	manhour: number;
};

/** 間接工数月次データ */
export type IndirectWorkLoadMonthly = {
	yearMonth: string;
	manhour: number;
	source: "calculated" | "manual";
	breakdown: IndirectWorkTypeBreakdown[];
	breakdownCoverage: number;
};

/** 案件工数集約（案件単位） */
export type ProjectLoadAggregation = {
	projectId: number;
	projectName: string;
	projectTypeCode: string | null;
	monthly: Array<{
		yearMonth: string;
		manhour: number;
	}>;
};

/** 間接工数集約 */
export type IndirectWorkLoadAggregation = {
	indirectWorkCaseId: number;
	caseName: string;
	businessUnitCode: string;
	monthly: IndirectWorkLoadMonthly[];
};

/** キャパシティ集約 */
export type CapacityAggregation = {
	capacityScenarioId: number;
	scenarioName: string;
	monthly: Array<{
		yearMonth: string;
		capacity: number;
	}>;
};

/** キャパシティライン集約（人員計画ケース × キャパシティシナリオ） */
export type CapacityLineAggregation = {
	headcountPlanCaseId: number;
	caseName: string;
	capacityScenarioId: number;
	scenarioName: string;
	lineName: string;
	monthly: Array<{
		yearMonth: string;
		capacity: number;
	}>;
};

/** チャートデータレスポンス */
export type ChartDataResponse = {
	projectLoads: ProjectLoadAggregation[];
	indirectWorkLoads: IndirectWorkLoadAggregation[];
	capacityLines: CapacityLineAggregation[];
	period: {
		startYearMonth: string;
		endYearMonth: string;
	};
	businessUnitCodes: string[];
};

// --- DB行型（データ層からの戻り値） ---

/** 個別案件工数行 */
export type ProjectDetailRow = {
	projectId: number;
	projectName: string;
	projectTypeCode: string | null;
	yearMonth: string;
	manhour: number;
};

/** 間接工数 + 種類別内訳行 */
export type IndirectWorkLoadRow = {
	indirectWorkCaseId: number;
	caseName: string;
	businessUnitCode: string;
	yearMonth: string;
	manhour: number;
	source: string;
	workTypeCode: string | null;
	workTypeName: string | null;
	workTypeDisplayOrder: number | null;
	ratio: number | null;
	typeManhour: number | null;
};

/** キャパシティ行 */
export type CapacityRow = {
	capacityScenarioId: number;
	scenarioName: string;
	businessUnitCode: string;
	yearMonth: string;
	capacity: number;
};

/** キャパシティライン行（人員計画ケース × キャパシティシナリオの CROSS JOIN 結果） */
export type CapacityLineRow = {
	headcountPlanCaseId: number;
	caseName: string;
	capacityScenarioId: number;
	scenarioName: string;
	businessUnitCode: string;
	yearMonth: string;
	capacity: number;
};

import type { MonthlyCapacity } from "./capacity-scenario";
import type { IndirectWorkTypeRatio } from "./indirect-work";

// --- 間接工数計算パラメータ ---

export type IndirectWorkCalcParams = {
	capacities: MonthlyCapacity[];
	ratios: IndirectWorkTypeRatio[];
};

// --- 間接工数計算結果 ---

export type MonthlyIndirectWorkLoadInput = {
	businessUnitCode: string;
	yearMonth: string;
	manhour: number;
	source: "calculated";
};

export type MonthlyBreakdownItem = {
	workTypeCode: string;
	manhour: number;
};

export type MonthlyBreakdown = {
	yearMonth: string;
	businessUnitCode: string;
	items: MonthlyBreakdownItem[];
	total: number;
};

export type IndirectWorkCalcResult = {
	monthlyLoads: MonthlyIndirectWorkLoadInput[];
	breakdown: MonthlyBreakdown[];
};

// --- Excel出力パラメータ ---

export type ExcelExportParams = {
	headcountPlanCaseName: string;
	scenarioName: string;
	indirectWorkCaseName: string;
	fiscalYear: number;
	tableData: CalculationTableData;
};

// --- 計算結果テーブルデータ ---

export type CalculationTableRow = {
	label: string;
	type: "headcount" | "capacity" | "indirect-breakdown" | "indirect-total";
	workTypeCode?: string;
	monthly: Record<string, number>;
	annualTotal: number;
};

export type CalculationTableData = {
	rows: CalculationTableRow[];
	months: string[];
};

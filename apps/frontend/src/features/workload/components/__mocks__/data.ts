import type {
	AreaSeriesConfig,
	BusinessUnit,
	ChartSeriesConfig,
	LineSeriesConfig,
	MonthlyDataPoint,
	TableRow,
} from "@/features/workload/types";

export const mockBusinessUnits: BusinessUnit[] = [
	{
		businessUnitCode: "BU001",
		name: "エンジニアリング事業部",
		displayOrder: 1,
		createdAt: "2025-01-01T00:00:00Z",
		updatedAt: "2025-01-01T00:00:00Z",
	},
	{
		businessUnitCode: "BU002",
		name: "プラント事業部",
		displayOrder: 2,
		createdAt: "2025-01-01T00:00:00Z",
		updatedAt: "2025-01-01T00:00:00Z",
	},
];

const months = Array.from({ length: 12 }, (_, i) => {
	const m = i + 1;
	return {
		month: `2025/${String(m).padStart(2, "0")}`,
		yearMonth: `2025${String(m).padStart(2, "0")}`,
	};
});

export const mockMonthlyDataPoints: MonthlyDataPoint[] = months.map((m) => ({
	month: m.month,
	yearMonth: m.yearMonth,
	"project-1": 300 + Math.round(Math.random() * 200),
	"project-2": 200 + Math.round(Math.random() * 150),
	"indirect-1": 50 + Math.round(Math.random() * 30),
	"capacity-1": 800,
}));

const mockAreas: AreaSeriesConfig[] = [
	{
		dataKey: "project-1",
		stackId: "stack",
		fill: "#3b82f6",
		stroke: "#3b82f6",
		fillOpacity: 0.6,
		name: "A工場建設PJ",
		type: "project",
	},
	{
		dataKey: "project-2",
		stackId: "stack",
		fill: "#10b981",
		stroke: "#10b981",
		fillOpacity: 0.6,
		name: "B工場改修PJ",
		type: "project",
	},
	{
		dataKey: "indirect-1",
		stackId: "stack",
		fill: "#f59e0b",
		stroke: "#f59e0b",
		fillOpacity: 0.4,
		name: "間接業務",
		type: "indirect",
	},
];

const mockLines: LineSeriesConfig[] = [
	{
		dataKey: "capacity-1",
		stroke: "#ef4444",
		strokeDasharray: "5 5",
		name: "キャパシティ",
	},
];

export const mockSeriesConfig: ChartSeriesConfig = {
	areas: mockAreas,
	lines: mockLines,
};

export const mockTableRows: TableRow[] = [
	{
		id: "capacity-1",
		rowType: "capacity",
		name: "キャパシティ",
		total: 9600,
		monthly: Object.fromEntries(
			months.map((m) => [
				`${m.yearMonth.slice(0, 4)}_${m.yearMonth.slice(4)}`,
				800,
			]),
		),
	},
	{
		id: "project-1",
		rowType: "project",
		name: "A工場建設PJ",
		businessUnitCode: "BU001",
		projectTypeCode: "PT001",
		projectTypeName: "設計",
		total: 4800,
		monthly: Object.fromEntries(
			months.map((m) => [
				`${m.yearMonth.slice(0, 4)}_${m.yearMonth.slice(4)}`,
				400,
			]),
		),
	},
	{
		id: "project-2",
		rowType: "project",
		name: "B工場改修PJ",
		businessUnitCode: "BU001",
		projectTypeCode: "PT002",
		projectTypeName: "施工管理",
		total: 3000,
		monthly: Object.fromEntries(
			months.map((m) => [
				`${m.yearMonth.slice(0, 4)}_${m.yearMonth.slice(4)}`,
				250,
			]),
		),
	},
];

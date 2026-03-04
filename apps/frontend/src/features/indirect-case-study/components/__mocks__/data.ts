import type {
	CalculationTableData,
	CalculationTableRow,
	CapacityScenario,
	HeadcountPlanCase,
	IndirectWorkCase,
	IndirectWorkTypeRatio,
	MonthlyHeadcountPlan,
} from "@/features/indirect-case-study/types";

const months = Array.from(
	{ length: 12 },
	(_, i) => `2025${String(i + 1).padStart(2, "0")}`,
);

export const mockCapacityScenarios: CapacityScenario[] = [
	{
		capacityScenarioId: 1,
		scenarioName: "標準シナリオ",
		isPrimary: true,
		description: "月160時間/人で計算",
		hoursPerPerson: 160,
		createdAt: "2025-01-01T00:00:00Z",
		updatedAt: "2025-01-01T00:00:00Z",
		deletedAt: null,
	},
	{
		capacityScenarioId: 2,
		scenarioName: "繁忙期シナリオ",
		isPrimary: false,
		description: "月180時間/人で計算",
		hoursPerPerson: 180,
		createdAt: "2025-01-01T00:00:00Z",
		updatedAt: "2025-01-01T00:00:00Z",
		deletedAt: null,
	},
];

export const mockHeadcountPlanCases: HeadcountPlanCase[] = [
	{
		headcountPlanCaseId: 1,
		caseName: "現状維持プラン",
		description: "現在の人員数を維持",
		businessUnitCode: null,
		businessUnitName: null,
		isPrimary: true,
		createdAt: "2025-01-01T00:00:00Z",
		updatedAt: "2025-01-01T00:00:00Z",
		deletedAt: null,
	},
	{
		headcountPlanCaseId: 2,
		caseName: "増員プラン",
		description: "4月に5名増員",
		businessUnitCode: "BU001",
		businessUnitName: "エンジニアリング事業部",
		isPrimary: false,
		createdAt: "2025-02-01T00:00:00Z",
		updatedAt: "2025-02-01T00:00:00Z",
		deletedAt: null,
	},
];

export const mockIndirectWorkCases: IndirectWorkCase[] = [
	{
		indirectWorkCaseId: 1,
		caseName: "間接業務ケースA",
		isPrimary: true,
		description: "標準的な間接業務割合",
		businessUnitCode: "BU001",
		businessUnitName: "エンジニアリング事業部",
		createdAt: "2025-01-01T00:00:00Z",
		updatedAt: "2025-01-01T00:00:00Z",
		deletedAt: null,
	},
	{
		indirectWorkCaseId: 2,
		caseName: "間接業務ケースB",
		isPrimary: false,
		description: "間接業務削減後の割合",
		businessUnitCode: "BU001",
		businessUnitName: "エンジニアリング事業部",
		createdAt: "2025-02-01T00:00:00Z",
		updatedAt: "2025-02-01T00:00:00Z",
		deletedAt: null,
	},
];

export const mockMonthlyHeadcounts: MonthlyHeadcountPlan[] = months.flatMap(
	(yearMonth) => [
		{
			monthlyHeadcountPlanId: Number(yearMonth),
			headcountPlanCaseId: 1,
			businessUnitCode: "BU001",
			yearMonth,
			headcount: 20,
			createdAt: "2025-01-01T00:00:00Z",
			updatedAt: "2025-01-01T00:00:00Z",
		},
		{
			monthlyHeadcountPlanId: Number(yearMonth) + 1,
			headcountPlanCaseId: 1,
			businessUnitCode: "BU002",
			yearMonth,
			headcount: 15,
			createdAt: "2025-01-01T00:00:00Z",
			updatedAt: "2025-01-01T00:00:00Z",
		},
	],
);

export const mockIndirectWorkRatios: IndirectWorkTypeRatio[] = [
	{
		indirectWorkTypeRatioId: 1,
		indirectWorkCaseId: 1,
		workTypeCode: "WT001",
		fiscalYear: 2025,
		ratio: 0.15,
		createdAt: "2025-01-01T00:00:00Z",
		updatedAt: "2025-01-01T00:00:00Z",
	},
	{
		indirectWorkTypeRatioId: 2,
		indirectWorkCaseId: 1,
		workTypeCode: "WT002",
		fiscalYear: 2025,
		ratio: 0.1,
		createdAt: "2025-01-01T00:00:00Z",
		updatedAt: "2025-01-01T00:00:00Z",
	},
	{
		indirectWorkTypeRatioId: 3,
		indirectWorkCaseId: 1,
		workTypeCode: "WT003",
		fiscalYear: 2025,
		ratio: 0.05,
		createdAt: "2025-01-01T00:00:00Z",
		updatedAt: "2025-01-01T00:00:00Z",
	},
];

const makeMonthly = (base: number) =>
	Object.fromEntries(
		months.map((m) => [m, base + Math.round(Math.random() * 20)]),
	);

export const mockCalculationTableData: CalculationTableData = {
	months,
	rows: [
		{
			label: "人員数",
			type: "headcount",
			monthly: makeMonthly(20),
			annualTotal: 240,
		} satisfies CalculationTableRow,
		{
			label: "キャパシティ (h)",
			type: "capacity",
			monthly: makeMonthly(3200),
			annualTotal: 38400,
		} satisfies CalculationTableRow,
		{
			label: "基本設計 (15%)",
			type: "indirect-breakdown",
			workTypeCode: "WT001",
			monthly: makeMonthly(480),
			annualTotal: 5760,
		} satisfies CalculationTableRow,
		{
			label: "詳細設計 (10%)",
			type: "indirect-breakdown",
			workTypeCode: "WT002",
			monthly: makeMonthly(320),
			annualTotal: 3840,
		} satisfies CalculationTableRow,
		{
			label: "間接工数合計",
			type: "indirect-total",
			monthly: makeMonthly(800),
			annualTotal: 9600,
		} satisfies CalculationTableRow,
	],
};

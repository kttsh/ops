import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import {
	mockIndirectWorkRatios,
	mockMonthlyHeadcounts,
} from "./__mocks__/data";
import { CalculationResultTable } from "./CalculationResultTable";

const months = Array.from(
	{ length: 12 },
	(_, i) => `2025${String(i + 4 > 12 ? i + 4 - 12 : i + 4).padStart(2, "0")}`,
);

const mockCapacityResult = {
	calculated: 38400,
	hoursPerPerson: 160,
	items: months.map((yearMonth) => ({
		monthlyCapacityId: Number(yearMonth),
		capacityScenarioId: 1,
		businessUnitCode: "BU001",
		yearMonth,
		capacity: 3200,
		createdAt: "2025-01-01T00:00:00Z",
		updatedAt: "2025-01-01T00:00:00Z",
	})),
};

const mockIndirectResult = {
	monthlyLoads: months.map((yearMonth) => ({
		businessUnitCode: "BU001",
		yearMonth,
		manhour: 800,
		source: "calculated" as const,
	})),
	breakdown: months.map((yearMonth) => ({
		yearMonth,
		businessUnitCode: "BU001",
		items: [
			{ workTypeCode: "WT001", manhour: 480 },
			{ workTypeCode: "WT002", manhour: 320 },
		],
		total: 800,
	})),
};

const mockWorkTypes = [
	{
		workTypeCode: "WT001",
		name: "基本設計",
		displayOrder: 1,
		color: "#3b82f6",
		createdAt: "2025-01-01T00:00:00Z",
		updatedAt: "2025-01-01T00:00:00Z",
	},
	{
		workTypeCode: "WT002",
		name: "詳細設計",
		displayOrder: 2,
		color: "#10b981",
		createdAt: "2025-01-01T00:00:00Z",
		updatedAt: "2025-01-01T00:00:00Z",
	},
];

const meta = {
	title: "Features/IndirectCaseStudy/CalculationResultTable",
	component: CalculationResultTable,
	tags: ["autodocs"],
} satisfies Meta<typeof CalculationResultTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		capacityResult: mockCapacityResult,
		indirectWorkResult: mockIndirectResult,
		monthlyHeadcountPlans: mockMonthlyHeadcounts.filter(
			(h) => h.businessUnitCode === "BU001",
		),
		ratios: mockIndirectWorkRatios,
		workTypes: mockWorkTypes,
		fiscalYear: 2025,
		onFiscalYearChange: fn(),
		headcountPlanCaseName: "現状維持プラン",
		scenarioName: "標準シナリオ",
		indirectWorkCaseName: "間接業務ケースA",
	},
};

export const NoData: Story = {
	args: {
		capacityResult: null,
		indirectWorkResult: null,
		monthlyHeadcountPlans: [],
		ratios: [],
		workTypes: mockWorkTypes,
		fiscalYear: 2025,
		onFiscalYearChange: fn(),
		headcountPlanCaseName: "",
		scenarioName: "",
		indirectWorkCaseName: "",
	},
};

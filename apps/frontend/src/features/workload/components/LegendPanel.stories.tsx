import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import type { LegendMonthData } from "@/features/workload/types";
import { mockSeriesConfig } from "./__mocks__/data";
import { LegendPanel } from "./LegendPanel";

const mockLegendData: LegendMonthData = {
	yearMonth: "202506",
	month: "2025/06",
	projects: [
		{ projectId: 1, name: "A工場建設PJ", manhour: 450 },
		{ projectId: 2, name: "B工場改修PJ", manhour: 280 },
	],
	indirectWorkTypes: [
		{ workTypeCode: "WT001", workTypeName: "基本設計", manhour: 60 },
	],
	capacities: [{ scenarioId: 1, scenarioName: "キャパシティ", capacity: 800 }],
	totalManhour: 790,
	totalCapacity: 800,
};

const meta = {
	title: "Features/Workload/LegendPanel",
	component: LegendPanel,
	tags: ["autodocs"],
} satisfies Meta<typeof LegendPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithData: Story = {
	args: {
		data: mockLegendData,
		isPinned: false,
		dispatch: fn(),
		seriesConfig: mockSeriesConfig,
	},
};

export const Pinned: Story = {
	args: {
		data: mockLegendData,
		isPinned: true,
		dispatch: fn(),
		seriesConfig: mockSeriesConfig,
	},
};

export const NoData: Story = {
	args: {
		data: undefined,
		isPinned: false,
		dispatch: fn(),
		seriesConfig: mockSeriesConfig,
	},
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { mockTableRows } from "./__mocks__/data";
import { WorkloadDataTable } from "./WorkloadDataTable";

const meta = {
	title: "Features/Workload/WorkloadDataTable",
	component: WorkloadDataTable,
	tags: ["autodocs"],
	args: {
		selectedYear: 2025,
		availableYears: [2024, 2025, 2026],
		onYearChange: fn(),
		searchText: "",
		onSearchChange: fn(),
		rowTypeFilter: "all",
		onRowTypeFilterChange: fn(),
	},
} satisfies Meta<typeof WorkloadDataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rows: mockTableRows,
		filteredRows: mockTableRows,
	},
};

export const Empty: Story = {
	args: {
		rows: [],
		filteredRows: [],
	},
};

export const FilteredByProject: Story = {
	args: {
		rows: mockTableRows,
		filteredRows: mockTableRows.filter((r) => r.rowType === "project"),
		rowTypeFilter: "project",
	},
};

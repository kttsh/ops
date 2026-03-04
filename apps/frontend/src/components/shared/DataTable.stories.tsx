import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ColumnDef } from "@tanstack/react-table";
import { fn } from "storybook/test";
import { DataTable } from "./DataTable";

interface SampleData {
	code: string;
	name: string;
	displayOrder: number;
}

const sampleColumns: ColumnDef<SampleData, unknown>[] = [
	{ accessorKey: "code", header: "コード" },
	{ accessorKey: "name", header: "名称" },
	{ accessorKey: "displayOrder", header: "表示順" },
];

const sampleData: SampleData[] = Array.from({ length: 25 }, (_, i) => ({
	code: `CODE-${String(i + 1).padStart(3, "0")}`,
	name: `サンプル項目 ${i + 1}`,
	displayOrder: i + 1,
}));

const meta = {
	title: "Shared/DataTable",
	component: DataTable<SampleData>,
	tags: ["autodocs"],
	args: {
		columns: sampleColumns,
		data: sampleData.slice(0, 10),
		globalFilter: "",
	},
} satisfies Meta<typeof DataTable<SampleData>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPagination: Story = {
	args: {
		data: sampleData.slice(0, 10),
		pagination: {
			currentPage: 1,
			pageSize: 10,
			totalItems: 25,
			totalPages: 3,
		},
		onPageChange: fn(),
		onPageSizeChange: fn(),
	},
};

export const Loading: Story = {
	args: { isLoading: true },
};

export const ErrorState: Story = {
	args: { isError: true, errorMessage: "サーバーエラーが発生しました" },
};

export const Empty: Story = {
	args: { data: [] },
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { withRouter } from "@/lib/storybook-decorators";
import { DataTableToolbar } from "./DataTableToolbar";

const meta = {
	title: "Shared/DataTableToolbar",
	component: DataTableToolbar,
	tags: ["autodocs"],
	decorators: [withRouter],
	args: {
		search: "",
		onSearchChange: fn(),
		includeDisabled: false,
		onIncludeDisabledChange: fn(),
		newItemHref: "/master/business-units/new",
	},
} satisfies Meta<typeof DataTableToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSearch: Story = {
	args: { search: "エンジニアリング" },
};

export const IncludeDisabled: Story = {
	args: { includeDisabled: true },
};

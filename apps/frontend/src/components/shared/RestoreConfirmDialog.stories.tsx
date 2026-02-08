import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { RestoreConfirmDialog } from "./RestoreConfirmDialog";

const meta = {
	title: "Shared/RestoreConfirmDialog",
	component: RestoreConfirmDialog,
	tags: ["autodocs"],
	args: {
		open: true,
		onOpenChange: fn(),
		onConfirm: fn(),
		entityLabel: "ビジネスユニット",
		isLoading: false,
	},
} satisfies Meta<typeof RestoreConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
	args: { isLoading: true },
};

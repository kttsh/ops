import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusBadge } from "./StatusBadge";

const meta = {
	title: "Shared/StatusBadge",
	component: StatusBadge,
	tags: ["autodocs"],
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
	args: { isDeleted: false },
};

export const Deleted: Story = {
	args: { isDeleted: true },
};

export const CustomLabels: Story = {
	args: {
		isDeleted: false,
		activeLabel: "有効",
		deletedLabel: "無効",
	},
};

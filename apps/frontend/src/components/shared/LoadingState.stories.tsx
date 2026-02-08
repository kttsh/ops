import type { Meta, StoryObj } from "@storybook/react-vite";
import { LoadingState } from "./LoadingState";

const meta = {
	title: "Shared/LoadingState",
	component: LoadingState,
	tags: ["autodocs"],
} satisfies Meta<typeof LoadingState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomMessage: Story = {
	args: {
		message: "データを取得しています...",
	},
};

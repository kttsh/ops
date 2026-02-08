import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ErrorState } from "./ErrorState";

const meta = {
	title: "Shared/ErrorState",
	component: ErrorState,
	tags: ["autodocs"],
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithRetry: Story = {
	args: {
		onRetry: fn(),
	},
};

export const CustomMessage: Story = {
	args: {
		title: "接続エラー",
		message: "サーバーに接続できませんでした。ネットワーク接続を確認してください。",
		onRetry: fn(),
	},
};

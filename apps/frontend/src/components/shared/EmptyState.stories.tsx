import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./EmptyState";

const meta = {
	title: "Shared/EmptyState",
	component: EmptyState,
	tags: ["autodocs"],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDescription: Story = {
	args: {
		title: "案件がありません",
		description: "新しい案件を登録してください。",
	},
};

export const WithAction: Story = {
	args: {
		title: "検索結果がありません",
		description: "キーワードを変更してお試しください。",
		action: <Button variant="outline">フィルタをリセット</Button>,
	},
};

export const CustomIcon: Story = {
	args: {
		icon: <FileX className="h-12 w-12" />,
		title: "ファイルが見つかりません",
	},
};

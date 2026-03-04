import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";

const meta = {
	title: "UI/Button",
	component: Button,
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: [
				"default",
				"destructive",
				"outline",
				"secondary",
				"ghost",
				"link",
			],
		},
		size: {
			control: "select",
			options: ["default", "sm", "lg", "icon"],
		},
	},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { children: "ボタン", variant: "default", size: "default" },
};

export const Destructive: Story = {
	args: { children: "削除", variant: "destructive" },
};

export const Outline: Story = {
	args: { children: "アウトライン", variant: "outline" },
};

export const Secondary: Story = {
	args: { children: "セカンダリ", variant: "secondary" },
};

export const Ghost: Story = {
	args: { children: "ゴースト", variant: "ghost" },
};

export const Link: Story = {
	args: { children: "リンク", variant: "link" },
};

export const Small: Story = {
	args: { children: "小", size: "sm" },
};

export const Large: Story = {
	args: { children: "大", size: "lg" },
};

export const Icon: Story = {
	args: { children: "✕", size: "icon" },
};

export const Disabled: Story = {
	args: { children: "無効", disabled: true },
};

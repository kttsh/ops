import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { WorkloadChart } from "./WorkloadChart";

const mockData = Array.from({ length: 12 }, (_, i) => ({
	yearMonth: `2025${String(i + 1).padStart(2, "0")}`,
	manhour: 500 + Math.round(Math.random() * 500),
}));

const meta = {
	title: "Features/CaseStudy/WorkloadChart",
	component: WorkloadChart,
	tags: ["autodocs"],
	decorators: [
		(Story) =>
			React.createElement(
				"div",
				{ style: { width: "100%", maxWidth: 800 } },
				React.createElement(Story),
			),
	],
} satisfies Meta<typeof WorkloadChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		data: mockData,
	},
};

export const Empty: Story = {
	args: {
		data: [],
	},
};

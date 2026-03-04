import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ScenarioFormSheet } from "./ScenarioFormSheet";

const meta = {
	title: "Features/IndirectCaseStudy/ScenarioFormSheet",
	component: ScenarioFormSheet,
	tags: ["autodocs"],
} satisfies Meta<typeof ScenarioFormSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateMode: Story = {
	args: {
		open: true,
		onOpenChange: fn(),
		mode: "create",
		onSubmit: fn(),
		isSubmitting: false,
	},
};

export const EditMode: Story = {
	args: {
		open: true,
		onOpenChange: fn(),
		mode: "edit",
		defaultValues: {
			scenarioName: "標準シナリオ",
			description: "月160時間/人で計算",
			hoursPerPerson: 160,
			isPrimary: true,
		},
		onSubmit: fn(),
		isSubmitting: false,
	},
};

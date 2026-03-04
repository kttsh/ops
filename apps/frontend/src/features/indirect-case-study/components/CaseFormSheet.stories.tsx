import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { CaseFormSheet } from "./CaseFormSheet";

const meta = {
	title: "Features/IndirectCaseStudy/CaseFormSheet",
	component: CaseFormSheet,
	tags: ["autodocs"],
} satisfies Meta<typeof CaseFormSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HeadcountPlanCreate: Story = {
	args: {
		open: true,
		onOpenChange: fn(),
		mode: "create",
		caseType: "headcountPlan",
		onSubmit: fn(),
		isSubmitting: false,
	},
};

export const HeadcountPlanEdit: Story = {
	args: {
		open: true,
		onOpenChange: fn(),
		mode: "edit",
		caseType: "headcountPlan",
		defaultValues: {
			caseName: "現状維持プラン",
			description: "現在の人員数を維持",
			isPrimary: true,
		},
		onSubmit: fn(),
		isSubmitting: false,
	},
};

export const IndirectWorkCreate: Story = {
	args: {
		open: true,
		onOpenChange: fn(),
		mode: "create",
		caseType: "indirectWork",
		onSubmit: fn(),
		isSubmitting: false,
	},
};

export const IndirectWorkEdit: Story = {
	args: {
		open: true,
		onOpenChange: fn(),
		mode: "edit",
		caseType: "indirectWork",
		defaultValues: {
			caseName: "間接業務ケースA",
			description: "標準的な間接業務割合",
			isPrimary: true,
		},
		onSubmit: fn(),
		isSubmitting: false,
	},
};

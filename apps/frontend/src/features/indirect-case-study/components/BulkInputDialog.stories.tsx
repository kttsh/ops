import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { BulkInputDialog } from "./BulkInputDialog";

const meta = {
	title: "Features/IndirectCaseStudy/BulkInputDialog",
	component: BulkInputDialog,
	tags: ["autodocs"],
	args: {
		open: true,
		onOpenChange: fn(),
		fiscalYear: 2025,
		fiscalYearOptions: [2024, 2025, 2026],
		onApply: fn(),
	},
} satisfies Meta<typeof BulkInputDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

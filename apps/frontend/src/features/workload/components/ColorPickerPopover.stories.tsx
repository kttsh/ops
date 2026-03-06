import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { CAPACITY_COLORS, PROJECT_TYPE_COLORS } from "@/lib/chart-colors";
import { ColorPickerPopover } from "./ColorPickerPopover";

const meta = {
	title: "Features/Workload/ColorPickerPopover",
	component: ColorPickerPopover,
	tags: ["autodocs"],
} satisfies Meta<typeof ColorPickerPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProjectColors: Story = {
	args: {
		colors: PROJECT_TYPE_COLORS,
		value: PROJECT_TYPE_COLORS[0],
		onChange: fn(),
	},
};

export const CapacityColors: Story = {
	args: {
		colors: CAPACITY_COLORS,
		value: CAPACITY_COLORS[0],
		onChange: fn(),
	},
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { mockIndirectWorkCases } from "./__mocks__/data";
import { IndirectWorkCaseList } from "./IndirectWorkCaseList";

const meta = {
	title: "Features/IndirectCaseStudy/IndirectWorkCaseList",
	component: IndirectWorkCaseList,
	tags: ["autodocs"],
} satisfies Meta<typeof IndirectWorkCaseList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		items: mockIndirectWorkCases,
		selectedId: 1,
		onSelect: fn(),
		businessUnitCode: "BU001",
		isLoading: false,
		includeDisabled: false,
		onIncludeDisabledChange: fn(),
	},
};

export const Empty: Story = {
	args: {
		items: [],
		selectedId: null,
		onSelect: fn(),
		businessUnitCode: "BU001",
		isLoading: false,
		includeDisabled: false,
		onIncludeDisabledChange: fn(),
	},
};

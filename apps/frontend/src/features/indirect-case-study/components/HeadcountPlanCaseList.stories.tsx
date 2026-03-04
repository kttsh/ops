import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { mockHeadcountPlanCases } from "./__mocks__/data";
import { HeadcountPlanCaseList } from "./HeadcountPlanCaseList";

const meta = {
	title: "Features/IndirectCaseStudy/HeadcountPlanCaseList",
	component: HeadcountPlanCaseList,
	tags: ["autodocs"],
} satisfies Meta<typeof HeadcountPlanCaseList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		items: mockHeadcountPlanCases,
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

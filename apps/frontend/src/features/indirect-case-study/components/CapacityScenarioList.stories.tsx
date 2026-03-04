import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { mockCapacityScenarios } from "./__mocks__/data";
import { CapacityScenarioList } from "./CapacityScenarioList";

const meta = {
	title: "Features/IndirectCaseStudy/CapacityScenarioList",
	component: CapacityScenarioList,
	tags: ["autodocs"],
} satisfies Meta<typeof CapacityScenarioList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		items: mockCapacityScenarios,
		selectedId: 1,
		onSelect: fn(),
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
		isLoading: false,
		includeDisabled: false,
		onIncludeDisabledChange: fn(),
	},
};

export const Loading: Story = {
	args: {
		items: [],
		selectedId: null,
		onSelect: fn(),
		isLoading: true,
		includeDisabled: false,
		onIncludeDisabledChange: fn(),
	},
};

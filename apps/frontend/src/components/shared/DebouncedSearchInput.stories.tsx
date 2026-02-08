import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { DebouncedSearchInput } from "./DebouncedSearchInput";

const meta = {
	title: "Shared/DebouncedSearchInput",
	component: DebouncedSearchInput,
	tags: ["autodocs"],
	args: {
		value: "",
		onChange: fn(),
		placeholder: "コードまたは名称で検索...",
	},
} satisfies Meta<typeof DebouncedSearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
	args: { value: "エンジニアリング" },
};

export const CustomDelay: Story = {
	args: { delay: 500, placeholder: "500ms遅延で検索..." },
};

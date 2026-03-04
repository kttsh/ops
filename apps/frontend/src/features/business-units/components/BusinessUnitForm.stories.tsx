import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { BusinessUnitForm } from "./BusinessUnitForm";

const meta = {
	title: "Features/BusinessUnits/BusinessUnitForm",
	component: BusinessUnitForm,
	tags: ["autodocs"],
} satisfies Meta<typeof BusinessUnitForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateMode: Story = {
	args: {
		mode: "create",
		onSubmit: fn(),
		isSubmitting: false,
	},
};

export const EditMode: Story = {
	args: {
		mode: "edit",
		defaultValues: {
			businessUnitCode: "BU001",
			name: "エンジニアリング事業部",
			displayOrder: 1,
		},
		onSubmit: fn(),
		isSubmitting: false,
	},
};

export const Submitting: Story = {
	args: {
		mode: "create",
		onSubmit: fn(),
		isSubmitting: true,
	},
};

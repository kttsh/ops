import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";

const meta = {
	title: "Shared/UnsavedChangesDialog",
	component: UnsavedChangesDialog,
	tags: ["autodocs"],
	args: {
		open: true,
		onCancel: fn(),
		onConfirmLeave: fn(),
		onSaveAndLeave: fn(),
		isSaving: false,
	},
} satisfies Meta<typeof UnsavedChangesDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Saving: Story = {
	args: { isSaving: true },
};

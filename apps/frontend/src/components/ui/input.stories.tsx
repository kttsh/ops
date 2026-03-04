import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";

const meta = {
	title: "UI/Input",
	component: Input,
	tags: ["autodocs"],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};

export const WithPlaceholder: Story = {
	args: { placeholder: "テキストを入力..." },
};

export const Disabled: Story = {
	args: { placeholder: "無効な入力", disabled: true },
};

export const WithValue: Story = {
	args: { defaultValue: "入力済みテキスト" },
};

export const Password: Story = {
	args: { type: "password", placeholder: "パスワード" },
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "./sheet";

type SheetSide = "top" | "right" | "bottom" | "left";

const SheetExample = ({ side = "right" }: { side?: SheetSide }) => (
	<Sheet>
		<SheetTrigger asChild>
			<Button variant="outline">シートを開く ({side})</Button>
		</SheetTrigger>
		<SheetContent side={side}>
			<SheetHeader>
				<SheetTitle>シートタイトル</SheetTitle>
				<SheetDescription>
					シートの説明テキストがここに入ります。
				</SheetDescription>
			</SheetHeader>
			<div className="py-4">シートのコンテンツ</div>
		</SheetContent>
	</Sheet>
);

const meta = {
	title: "UI/Sheet",
	component: SheetExample,
	tags: ["autodocs"],
	argTypes: {
		side: {
			control: "select",
			options: ["top", "right", "bottom", "left"],
		},
	},
} satisfies Meta<typeof SheetExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Right: Story = {
	args: { side: "right" },
};

export const Left: Story = {
	args: { side: "left" },
};

export const Top: Story = {
	args: { side: "top" },
};

export const Bottom: Story = {
	args: { side: "bottom" },
};

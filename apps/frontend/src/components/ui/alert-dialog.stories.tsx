import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./alert-dialog";
import { Button } from "./button";

const AlertDialogExample = () => (
	<AlertDialog>
		<AlertDialogTrigger asChild>
			<Button variant="outline">ダイアログを開く</Button>
		</AlertDialogTrigger>
		<AlertDialogContent>
			<AlertDialogHeader>
				<AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
				<AlertDialogDescription>
					この操作は取り消せません。データは完全に削除されます。
				</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel>キャンセル</AlertDialogCancel>
				<AlertDialogAction>削除する</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
);

const meta = {
	title: "UI/AlertDialog",
	component: AlertDialogExample,
	tags: ["autodocs"],
} satisfies Meta<typeof AlertDialogExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

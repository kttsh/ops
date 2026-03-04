import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@/components/ui/button";
import { withRouter } from "@/lib/storybook-decorators";
import { PageHeader } from "./PageHeader";

const meta = {
	title: "Shared/PageHeader",
	component: PageHeader,
	tags: ["autodocs"],
	decorators: [withRouter],
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ListPage: Story = {
	args: {
		title: "ビジネスユニット",
		description: "ビジネスユニットの一覧を管理します",
	},
};

export const DetailPage: Story = {
	args: {
		breadcrumbs: [
			{ label: "ビジネスユニット一覧", href: "/master/business-units" },
			{ label: "エンジニアリング事業部" },
		],
		title: "エンジニアリング事業部",
		actions: (
			<>
				<Button variant="outline">編集</Button>
				<Button variant="destructive">削除</Button>
			</>
		),
	},
};

export const EditPage: Story = {
	args: {
		breadcrumbs: [
			{ label: "ビジネスユニット一覧", href: "/master/business-units" },
			{ label: "エンジニアリング事業部", href: "/master/business-units/ENG" },
			{ label: "編集" },
		],
		title: "ビジネスユニット 編集",
		description: "ビジネスユニット情報を編集します",
	},
};

export const NewPage: Story = {
	args: {
		breadcrumbs: [
			{ label: "ビジネスユニット一覧", href: "/master/business-units" },
			{ label: "新規登録" },
		],
		title: "ビジネスユニット 新規登録",
		description: "新しいビジネスユニットを登録します",
	},
};

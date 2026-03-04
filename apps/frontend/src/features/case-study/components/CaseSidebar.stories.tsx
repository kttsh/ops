import type { Meta, StoryObj } from "@storybook/react-vite";
import { HttpResponse, http } from "msw";
import { fn } from "storybook/test";
import { mockProjectCases } from "./__mocks__/data";
import { CaseSidebar } from "./CaseSidebar";

const meta = {
	title: "Features/CaseStudy/CaseSidebar",
	component: CaseSidebar,
	tags: ["autodocs"],
	parameters: {
		msw: {
			handlers: [
				http.get("/api/projects/:projectId/cases", () => {
					return HttpResponse.json({
						data: mockProjectCases,
						meta: { total: mockProjectCases.length },
					});
				}),
			],
		},
	},
} satisfies Meta<typeof CaseSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		projectId: 1,
		selectedCaseId: 1,
		onSelectCase: fn(),
		onNewCase: fn(),
		onEditCase: fn(),
		onDeleteCase: fn(),
	},
};

export const NoSelection: Story = {
	args: {
		projectId: 1,
		selectedCaseId: null,
		onSelectCase: fn(),
		onNewCase: fn(),
		onEditCase: fn(),
		onDeleteCase: fn(),
	},
};

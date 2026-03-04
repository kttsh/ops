import type { Meta, StoryObj } from "@storybook/react-vite";
import { HttpResponse, http } from "msw";
import { fn } from "storybook/test";
import { mockProjects } from "@/features/projects/components/__mocks__/data";
import { SidePanelProjects } from "./SidePanelProjects";

const meta = {
	title: "Features/Workload/SidePanelProjects",
	component: SidePanelProjects,
	tags: ["autodocs"],
	parameters: {
		msw: {
			handlers: [
				http.get("/api/projects", () => {
					return HttpResponse.json({
						data: mockProjects,
						meta: { total: mockProjects.length, page: 1, pageSize: 100 },
					});
				}),
			],
		},
	},
} satisfies Meta<typeof SidePanelProjects>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		businessUnitCodes: ["BU001"],
		selectedProjectIds: new Set([1]),
		onSelectionChange: fn(),
	},
};

export const NoSelection: Story = {
	args: {
		businessUnitCodes: ["BU001"],
		selectedProjectIds: new Set(),
		onSelectionChange: fn(),
	},
};

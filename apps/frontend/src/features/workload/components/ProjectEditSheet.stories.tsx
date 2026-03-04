import type { Meta, StoryObj } from "@storybook/react-vite";
import { HttpResponse, http } from "msw";
import { fn } from "storybook/test";
import { mockBusinessUnits } from "@/features/business-units/components/__mocks__/data";
import { mockProjectTypes } from "@/features/project-types/components/__mocks__/data";
import { mockProjects } from "@/features/projects/components/__mocks__/data";
import { ProjectEditSheet } from "./ProjectEditSheet";

const meta = {
	title: "Features/Workload/ProjectEditSheet",
	component: ProjectEditSheet,
	tags: ["autodocs"],
	parameters: {
		msw: {
			handlers: [
				http.get("/api/projects/:id", () => {
					return HttpResponse.json({ data: mockProjects[0] });
				}),
				http.get("/api/business-units/select", () => {
					return HttpResponse.json({
						data: mockBusinessUnits.map((bu) => ({
							value: bu.businessUnitCode,
							label: bu.name,
						})),
					});
				}),
				http.get("/api/project-types/select", () => {
					return HttpResponse.json({
						data: mockProjectTypes.map((pt) => ({
							value: pt.projectTypeCode,
							label: pt.name,
						})),
					});
				}),
			],
		},
	},
} satisfies Meta<typeof ProjectEditSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		projectId: 1,
		open: true,
		onOpenChange: fn(),
	},
};

export const Closed: Story = {
	args: {
		projectId: null,
		open: false,
		onOpenChange: fn(),
	},
};

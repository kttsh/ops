import type { Meta, StoryObj } from "@storybook/react-vite";
import { HttpResponse, http } from "msw";
import { mockProject } from "@/features/projects/components/__mocks__/data";
import {
	mockProjectCases,
	mockProjectLoads,
	mockStandardEffortMasters,
} from "./__mocks__/data";
import { CaseStudySection } from "./CaseStudySection";

const meta = {
	title: "Features/CaseStudy/CaseStudySection",
	component: CaseStudySection,
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
				http.get("/api/projects/:projectId/cases/:caseId", () => {
					return HttpResponse.json({ data: mockProjectCases[0] });
				}),
				http.get("/api/projects/:projectId/cases/:caseId/loads", () => {
					return HttpResponse.json({ data: mockProjectLoads });
				}),
				http.get("/api/standard-efforts", () => {
					return HttpResponse.json({
						data: mockStandardEffortMasters,
						meta: { total: mockStandardEffortMasters.length },
					});
				}),
			],
		},
	},
} satisfies Meta<typeof CaseStudySection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		projectId: 1,
		project: mockProject,
	},
};

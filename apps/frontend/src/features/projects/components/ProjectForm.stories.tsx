import type { Meta, StoryObj } from "@storybook/react-vite";
import { HttpResponse, http } from "msw";
import { fn } from "storybook/test";
import { mockBusinessUnits } from "@/features/business-units/components/__mocks__/data";
import { mockProjectTypes } from "@/features/project-types/components/__mocks__/data";
import { ProjectForm } from "./ProjectForm";

const meta = {
	title: "Features/Projects/ProjectForm",
	component: ProjectForm,
	tags: ["autodocs"],
	parameters: {
		msw: {
			handlers: [
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
} satisfies Meta<typeof ProjectForm>;

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
			projectCode: "PRJ001",
			name: "A工場建設プロジェクト",
			businessUnitCode: "BU001",
			projectTypeCode: "PT001",
			startYearMonth: "202504",
			totalManhour: 12000,
			status: "confirmed",
			durationMonths: 24,
		},
		onSubmit: fn(),
		isSubmitting: false,
	},
};

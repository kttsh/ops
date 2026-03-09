import type { Meta, StoryObj } from "@storybook/react-vite";
import { HttpResponse, http } from "msw";
import { fn } from "storybook/test";
import { mockStandardEffortMasters } from "./__mocks__/data";
import { CaseFormSheet } from "./CaseFormSheet";

const meta = {
	title: "Features/CaseStudy/CaseFormSheet",
	component: CaseFormSheet,
	tags: ["autodocs"],
	parameters: {
		msw: {
			handlers: [
				http.get("/api/standard-efforts", () => {
					return HttpResponse.json({
						data: mockStandardEffortMasters,
						meta: { total: mockStandardEffortMasters.length },
					});
				}),
			],
		},
	},
} satisfies Meta<typeof CaseFormSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateMode: Story = {
	args: {
		open: true,
		onOpenChange: fn(),
		mode: "create",
		projectId: 1,
		project: {
			projectId: 1,
			projectCode: "PRJ001",
			name: "A工場建設プロジェクト",
			businessUnitCode: "BU001",
			businessUnitName: "エンジニアリング事業部",
			projectTypeCode: "PT001",
			projectTypeName: "設計",
			startYearMonth: "202504",
			totalManhour: 12000,
			status: "confirmed",
			durationMonths: 24,
			createdAt: "2025-01-01T00:00:00Z",
			updatedAt: "2025-01-01T00:00:00Z",
			cases: [{ projectCaseId: 1, caseName: "標準", isPrimary: true }],
		},
		editCaseId: null,
		onSuccess: fn(),
	},
};

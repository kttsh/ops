import type { Meta, StoryObj } from "@storybook/react-vite";
import { HttpResponse, http } from "msw";
import { fn } from "storybook/test";
import { mockMonthlyHeadcounts } from "./__mocks__/data";
import { MonthlyHeadcountGrid } from "./MonthlyHeadcountGrid";

const meta = {
	title: "Features/IndirectCaseStudy/MonthlyHeadcountGrid",
	component: MonthlyHeadcountGrid,
	tags: ["autodocs"],
	parameters: {
		msw: {
			handlers: [
				http.get("/api/headcount-plan-cases/:id/monthly", () => {
					return HttpResponse.json({
						data: mockMonthlyHeadcounts.filter(
							(h) => h.businessUnitCode === "BU001",
						),
					});
				}),
			],
		},
	},
} satisfies Meta<typeof MonthlyHeadcountGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		headcountPlanCaseId: 1,
		businessUnitCode: "BU001",
		fiscalYear: 2025,
		onFiscalYearChange: fn(),
		onDirtyChange: fn(),
		onLocalDataChange: fn(),
	},
};

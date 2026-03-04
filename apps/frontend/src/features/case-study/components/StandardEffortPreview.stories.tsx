import type { Meta, StoryObj } from "@storybook/react-vite";
import { HttpResponse, http } from "msw";
import { mockStandardEffortDetail } from "./__mocks__/data";
import { StandardEffortPreview } from "./StandardEffortPreview";

const meta = {
	title: "Features/CaseStudy/StandardEffortPreview",
	component: StandardEffortPreview,
	tags: ["autodocs"],
	parameters: {
		msw: {
			handlers: [
				http.get("/api/standard-efforts/:id", () => {
					return HttpResponse.json({
						data: mockStandardEffortDetail,
					});
				}),
			],
		},
	},
} satisfies Meta<typeof StandardEffortPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithData: Story = {
	args: { standardEffortId: 1 },
};

export const NoSelection: Story = {
	args: { standardEffortId: null },
};

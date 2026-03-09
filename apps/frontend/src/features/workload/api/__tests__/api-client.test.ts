import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchChartData } from "@/features/workload/api/api-client";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

beforeEach(() => {
	mockFetch.mockReset();
});

const baseParams = {
	businessUnitCodes: ["BU01"],
	startYearMonth: "202401",
	endYearMonth: "202412",
};

function mockOkResponse() {
	mockFetch.mockResolvedValueOnce({
		ok: true,
		status: 200,
		json: async () => ({
			data: {
				projectLoads: [],
				indirectWorkLoads: [],
				capacities: [],
				period: { startYearMonth: "202401", endYearMonth: "202412" },
				businessUnitCodes: ["BU01"],
			},
		}),
	});
}

describe("fetchChartData", () => {
	it("projectCaseIdsが指定された場合、クエリパラメータに含める", async () => {
		mockOkResponse();

		await fetchChartData({
			...baseParams,
			projectCaseIds: [101, 102, 105],
		});

		const url = mockFetch.mock.calls[0][0] as string;
		expect(url).toContain("projectCaseIds=101%2C102%2C105");
	});

	it("projectCaseIdsが空配列の場合、クエリパラメータに含めない", async () => {
		mockOkResponse();

		await fetchChartData({
			...baseParams,
			projectCaseIds: [],
		});

		const url = mockFetch.mock.calls[0][0] as string;
		expect(url).not.toContain("projectCaseIds");
	});

	it("projectCaseIdsが未指定の場合、クエリパラメータに含めない", async () => {
		mockOkResponse();

		await fetchChartData(baseParams);

		const url = mockFetch.mock.calls[0][0] as string;
		expect(url).not.toContain("projectCaseIds");
	});

	it("projectCaseIdsとprojectIdsを同時に指定できる", async () => {
		mockOkResponse();

		await fetchChartData({
			...baseParams,
			projectIds: [1, 2, 3],
			projectCaseIds: [101, 102],
		});

		const url = mockFetch.mock.calls[0][0] as string;
		expect(url).toContain("projectIds=1%2C2%2C3");
		expect(url).toContain("projectCaseIds=101%2C102");
	});
});

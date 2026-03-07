import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { StatusCode } from "hono/utils/http-status";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
	getProblemType,
	getStatusTitle,
	problemResponse,
} from "@/utils/errorHelper";

// --- モック ---
vi.mock("@/services/chartViewCapacityItemService", () => ({
	chartViewCapacityItemService: {
		findAll: vi.fn(),
		bulkUpsert: vi.fn(),
	},
}));

import chartViewCapacityItems from "@/routes/chartViewCapacityItems";
import { chartViewCapacityItemService } from "@/services/chartViewCapacityItemService";

const mockedService = vi.mocked(chartViewCapacityItemService);

function createApp() {
	const app = new Hono();

	app.route("/chart-views/:chartViewId/capacity-items", chartViewCapacityItems);

	app.onError((err, c) => {
		if (err instanceof HTTPException) {
			const status = err.status as StatusCode;
			return problemResponse(
				c,
				{
					type: `https://example.com/problems/${getProblemType(status)}`,
					status,
					title: getStatusTitle(status),
					detail: err.message,
					instance: c.req.path,
					timestamp: new Date().toISOString(),
				},
				status,
			);
		}
		return problemResponse(
			c,
			{
				type: "https://example.com/problems/internal-error",
				status: 500,
				title: "Internal Server Error",
				detail: "An unexpected error occurred",
				instance: c.req.path,
				timestamp: new Date().toISOString(),
			},
			500,
		);
	});

	return app;
}

// --- テスト用データ ---
const sampleItem1 = {
	chartViewCapacityItemId: 1,
	chartViewId: 10,
	capacityScenarioId: 1,
	scenarioName: "標準シナリオ",
	isVisible: true,
	colorCode: "#dc2626",
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
};

const sampleItem2 = {
	chartViewCapacityItemId: 2,
	chartViewId: 10,
	capacityScenarioId: 2,
	scenarioName: "楽観シナリオ",
	isVisible: false,
	colorCode: null,
	createdAt: "2026-01-02T00:00:00.000Z",
	updatedAt: "2026-01-02T00:00:00.000Z",
};

describe("chartViewCapacityItems route", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	// ===========================================================================
	// GET /
	// ===========================================================================
	describe("GET /chart-views/:chartViewId/capacity-items", () => {
		test("200 と一覧データを返す", async () => {
			mockedService.findAll.mockResolvedValue([sampleItem1, sampleItem2]);

			const res = await app.request("/chart-views/10/capacity-items", {
				method: "GET",
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.data).toHaveLength(2);
			expect(body.data[0].chartViewCapacityItemId).toBe(1);
			expect(mockedService.findAll).toHaveBeenCalledWith(10);
		});

		test("空配列を返す", async () => {
			mockedService.findAll.mockResolvedValue([]);

			const res = await app.request("/chart-views/10/capacity-items", {
				method: "GET",
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.data).toHaveLength(0);
		});

		test("チャートビュー不存在で 404 を返す", async () => {
			mockedService.findAll.mockRejectedValue(
				new HTTPException(404, {
					message: "Chart view with ID '999' not found",
				}),
			);

			const res = await app.request("/chart-views/999/capacity-items", {
				method: "GET",
			});

			expect(res.status).toBe(404);
		});

		test("chartViewId が不正な場合 422 を返す", async () => {
			const res = await app.request("/chart-views/abc/capacity-items", {
				method: "GET",
			});

			expect(res.status).toBe(422);
		});
	});

	// ===========================================================================
	// PUT /bulk
	// ===========================================================================
	describe("PUT /chart-views/:chartViewId/capacity-items/bulk", () => {
		test("200 と更新後データを返す", async () => {
			mockedService.bulkUpsert.mockResolvedValue([sampleItem1, sampleItem2]);

			const res = await app.request("/chart-views/10/capacity-items/bulk", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					items: [
						{
							capacityScenarioId: 1,
							isVisible: true,
							colorCode: "#dc2626",
						},
						{
							capacityScenarioId: 2,
							isVisible: false,
							colorCode: null,
						},
					],
				}),
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.data).toHaveLength(2);
			expect(mockedService.bulkUpsert).toHaveBeenCalledWith(10, {
				items: [
					{
						capacityScenarioId: 1,
						isVisible: true,
						colorCode: "#dc2626",
					},
					{
						capacityScenarioId: 2,
						isVisible: false,
						colorCode: null,
					},
				],
			});
		});

		test("空配列で 200 を返す", async () => {
			mockedService.bulkUpsert.mockResolvedValue([]);

			const res = await app.request("/chart-views/10/capacity-items/bulk", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ items: [] }),
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.data).toHaveLength(0);
		});

		test("チャートビュー不存在で 404 を返す", async () => {
			mockedService.bulkUpsert.mockRejectedValue(
				new HTTPException(404, {
					message: "Chart view with ID '999' not found",
				}),
			);

			const res = await app.request("/chart-views/999/capacity-items/bulk", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					items: [
						{
							capacityScenarioId: 1,
							isVisible: true,
							colorCode: null,
						},
					],
				}),
			});

			expect(res.status).toBe(404);
		});

		test("バリデーションエラーで 422 を返す", async () => {
			const res = await app.request("/chart-views/10/capacity-items/bulk", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					items: [{ capacityScenarioId: -1 }],
				}),
			});

			expect(res.status).toBe(422);
		});

		test("不正な colorCode で 422 を返す", async () => {
			const res = await app.request("/chart-views/10/capacity-items/bulk", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					items: [
						{
							capacityScenarioId: 1,
							isVisible: true,
							colorCode: "invalid",
						},
					],
				}),
			});

			expect(res.status).toBe(422);
		});
	});
});

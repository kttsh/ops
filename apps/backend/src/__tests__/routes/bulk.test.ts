import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { StatusCode } from "hono/utils/http-status";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
	getProblemType,
	getStatusTitle,
	problemResponse,
} from "@/utils/errorHelper";

vi.mock("@/services/importExportService", () => ({
	importExportService: {
		getExportData: vi.fn(),
		bulkImport: vi.fn(),
	},
}));

import bulk from "@/routes/bulk";
import { importExportService } from "@/services/importExportService";

const mockedService = vi.mocked(importExportService);

function createApp() {
	const app = new Hono();

	app.route("/bulk", bulk);

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
const sampleExportData = {
	data: [
		{
			projectCaseId: 1,
			projectName: "案件A",
			caseName: "標準ケース",
			loads: [
				{ yearMonth: "202601", manhour: 1000 },
				{ yearMonth: "202602", manhour: 2000 },
			],
		},
	],
	yearMonths: ["202601", "202602"],
};

// =============================================================================
// GET /bulk/export-project-loads - エクスポート
// =============================================================================
describe("GET /bulk/export-project-loads", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("全案件の工数データを JSON で返す", async () => {
		mockedService.getExportData.mockResolvedValue(sampleExportData);

		const res = await app.request("/bulk/export-project-loads");
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toHaveLength(1);
		expect(body.yearMonths).toEqual(["202601", "202602"]);
	});

	test("データが空の場合も 200 を返す", async () => {
		mockedService.getExportData.mockResolvedValue({
			data: [],
			yearMonths: [],
		});

		const res = await app.request("/bulk/export-project-loads");
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toEqual([]);
		expect(body.yearMonths).toEqual([]);
	});

	test("サービスエラー時に 500 を返す", async () => {
		mockedService.getExportData.mockRejectedValue(new Error("DB Error"));

		const res = await app.request("/bulk/export-project-loads");
		expect(res.status).toBe(500);

		const body = await res.json();
		expect(body.type).toContain("internal-error");
	});
});

// =============================================================================
// POST /bulk/import-project-loads - インポート
// =============================================================================
describe("POST /bulk/import-project-loads", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常インポートで 200 と更新件数を返す", async () => {
		mockedService.bulkImport.mockResolvedValue({
			updatedCases: 2,
			updatedRecords: 3,
		});

		const res = await app.request("/bulk/import-project-loads", {
			method: "POST",
			body: JSON.stringify({
				items: [
					{ projectCaseId: 1, yearMonth: "202601", manhour: 1000 },
					{ projectCaseId: 1, yearMonth: "202602", manhour: 2000 },
					{ projectCaseId: 2, yearMonth: "202601", manhour: 500 },
				],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toEqual({ updatedCases: 2, updatedRecords: 3 });
	});

	test("バリデーションエラー（空配列）で 422 を返す", async () => {
		const res = await app.request("/bulk/import-project-loads", {
			method: "POST",
			body: JSON.stringify({ items: [] }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("バリデーションエラー（yearMonth 形式不正）で 422 を返す", async () => {
		const res = await app.request("/bulk/import-project-loads", {
			method: "POST",
			body: JSON.stringify({
				items: [{ projectCaseId: 1, yearMonth: "2026-01", manhour: 1000 }],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("バリデーションエラー（manhour 負値）で 422 を返す", async () => {
		const res = await app.request("/bulk/import-project-loads", {
			method: "POST",
			body: JSON.stringify({
				items: [{ projectCaseId: 1, yearMonth: "202601", manhour: -1 }],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("バリデーションエラー（projectCaseId 不正）で 422 を返す", async () => {
		const res = await app.request("/bulk/import-project-loads", {
			method: "POST",
			body: JSON.stringify({
				items: [{ projectCaseId: 0, yearMonth: "202601", manhour: 100 }],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("存在しない projectCaseId で 422 を返す", async () => {
		mockedService.bulkImport.mockRejectedValue(
			new HTTPException(422, {
				message: "Invalid project case IDs: 999",
			}),
		);

		const res = await app.request("/bulk/import-project-loads", {
			method: "POST",
			body: JSON.stringify({
				items: [{ projectCaseId: 999, yearMonth: "202601", manhour: 100 }],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("items 未指定で 422 を返す", async () => {
		const res = await app.request("/bulk/import-project-loads", {
			method: "POST",
			body: JSON.stringify({}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("サービスエラー時に 500 を返す", async () => {
		mockedService.bulkImport.mockRejectedValue(new Error("DB Error"));

		const res = await app.request("/bulk/import-project-loads", {
			method: "POST",
			body: JSON.stringify({
				items: [{ projectCaseId: 1, yearMonth: "202601", manhour: 100 }],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(500);

		const body = await res.json();
		expect(body.type).toContain("internal-error");
	});
});

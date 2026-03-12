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
			projectCode: "PRJ-001",
			businessUnitCode: "BU-A",
			fiscalYear: 2026,
			projectTypeCode: "PT-001",
			name: "案件A",
			nickname: null,
			customerName: null,
			orderNumber: null,
			startYearMonth: "202601",
			totalManhour: 5000,
			durationMonths: 12,
			calculationBasis: null,
			remarks: null,
			region: null,
			projectCaseId: 1,
			caseName: "標準ケース",
			loads: [
				{ yearMonth: "202601", manhour: 1000 },
				{ yearMonth: "202602", manhour: 2000 },
			],
		},
	],
	yearMonths: ["202601", "202602"],
};

/** 新スキーマ用の有効なインポート行 */
const validImportItem = {
	projectCode: "PRJ-001",
	businessUnitCode: "BU-A",
	fiscalYear: 2026,
	projectTypeCode: "PT-001",
	name: "テスト案件",
	nickname: null,
	customerName: null,
	orderNumber: null,
	startYearMonth: "202601",
	totalManhour: 1000,
	durationMonths: 12,
	calculationBasis: null,
	remarks: null,
	region: null,
	deleteFlag: false,
	projectCaseId: 1,
	caseName: "標準ケース",
	loads: [{ yearMonth: "202601", manhour: 100 }],
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
			createdProjects: 1,
			updatedProjects: 0,
			deletedProjects: 0,
			createdCases: 1,
			updatedCases: 0,
			updatedRecords: 1,
		});

		const res = await app.request("/bulk/import-project-loads", {
			method: "POST",
			body: JSON.stringify({
				items: [validImportItem],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data.createdProjects).toBe(1);
		expect(body.data.updatedRecords).toBe(1);
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

	test("バリデーションエラー（businessUnitCode 空文字）で 422 を返す", async () => {
		const res = await app.request("/bulk/import-project-loads", {
			method: "POST",
			body: JSON.stringify({
				items: [{ ...validImportItem, businessUnitCode: "" }],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("バリデーションエラー（name 空文字）で 422 を返す", async () => {
		const res = await app.request("/bulk/import-project-loads", {
			method: "POST",
			body: JSON.stringify({
				items: [{ ...validImportItem, name: "" }],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("バリデーションエラー（startYearMonth 形式不正）で 422 を返す", async () => {
		const res = await app.request("/bulk/import-project-loads", {
			method: "POST",
			body: JSON.stringify({
				items: [{ ...validImportItem, startYearMonth: "2026-01" }],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("バリデーションエラー（totalManhour 負値）で 422 を返す", async () => {
		const res = await app.request("/bulk/import-project-loads", {
			method: "POST",
			body: JSON.stringify({
				items: [{ ...validImportItem, totalManhour: -1 }],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("マスタ不整合（BU コード不存在）で 422 を返す", async () => {
		mockedService.bulkImport.mockRejectedValue(
			new HTTPException(422, {
				message: "Invalid business unit codes: BU-INVALID",
			}),
		);

		const res = await app.request("/bulk/import-project-loads", {
			method: "POST",
			body: JSON.stringify({
				items: [{ ...validImportItem, businessUnitCode: "BU-INVALID" }],
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
				items: [validImportItem],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(500);

		const body = await res.json();
		expect(body.type).toContain("internal-error");
	});
});

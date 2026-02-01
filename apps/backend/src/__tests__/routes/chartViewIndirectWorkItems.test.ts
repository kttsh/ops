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
vi.mock("@/services/chartViewIndirectWorkItemService", () => ({
	chartViewIndirectWorkItemService: {
		findAll: vi.fn(),
		findById: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	},
}));

import chartViewIndirectWorkItems from "@/routes/chartViewIndirectWorkItems";
// モックをインポート（vi.mock の後）
import { chartViewIndirectWorkItemService } from "@/services/chartViewIndirectWorkItemService";

const mockedService = vi.mocked(chartViewIndirectWorkItemService);

// テスト用アプリ（グローバルエラーハンドラ付き）
function createApp() {
	const app = new Hono();

	app.route(
		"/chart-views/:chartViewId/indirect-work-items",
		chartViewIndirectWorkItems,
	);

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
	chartViewIndirectWorkItemId: 1,
	chartViewId: 10,
	indirectWorkCaseId: 100,
	caseName: "間接作業ケースA",
	displayOrder: 0,
	isVisible: true,
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
};

const sampleItem2 = {
	chartViewIndirectWorkItemId: 2,
	chartViewId: 10,
	indirectWorkCaseId: 200,
	caseName: "間接作業ケースB",
	displayOrder: 1,
	isVisible: false,
	createdAt: "2026-01-02T00:00:00.000Z",
	updatedAt: "2026-01-02T00:00:00.000Z",
};

const BASE_URL = "/chart-views/10/indirect-work-items";

// =============================================================================
// GET /chart-views/:chartViewId/indirect-work-items - 一覧取得
// =============================================================================
describe("GET /chart-views/:chartViewId/indirect-work-items", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("一覧を data 配列形式で返す", async () => {
		mockedService.findAll.mockResolvedValue([sampleItem1, sampleItem2]);

		const res = await app.request(BASE_URL);
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toHaveLength(2);
		expect(body.data[0]).toMatchObject(sampleItem1);
		expect(body.data[1]).toMatchObject(sampleItem2);
	});

	test("displayOrder 昇順でソートされた結果を返す", async () => {
		mockedService.findAll.mockResolvedValue([sampleItem1, sampleItem2]);

		const res = await app.request(BASE_URL);
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data[0].displayOrder).toBeLessThan(body.data[1].displayOrder);
	});

	test("caseName が含まれることを確認する", async () => {
		mockedService.findAll.mockResolvedValue([sampleItem1]);

		const res = await app.request(BASE_URL);
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data[0].caseName).toBe("間接作業ケースA");
	});

	test("サービスの呼び出しパラメータを検証する", async () => {
		mockedService.findAll.mockResolvedValue([]);

		const res = await app.request(BASE_URL);
		expect(res.status).toBe(200);

		expect(mockedService.findAll).toHaveBeenCalledWith(10);
	});

	test("存在しないチャートビューIDで 404 を返す", async () => {
		mockedService.findAll.mockRejectedValue(
			new HTTPException(404, { message: "Chart view with ID '999' not found" }),
		);

		const res = await app.request("/chart-views/999/indirect-work-items");
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("不正な chartViewId で 422 を返す", async () => {
		const res = await app.request("/chart-views/abc/indirect-work-items");
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});
});

// =============================================================================
// GET /:chartViewIndirectWorkItemId - 単一取得
// =============================================================================
describe("GET /chart-views/:chartViewId/indirect-work-items/:id", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("指定IDの項目を data オブジェクトで返す", async () => {
		mockedService.findById.mockResolvedValue(sampleItem1);

		const res = await app.request(`${BASE_URL}/1`);
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toMatchObject(sampleItem1);
	});

	test("caseName が含まれることを確認する", async () => {
		mockedService.findById.mockResolvedValue(sampleItem1);

		const res = await app.request(`${BASE_URL}/1`);
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data.caseName).toBe("間接作業ケースA");
	});

	test("存在しないIDで 404 を返す", async () => {
		mockedService.findById.mockRejectedValue(
			new HTTPException(404, {
				message: "Chart view indirect work item with ID '999' not found",
			}),
		);

		const res = await app.request(`${BASE_URL}/999`);
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("chartViewId 不一致で 404 を返す", async () => {
		mockedService.findById.mockRejectedValue(
			new HTTPException(404, {
				message: "Chart view indirect work item with ID '1' not found",
			}),
		);

		const res = await app.request("/chart-views/20/indirect-work-items/1");
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("不正なパスパラメータで 422 を返す", async () => {
		const res = await app.request(`${BASE_URL}/abc`);
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});
});

// =============================================================================
// POST / - 新規作成
// =============================================================================
describe("POST /chart-views/:chartViewId/indirect-work-items", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常作成で 201 と Location ヘッダを返す", async () => {
		mockedService.create.mockResolvedValue(sampleItem1);

		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				indirectWorkCaseId: 100,
				displayOrder: 0,
				isVisible: true,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(201);
		expect(res.headers.get("Location")).toBe(
			"/chart-views/10/indirect-work-items/1",
		);

		const body = await res.json();
		expect(body.data).toMatchObject(sampleItem1);
	});

	test("デフォルト値で作成できる（displayOrder, isVisible 省略）", async () => {
		mockedService.create.mockResolvedValue(sampleItem1);

		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				indirectWorkCaseId: 100,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(201);

		expect(mockedService.create).toHaveBeenCalledWith(10, {
			indirectWorkCaseId: 100,
			displayOrder: 0,
			isVisible: true,
		});
	});

	test("バリデーションエラー（indirectWorkCaseId 欠落）で 422 を返す", async () => {
		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				displayOrder: 0,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
		expect(body.errors).toBeDefined();
	});

	test("バリデーションエラー（indirectWorkCaseId が文字列）で 422 を返す", async () => {
		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				indirectWorkCaseId: "abc",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("バリデーションエラー（負の displayOrder）で 422 を返す", async () => {
		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				indirectWorkCaseId: 100,
				displayOrder: -1,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("バリデーションエラー（indirectWorkCaseId が0以下）で 422 を返す", async () => {
		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				indirectWorkCaseId: 0,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("親チャートビュー不存在で 404 を返す", async () => {
		mockedService.create.mockRejectedValue(
			new HTTPException(404, { message: "Chart view with ID '999' not found" }),
		);

		const res = await app.request("/chart-views/999/indirect-work-items", {
			method: "POST",
			body: JSON.stringify({
				indirectWorkCaseId: 100,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("存在しない間接作業ケースIDで 422 を返す", async () => {
		mockedService.create.mockRejectedValue(
			new HTTPException(422, {
				message: "Indirect work case with ID '999' not found",
			}),
		);

		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				indirectWorkCaseId: 999,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("重複する間接作業ケースIDで 409 を返す", async () => {
		mockedService.create.mockRejectedValue(
			new HTTPException(409, {
				message:
					"Indirect work case with ID '100' already exists in chart view '10'",
			}),
		);

		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				indirectWorkCaseId: 100,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(409);

		const body = await res.json();
		expect(body.type).toContain("conflict");
	});
});

// =============================================================================
// PUT /:chartViewIndirectWorkItemId - 更新
// =============================================================================
describe("PUT /chart-views/:chartViewId/indirect-work-items/:id", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常更新で 200 を返す", async () => {
		const updatedItem = { ...sampleItem1, displayOrder: 5 };
		mockedService.update.mockResolvedValue(updatedItem);

		const res = await app.request(`${BASE_URL}/1`, {
			method: "PUT",
			body: JSON.stringify({ displayOrder: 5 }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data.displayOrder).toBe(5);
	});

	test("isVisible 更新の反映を検証する", async () => {
		const updatedItem = { ...sampleItem1, isVisible: false };
		mockedService.update.mockResolvedValue(updatedItem);

		const res = await app.request(`${BASE_URL}/1`, {
			method: "PUT",
			body: JSON.stringify({ isVisible: false }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data.isVisible).toBe(false);
	});

	test("存在しないIDで 404 を返す", async () => {
		mockedService.update.mockRejectedValue(
			new HTTPException(404, {
				message: "Chart view indirect work item with ID '999' not found",
			}),
		);

		const res = await app.request(`${BASE_URL}/999`, {
			method: "PUT",
			body: JSON.stringify({ displayOrder: 5 }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("chartViewId 不一致で 404 を返す", async () => {
		mockedService.update.mockRejectedValue(
			new HTTPException(404, {
				message: "Chart view indirect work item with ID '1' not found",
			}),
		);

		const res = await app.request("/chart-views/20/indirect-work-items/1", {
			method: "PUT",
			body: JSON.stringify({ displayOrder: 5 }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("バリデーションエラー（負の displayOrder）で 422 を返す", async () => {
		const res = await app.request(`${BASE_URL}/1`, {
			method: "PUT",
			body: JSON.stringify({ displayOrder: -1 }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("バリデーションエラー（isVisible が文字列）で 422 を返す", async () => {
		const res = await app.request(`${BASE_URL}/1`, {
			method: "PUT",
			body: JSON.stringify({ isVisible: "yes" }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});
});

// =============================================================================
// DELETE /:chartViewIndirectWorkItemId - 物理削除
// =============================================================================
describe("DELETE /chart-views/:chartViewId/indirect-work-items/:id", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常削除で 204 No Content を返す", async () => {
		mockedService.delete.mockResolvedValue(undefined);

		const res = await app.request(`${BASE_URL}/1`, {
			method: "DELETE",
		});
		expect(res.status).toBe(204);
	});

	test("存在しないIDで 404 を返す", async () => {
		mockedService.delete.mockRejectedValue(
			new HTTPException(404, {
				message: "Chart view indirect work item with ID '999' not found",
			}),
		);

		const res = await app.request(`${BASE_URL}/999`, {
			method: "DELETE",
		});
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("chartViewId 不一致で 404 を返す", async () => {
		mockedService.delete.mockRejectedValue(
			new HTTPException(404, {
				message: "Chart view indirect work item with ID '1' not found",
			}),
		);

		const res = await app.request("/chart-views/20/indirect-work-items/1", {
			method: "DELETE",
		});
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("不正なパスパラメータで 422 を返す", async () => {
		const res = await app.request(`${BASE_URL}/abc`, {
			method: "DELETE",
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});
});

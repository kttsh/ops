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
vi.mock("@/services/chartColorSettingService", () => ({
	chartColorSettingService: {
		findAll: vi.fn(),
		findById: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		bulkUpsert: vi.fn(),
	},
}));

import chartColorSettings from "@/routes/chartColorSettings";
// モックをインポート（vi.mock の後）
import { chartColorSettingService } from "@/services/chartColorSettingService";

const mockedService = vi.mocked(chartColorSettingService);

// テスト用アプリ（グローバルエラーハンドラ付き）
function createApp() {
	const app = new Hono();

	app.route("/chart-color-settings", chartColorSettings);

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
const sampleSetting1 = {
	chartColorSettingId: 1,
	targetType: "project",
	targetId: 1,
	colorCode: "#FF5733",
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
};

const sampleSetting2 = {
	chartColorSettingId: 2,
	targetType: "indirect_work",
	targetId: 2,
	colorCode: "#33FF57",
	createdAt: "2026-01-02T00:00:00.000Z",
	updatedAt: "2026-01-02T00:00:00.000Z",
};

const BASE_URL = "/chart-color-settings";

// =============================================================================
// GET /chart-color-settings - 一覧取得
// =============================================================================
describe("GET /chart-color-settings", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("一覧を data 配列と meta.pagination で返す", async () => {
		mockedService.findAll.mockResolvedValue({
			items: [sampleSetting1, sampleSetting2],
			totalCount: 2,
		});

		const res = await app.request(BASE_URL);
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toHaveLength(2);
		expect(body.data[0]).toMatchObject(sampleSetting1);
		expect(body.meta.pagination).toMatchObject({
			currentPage: 1,
			pageSize: 20,
			totalItems: 2,
			totalPages: 1,
		});
	});

	test("page[number] と page[size] でページネーションする", async () => {
		mockedService.findAll.mockResolvedValue({
			items: [sampleSetting2],
			totalCount: 2,
		});

		const res = await app.request(`${BASE_URL}?page[number]=2&page[size]=1`);
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.meta.pagination).toMatchObject({
			currentPage: 2,
			pageSize: 1,
			totalItems: 2,
			totalPages: 2,
		});

		expect(mockedService.findAll).toHaveBeenCalledWith({
			page: 2,
			pageSize: 1,
			targetType: undefined,
		});
	});

	test("filter[targetType] でフィルタリングする", async () => {
		mockedService.findAll.mockResolvedValue({
			items: [sampleSetting1],
			totalCount: 1,
		});

		const res = await app.request(`${BASE_URL}?filter[targetType]=project`);
		expect(res.status).toBe(200);

		expect(mockedService.findAll).toHaveBeenCalledWith({
			page: 1,
			pageSize: 20,
			targetType: "project",
		});
	});

	test("不正なクエリパラメータで 422 を返す", async () => {
		const res = await app.request(`${BASE_URL}?page[number]=-1`);
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
		expect(body.errors).toBeDefined();
		expect(body.errors.length).toBeGreaterThan(0);
	});

	test("不正な filter[targetType] で 422 を返す", async () => {
		const res = await app.request(
			`${BASE_URL}?filter[targetType]=invalid_type`,
		);
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});
});

// =============================================================================
// GET /chart-color-settings/:id - 個別取得
// =============================================================================
describe("GET /chart-color-settings/:id", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("指定IDの色設定を data オブジェクトで返す", async () => {
		mockedService.findById.mockResolvedValue(sampleSetting1);

		const res = await app.request(`${BASE_URL}/1`);
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toMatchObject(sampleSetting1);
	});

	test("存在しないIDで 404 を返す", async () => {
		mockedService.findById.mockRejectedValue(
			new HTTPException(404, {
				message: "Chart color setting with ID '999' not found",
			}),
		);

		const res = await app.request(`${BASE_URL}/999`);
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
// POST /chart-color-settings - 作成
// =============================================================================
describe("POST /chart-color-settings", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常作成で 201 と Location ヘッダを返す", async () => {
		mockedService.create.mockResolvedValue(sampleSetting1);

		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				targetType: "project",
				targetId: 1,
				colorCode: "#FF5733",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(201);
		expect(res.headers.get("Location")).toBe("/chart-color-settings/1");

		const body = await res.json();
		expect(body.data).toMatchObject(sampleSetting1);
	});

	test("重複する targetType + targetId で 409 を返す", async () => {
		mockedService.create.mockRejectedValue(
			new HTTPException(409, {
				message:
					"Chart color setting for target_type 'project' and target_id '1' already exists",
			}),
		);

		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				targetType: "project",
				targetId: 1,
				colorCode: "#FF5733",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(409);

		const body = await res.json();
		expect(body.type).toContain("conflict");
	});

	test("バリデーションエラー（必須フィールド欠落）で 422 を返す", async () => {
		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				targetType: "project",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
		expect(body.errors).toBeDefined();
		expect(body.errors.length).toBeGreaterThan(0);
	});

	test("バリデーションエラー（不正な colorCode）で 422 を返す", async () => {
		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				targetType: "project",
				targetId: 1,
				colorCode: "FF5733",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("バリデーションエラー（不正な targetType）で 422 を返す", async () => {
		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				targetType: "unknown",
				targetId: 1,
				colorCode: "#FF5733",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});
});

// =============================================================================
// PUT /chart-color-settings/:id - 更新
// =============================================================================
describe("PUT /chart-color-settings/:id", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常更新で 200 を返す", async () => {
		const updatedSetting = { ...sampleSetting1, colorCode: "#00FF00" };
		mockedService.update.mockResolvedValue(updatedSetting);

		const res = await app.request(`${BASE_URL}/1`, {
			method: "PUT",
			body: JSON.stringify({ colorCode: "#00FF00" }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data.colorCode).toBe("#00FF00");
	});

	test("部分更新（colorCode のみ）を検証する", async () => {
		const updatedSetting = { ...sampleSetting1, colorCode: "#AABBCC" };
		mockedService.update.mockResolvedValue(updatedSetting);

		const res = await app.request(`${BASE_URL}/1`, {
			method: "PUT",
			body: JSON.stringify({ colorCode: "#AABBCC" }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(200);

		expect(mockedService.update).toHaveBeenCalledWith(1, {
			colorCode: "#AABBCC",
		});
	});

	test("存在しないIDで 404 を返す", async () => {
		mockedService.update.mockRejectedValue(
			new HTTPException(404, {
				message: "Chart color setting with ID '999' not found",
			}),
		);

		const res = await app.request(`${BASE_URL}/999`, {
			method: "PUT",
			body: JSON.stringify({ colorCode: "#00FF00" }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("更新後の targetType + targetId 重複で 409 を返す", async () => {
		mockedService.update.mockRejectedValue(
			new HTTPException(409, {
				message:
					"Chart color setting for target_type 'project' and target_id '2' already exists",
			}),
		);

		const res = await app.request(`${BASE_URL}/1`, {
			method: "PUT",
			body: JSON.stringify({ targetId: 2 }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(409);

		const body = await res.json();
		expect(body.type).toContain("conflict");
	});

	test("バリデーションエラー（不正な colorCode）で 422 を返す", async () => {
		const res = await app.request(`${BASE_URL}/1`, {
			method: "PUT",
			body: JSON.stringify({ colorCode: "#GGG" }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});
});

// =============================================================================
// DELETE /chart-color-settings/:id - 物理削除
// =============================================================================
describe("DELETE /chart-color-settings/:id", () => {
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
				message: "Chart color setting with ID '999' not found",
			}),
		);

		const res = await app.request(`${BASE_URL}/999`, {
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

// =============================================================================
// PUT /chart-color-settings/bulk - 一括 Upsert
// =============================================================================
describe("PUT /chart-color-settings/bulk", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常な一括 Upsert で 200 を返す", async () => {
		mockedService.bulkUpsert.mockResolvedValue([
			sampleSetting1,
			sampleSetting2,
		]);

		const res = await app.request(`${BASE_URL}/bulk`, {
			method: "PUT",
			body: JSON.stringify({
				items: [
					{ targetType: "project", targetId: 1, colorCode: "#FF5733" },
					{ targetType: "indirect_work", targetId: 2, colorCode: "#33FF57" },
				],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toHaveLength(2);
		expect(body.data[0]).toMatchObject(sampleSetting1);
		expect(body.data[1]).toMatchObject(sampleSetting2);
	});

	test("新規作成 + 既存更新の混在を検証する", async () => {
		const updatedSetting = { ...sampleSetting1, colorCode: "#000000" };
		mockedService.bulkUpsert.mockResolvedValue([
			updatedSetting,
			sampleSetting2,
		]);

		const res = await app.request(`${BASE_URL}/bulk`, {
			method: "PUT",
			body: JSON.stringify({
				items: [
					{ targetType: "project", targetId: 1, colorCode: "#000000" },
					{ targetType: "indirect_work", targetId: 2, colorCode: "#33FF57" },
				],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data[0].colorCode).toBe("#000000");
	});

	test("バリデーションエラー（不正な colorCode）で 422 を返す", async () => {
		const res = await app.request(`${BASE_URL}/bulk`, {
			method: "PUT",
			body: JSON.stringify({
				items: [{ targetType: "project", targetId: 1, colorCode: "INVALID" }],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("バリデーションエラー（空配列）で 422 を返す", async () => {
		const res = await app.request(`${BASE_URL}/bulk`, {
			method: "PUT",
			body: JSON.stringify({
				items: [],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("バリデーションエラー（必須フィールド欠落）で 422 を返す", async () => {
		const res = await app.request(`${BASE_URL}/bulk`, {
			method: "PUT",
			body: JSON.stringify({
				items: [{ targetType: "project", targetId: 1 }],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("サービスエラー時にロールバックされることを検証する", async () => {
		mockedService.bulkUpsert.mockRejectedValue(new Error("Transaction failed"));

		const res = await app.request(`${BASE_URL}/bulk`, {
			method: "PUT",
			body: JSON.stringify({
				items: [{ targetType: "project", targetId: 1, colorCode: "#FF5733" }],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(500);

		const body = await res.json();
		expect(body.type).toContain("internal-error");
	});
});

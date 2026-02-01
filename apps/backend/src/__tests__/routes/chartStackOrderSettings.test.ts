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
vi.mock("@/services/chartStackOrderSettingService", () => ({
	chartStackOrderSettingService: {
		findAll: vi.fn(),
		findById: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		bulkUpsert: vi.fn(),
	},
}));

import chartStackOrderSettings from "@/routes/chartStackOrderSettings";
// モックをインポート（vi.mock の後）
import { chartStackOrderSettingService } from "@/services/chartStackOrderSettingService";

const mockedService = vi.mocked(chartStackOrderSettingService);

// テスト用アプリ（グローバルエラーハンドラ付き）
function createApp() {
	const app = new Hono();

	app.route("/chart-stack-order-settings", chartStackOrderSettings);

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
	chartStackOrderSettingId: 1,
	targetType: "project",
	targetCode: "1",
	stackOrder: 1,
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
};

const sampleSetting2 = {
	chartStackOrderSettingId: 2,
	targetType: "indirect_work",
	targetCode: "2",
	stackOrder: 2,
	createdAt: "2026-01-02T00:00:00.000Z",
	updatedAt: "2026-01-02T00:00:00.000Z",
};

const BASE_URL = "/chart-stack-order-settings";

// =============================================================================
// GET /chart-stack-order-settings - 一覧取得
// =============================================================================
describe("GET /chart-stack-order-settings", () => {
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
});

// =============================================================================
// GET /chart-stack-order-settings/:id - 個別取得
// =============================================================================
describe("GET /chart-stack-order-settings/:id", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("指定IDの設定を data オブジェクトで返す", async () => {
		mockedService.findById.mockResolvedValue(sampleSetting1);

		const res = await app.request(`${BASE_URL}/1`);
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toMatchObject(sampleSetting1);
	});

	test("存在しないIDで 404 を返す", async () => {
		mockedService.findById.mockRejectedValue(
			new HTTPException(404, {
				message: "Chart stack order setting with ID '999' not found",
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
// POST /chart-stack-order-settings - 作成
// =============================================================================
describe("POST /chart-stack-order-settings", () => {
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
				targetCode: "1",
				stackOrder: 1,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(201);
		expect(res.headers.get("Location")).toBe("/chart-stack-order-settings/1");

		const body = await res.json();
		expect(body.data).toMatchObject(sampleSetting1);
	});

	test("重複する targetType + targetCode で 409 を返す", async () => {
		mockedService.create.mockRejectedValue(
			new HTTPException(409, {
				message:
					"Chart stack order setting with target type 'project' and target code '1' already exists",
			}),
		);

		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				targetType: "project",
				targetCode: "1",
				stackOrder: 1,
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

	test("バリデーションエラー（targetCode が空文字）で 422 を返す", async () => {
		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				targetType: "project",
				targetCode: "",
				stackOrder: 1,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("バリデーションエラー（targetType が21文字超）で 422 を返す", async () => {
		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				targetType: "a".repeat(21),
				targetCode: "1",
				stackOrder: 1,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});
});

// =============================================================================
// PUT /chart-stack-order-settings/:id - 更新
// =============================================================================
describe("PUT /chart-stack-order-settings/:id", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常更新で 200 を返す", async () => {
		const updatedSetting = { ...sampleSetting1, stackOrder: 5 };
		mockedService.update.mockResolvedValue(updatedSetting);

		const res = await app.request(`${BASE_URL}/1`, {
			method: "PUT",
			body: JSON.stringify({ stackOrder: 5 }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data.stackOrder).toBe(5);
	});

	test("部分更新（stackOrder のみ）を検証する", async () => {
		const updatedSetting = { ...sampleSetting1, stackOrder: 10 };
		mockedService.update.mockResolvedValue(updatedSetting);

		const res = await app.request(`${BASE_URL}/1`, {
			method: "PUT",
			body: JSON.stringify({ stackOrder: 10 }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(200);

		expect(mockedService.update).toHaveBeenCalledWith(1, { stackOrder: 10 });
	});

	test("存在しないIDで 404 を返す", async () => {
		mockedService.update.mockRejectedValue(
			new HTTPException(404, {
				message: "Chart stack order setting with ID '999' not found",
			}),
		);

		const res = await app.request(`${BASE_URL}/999`, {
			method: "PUT",
			body: JSON.stringify({ stackOrder: 5 }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("更新後の targetType + targetCode 重複で 409 を返す", async () => {
		mockedService.update.mockRejectedValue(
			new HTTPException(409, {
				message:
					"Chart stack order setting with target type 'project' and target code '2' already exists",
			}),
		);

		const res = await app.request(`${BASE_URL}/1`, {
			method: "PUT",
			body: JSON.stringify({ targetCode: "2" }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(409);

		const body = await res.json();
		expect(body.type).toContain("conflict");
	});

	test("不正なパスパラメータで 422 を返す", async () => {
		const res = await app.request(`${BASE_URL}/abc`, {
			method: "PUT",
			body: JSON.stringify({ stackOrder: 5 }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});
});

// =============================================================================
// DELETE /chart-stack-order-settings/:id - 物理削除
// =============================================================================
describe("DELETE /chart-stack-order-settings/:id", () => {
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
				message: "Chart stack order setting with ID '999' not found",
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
// PUT /chart-stack-order-settings/bulk - 一括 Upsert
// =============================================================================
describe("PUT /chart-stack-order-settings/bulk", () => {
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
					{ targetType: "project", targetCode: "1", stackOrder: 1 },
					{ targetType: "indirect_work", targetCode: "2", stackOrder: 2 },
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

	test("入力配列内の (targetType, targetCode) 重複で 422 を返す", async () => {
		mockedService.bulkUpsert.mockRejectedValue(
			new HTTPException(422, {
				message: "Duplicate targetType and targetCode combination found in items",
			}),
		);

		const res = await app.request(`${BASE_URL}/bulk`, {
			method: "PUT",
			body: JSON.stringify({
				items: [
					{ targetType: "project", targetCode: "1", stackOrder: 1 },
					{ targetType: "project", targetCode: "1", stackOrder: 2 },
				],
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
				items: [{ targetType: "project", targetCode: "1" }],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("サービスエラー時に 500 を返す", async () => {
		mockedService.bulkUpsert.mockRejectedValue(new Error("Transaction failed"));

		const res = await app.request(`${BASE_URL}/bulk`, {
			method: "PUT",
			body: JSON.stringify({
				items: [{ targetType: "project", targetCode: "1", stackOrder: 1 }],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(500);

		const body = await res.json();
		expect(body.type).toContain("internal-error");
	});
});

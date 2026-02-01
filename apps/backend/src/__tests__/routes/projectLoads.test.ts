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
vi.mock("@/services/projectLoadService", () => ({
	projectLoadService: {
		findAll: vi.fn(),
		findById: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		bulkUpsert: vi.fn(),
	},
}));

import projectLoads from "@/routes/projectLoads";
// モックをインポート（vi.mock の後）
import { projectLoadService } from "@/services/projectLoadService";

const mockedService = vi.mocked(projectLoadService);

// テスト用アプリ（グローバルエラーハンドラ付き）
function createApp() {
	const app = new Hono();

	app.route("/project-cases/:projectCaseId/project-loads", projectLoads);

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
const sampleLoad1 = {
	projectLoadId: 1,
	projectCaseId: 10,
	yearMonth: "202601",
	manhour: 100,
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
};

const sampleLoad2 = {
	projectLoadId: 2,
	projectCaseId: 10,
	yearMonth: "202602",
	manhour: 200,
	createdAt: "2026-01-02T00:00:00.000Z",
	updatedAt: "2026-01-02T00:00:00.000Z",
};

const BASE_URL = "/project-cases/10/project-loads";

// =============================================================================
// GET /project-cases/:projectCaseId/project-loads - 一覧取得
// =============================================================================
describe("GET /project-cases/:projectCaseId/project-loads", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("一覧を data 配列形式で返す", async () => {
		mockedService.findAll.mockResolvedValue([sampleLoad1, sampleLoad2]);

		const res = await app.request(BASE_URL);
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toHaveLength(2);
		expect(body.data[0]).toMatchObject(sampleLoad1);
		expect(body.data[1]).toMatchObject(sampleLoad2);
	});

	test("year_month 昇順でソートされる（サービスの呼び出しを検証）", async () => {
		mockedService.findAll.mockResolvedValue([sampleLoad1, sampleLoad2]);

		const res = await app.request(BASE_URL);
		expect(res.status).toBe(200);

		expect(mockedService.findAll).toHaveBeenCalledWith(10);

		const body = await res.json();
		expect(body.data[0].yearMonth).toBe("202601");
		expect(body.data[1].yearMonth).toBe("202602");
	});

	test("存在しない/論理削除済みの案件ケースIDで 404 を返す", async () => {
		mockedService.findAll.mockRejectedValue(
			new HTTPException(404, {
				message: "Project case with ID '999' not found",
			}),
		);

		const res = await app.request("/project-cases/999/project-loads");
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("不正な projectCaseId で 422 を返す", async () => {
		const res = await app.request("/project-cases/abc/project-loads");
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});
});

// =============================================================================
// GET /project-cases/:projectCaseId/project-loads/:projectLoadId - 単一取得
// =============================================================================
describe("GET /project-cases/:projectCaseId/project-loads/:projectLoadId", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("指定IDの負荷データを data オブジェクトで返す", async () => {
		mockedService.findById.mockResolvedValue(sampleLoad1);

		const res = await app.request(`${BASE_URL}/1`);
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toMatchObject(sampleLoad1);
	});

	test("存在しない負荷データIDで 404 を返す", async () => {
		mockedService.findById.mockRejectedValue(
			new HTTPException(404, {
				message: "Project load with ID '999' not found",
			}),
		);

		const res = await app.request(`${BASE_URL}/999`);
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("案件ケースID不一致で 404 を返す", async () => {
		mockedService.findById.mockRejectedValue(
			new HTTPException(404, { message: "Project load with ID '1' not found" }),
		);

		const res = await app.request("/project-cases/20/project-loads/1");
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
// POST /project-cases/:projectCaseId/project-loads - 新規作成
// =============================================================================
describe("POST /project-cases/:projectCaseId/project-loads", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常作成で 201 と Location ヘッダを返す", async () => {
		mockedService.create.mockResolvedValue(sampleLoad1);

		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				yearMonth: "202601",
				manhour: 100,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(201);
		expect(res.headers.get("Location")).toBe(
			"/project-cases/10/project-loads/1",
		);

		const body = await res.json();
		expect(body.data).toMatchObject(sampleLoad1);
	});

	test("バリデーションエラー（yearMonth 形式不正）で 422 を返す", async () => {
		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				yearMonth: "2026-01",
				manhour: 100,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
		expect(body.errors).toBeDefined();
	});

	test("バリデーションエラー（月が13）で 422 を返す", async () => {
		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				yearMonth: "202613",
				manhour: 100,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("バリデーションエラー（manhour 負値）で 422 を返す", async () => {
		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				yearMonth: "202601",
				manhour: -1,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("バリデーションエラー（manhour 上限超過）で 422 を返す", async () => {
		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				yearMonth: "202601",
				manhour: 100000000,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("親ケース不存在で 404 を返す", async () => {
		mockedService.create.mockRejectedValue(
			new HTTPException(404, {
				message: "Project case with ID '999' not found",
			}),
		);

		const res = await app.request("/project-cases/999/project-loads", {
			method: "POST",
			body: JSON.stringify({
				yearMonth: "202601",
				manhour: 100,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("年月重複で 409 を返す", async () => {
		mockedService.create.mockRejectedValue(
			new HTTPException(409, {
				message:
					"Project load for year-month '202601' already exists in project case '10'",
			}),
		);

		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				yearMonth: "202601",
				manhour: 100,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(409);

		const body = await res.json();
		expect(body.type).toContain("conflict");
	});
});

// =============================================================================
// PUT /project-cases/:projectCaseId/project-loads/:projectLoadId - 更新
// =============================================================================
describe("PUT /project-cases/:projectCaseId/project-loads/:projectLoadId", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常更新で 200 を返す", async () => {
		const updatedLoad = { ...sampleLoad1, manhour: 150 };
		mockedService.update.mockResolvedValue(updatedLoad);

		const res = await app.request(`${BASE_URL}/1`, {
			method: "PUT",
			body: JSON.stringify({ manhour: 150 }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data.manhour).toBe(150);
	});

	test("更新されたフィールドの反映を検証する", async () => {
		const updatedLoad = { ...sampleLoad1, yearMonth: "202603", manhour: 300 };
		mockedService.update.mockResolvedValue(updatedLoad);

		const res = await app.request(`${BASE_URL}/1`, {
			method: "PUT",
			body: JSON.stringify({
				yearMonth: "202603",
				manhour: 300,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data.yearMonth).toBe("202603");
		expect(body.data.manhour).toBe(300);
	});

	test("存在しないIDで 404 を返す", async () => {
		mockedService.update.mockRejectedValue(
			new HTTPException(404, {
				message: "Project load with ID '999' not found",
			}),
		);

		const res = await app.request(`${BASE_URL}/999`, {
			method: "PUT",
			body: JSON.stringify({ manhour: 100 }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("バリデーションエラーで 422 を返す", async () => {
		const res = await app.request(`${BASE_URL}/1`, {
			method: "PUT",
			body: JSON.stringify({ manhour: -1 }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("年月重複で 409 を返す", async () => {
		mockedService.update.mockRejectedValue(
			new HTTPException(409, {
				message:
					"Project load for year-month '202602' already exists in project case '10'",
			}),
		);

		const res = await app.request(`${BASE_URL}/1`, {
			method: "PUT",
			body: JSON.stringify({ yearMonth: "202602" }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(409);

		const body = await res.json();
		expect(body.type).toContain("conflict");
	});
});

// =============================================================================
// DELETE /project-cases/:projectCaseId/project-loads/:projectLoadId - 物理削除
// =============================================================================
describe("DELETE /project-cases/:projectCaseId/project-loads/:projectLoadId", () => {
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
				message: "Project load with ID '999' not found",
			}),
		);

		const res = await app.request(`${BASE_URL}/999`, {
			method: "DELETE",
		});
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("案件ケースID不一致で 404 を返す", async () => {
		mockedService.delete.mockRejectedValue(
			new HTTPException(404, { message: "Project load with ID '1' not found" }),
		);

		const res = await app.request("/project-cases/20/project-loads/1", {
			method: "DELETE",
		});
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});
});

// =============================================================================
// PUT /project-cases/:projectCaseId/project-loads/bulk - バルク Upsert
// =============================================================================
describe("PUT /project-cases/:projectCaseId/project-loads/bulk", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常バルク Upsert で 200 と data 配列形式を返す", async () => {
		mockedService.bulkUpsert.mockResolvedValue([sampleLoad1, sampleLoad2]);

		const res = await app.request(`${BASE_URL}/bulk`, {
			method: "PUT",
			body: JSON.stringify({
				items: [
					{ yearMonth: "202601", manhour: 100 },
					{ yearMonth: "202602", manhour: 200 },
				],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toHaveLength(2);
		expect(body.data[0]).toMatchObject(sampleLoad1);
		expect(body.data[1]).toMatchObject(sampleLoad2);
	});

	test("新規作成と既存更新の混在を検証する", async () => {
		const load3 = {
			...sampleLoad1,
			projectLoadId: 3,
			yearMonth: "202603",
			manhour: 300,
		};
		mockedService.bulkUpsert.mockResolvedValue([
			sampleLoad1,
			sampleLoad2,
			load3,
		]);

		const res = await app.request(`${BASE_URL}/bulk`, {
			method: "PUT",
			body: JSON.stringify({
				items: [
					{ yearMonth: "202601", manhour: 100 },
					{ yearMonth: "202602", manhour: 200 },
					{ yearMonth: "202603", manhour: 300 },
				],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toHaveLength(3);
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

	test("バリデーションエラー（yearMonth 形式不正）で 422 を返す", async () => {
		const res = await app.request(`${BASE_URL}/bulk`, {
			method: "PUT",
			body: JSON.stringify({
				items: [{ yearMonth: "invalid", manhour: 100 }],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("親ケース不存在で 404 を返す", async () => {
		mockedService.bulkUpsert.mockRejectedValue(
			new HTTPException(404, {
				message: "Project case with ID '999' not found",
			}),
		);

		const res = await app.request("/project-cases/999/project-loads/bulk", {
			method: "PUT",
			body: JSON.stringify({
				items: [{ yearMonth: "202601", manhour: 100 }],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("配列内年月重複で 422 を返す", async () => {
		mockedService.bulkUpsert.mockRejectedValue(
			new HTTPException(422, {
				message: "Duplicate yearMonth values found in items array",
			}),
		);

		const res = await app.request(`${BASE_URL}/bulk`, {
			method: "PUT",
			body: JSON.stringify({
				items: [
					{ yearMonth: "202601", manhour: 100 },
					{ yearMonth: "202601", manhour: 200 },
				],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});
});

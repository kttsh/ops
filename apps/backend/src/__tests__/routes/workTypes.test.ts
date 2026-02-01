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
vi.mock("@/services/workTypeService", () => ({
	workTypeService: {
		findAll: vi.fn(),
		findByCode: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		restore: vi.fn(),
	},
}));

import workTypes from "@/routes/workTypes";
// モックをインポート（vi.mock の後）
import { workTypeService } from "@/services/workTypeService";

const mockedService = vi.mocked(workTypeService);

// テスト用アプリ（グローバルエラーハンドラ付き）
function createApp() {
	const app = new Hono();

	app.route("/work-types", workTypes);

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
const sampleWT = {
	workTypeCode: "WT-001",
	name: "設計作業",
	displayOrder: 1,
	color: "#FF5733",
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
};

const sampleWT2 = {
	workTypeCode: "WT-002",
	name: "レビュー作業",
	displayOrder: 2,
	color: null,
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("GET /work-types", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("一覧を data 配列と meta.pagination で返す", async () => {
		mockedService.findAll.mockResolvedValue({
			items: [sampleWT, sampleWT2],
			totalCount: 2,
		});

		const res = await app.request("/work-types");
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toHaveLength(2);
		expect(body.data[0]).toMatchObject(sampleWT);
		expect(body.meta.pagination).toMatchObject({
			currentPage: 1,
			pageSize: 20,
			totalItems: 2,
			totalPages: 1,
		});
	});

	test("page[number] と page[size] でページネーションする", async () => {
		mockedService.findAll.mockResolvedValue({
			items: [sampleWT2],
			totalCount: 2,
		});

		const res = await app.request("/work-types?page[number]=2&page[size]=1");
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
			includeDisabled: false,
		});
	});

	test("filter[includeDisabled]=true で論理削除済みを含む", async () => {
		mockedService.findAll.mockResolvedValue({
			items: [sampleWT],
			totalCount: 1,
		});

		const res = await app.request("/work-types?filter[includeDisabled]=true");
		expect(res.status).toBe(200);

		expect(mockedService.findAll).toHaveBeenCalledWith({
			page: 1,
			pageSize: 20,
			includeDisabled: true,
		});
	});

	test("不正なクエリパラメータで 422 を返す", async () => {
		const res = await app.request("/work-types?page[number]=-1");
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
		expect(body.status).toBe(422);
		expect(body.errors).toBeDefined();
		expect(body.errors.length).toBeGreaterThan(0);
	});
});

describe("GET /work-types/:workTypeCode", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("指定コードの作業種類を data オブジェクトで返す", async () => {
		mockedService.findByCode.mockResolvedValue(sampleWT);

		const res = await app.request("/work-types/WT-001");
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toMatchObject(sampleWT);
	});

	test("存在しないコードで 404 を返す", async () => {
		mockedService.findByCode.mockRejectedValue(
			new HTTPException(404, {
				message: "Work type with code 'UNKNOWN' not found",
			}),
		);

		const res = await app.request("/work-types/UNKNOWN");
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});
});

describe("POST /work-types", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常作成で 201 と Location ヘッダを返す", async () => {
		mockedService.create.mockResolvedValue(sampleWT);

		const res = await app.request("/work-types", {
			method: "POST",
			body: JSON.stringify({
				workTypeCode: "WT-001",
				name: "設計作業",
				displayOrder: 1,
				color: "#FF5733",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(201);
		expect(res.headers.get("Location")).toBe("/work-types/WT-001");

		const body = await res.json();
		expect(body.data).toMatchObject(sampleWT);
	});

	test("displayOrder 省略時にデフォルト値 0 が使われる", async () => {
		const wtWithDefault = { ...sampleWT, displayOrder: 0 };
		mockedService.create.mockResolvedValue(wtWithDefault);

		const res = await app.request("/work-types", {
			method: "POST",
			body: JSON.stringify({
				workTypeCode: "WT-001",
				name: "設計作業",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(201);

		expect(mockedService.create).toHaveBeenCalledWith({
			workTypeCode: "WT-001",
			name: "設計作業",
			displayOrder: 0,
		});
	});

	test("重複コードで 409 を返す", async () => {
		mockedService.create.mockRejectedValue(
			new HTTPException(409, {
				message: "Work type with code 'WT-001' already exists",
			}),
		);

		const res = await app.request("/work-types", {
			method: "POST",
			body: JSON.stringify({
				workTypeCode: "WT-001",
				name: "設計作業",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(409);

		const body = await res.json();
		expect(body.type).toContain("conflict");
	});

	test("バリデーションエラーで 422 を返す", async () => {
		const res = await app.request("/work-types", {
			method: "POST",
			body: JSON.stringify({
				workTypeCode: "",
				name: "",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
		expect(body.errors).toBeDefined();
		expect(body.errors.length).toBeGreaterThan(0);
	});

	test("workTypeCode が不正文字を含む場合 422 を返す", async () => {
		const res = await app.request("/work-types", {
			method: "POST",
			body: JSON.stringify({
				workTypeCode: "WT 001!",
				name: "設計作業",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.errors).toBeDefined();
	});

	test("color が不正形式の場合 422 を返す", async () => {
		const res = await app.request("/work-types", {
			method: "POST",
			body: JSON.stringify({
				workTypeCode: "WT-001",
				name: "設計作業",
				color: "invalid",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.errors).toBeDefined();
	});
});

describe("PUT /work-types/:workTypeCode", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常更新で 200 を返す", async () => {
		const updatedWT = { ...sampleWT, name: "Updated 設計作業" };
		mockedService.update.mockResolvedValue(updatedWT);

		const res = await app.request("/work-types/WT-001", {
			method: "PUT",
			body: JSON.stringify({
				name: "Updated 設計作業",
				displayOrder: 1,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toMatchObject(updatedWT);
	});

	test("存在しないコードで 404 を返す", async () => {
		mockedService.update.mockRejectedValue(
			new HTTPException(404, {
				message: "Work type with code 'UNKNOWN' not found",
			}),
		);

		const res = await app.request("/work-types/UNKNOWN", {
			method: "PUT",
			body: JSON.stringify({ name: "Test" }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("バリデーションエラーで 422 を返す", async () => {
		const res = await app.request("/work-types/WT-001", {
			method: "PUT",
			body: JSON.stringify({ name: "" }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
		expect(body.errors).toBeDefined();
	});

	test("color に null を指定して更新できる", async () => {
		const updatedWT = { ...sampleWT, color: null };
		mockedService.update.mockResolvedValue(updatedWT);

		const res = await app.request("/work-types/WT-001", {
			method: "PUT",
			body: JSON.stringify({
				name: "設計作業",
				color: null,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(200);

		expect(mockedService.update).toHaveBeenCalledWith("WT-001", {
			name: "設計作業",
			color: null,
		});
	});
});

describe("DELETE /work-types/:workTypeCode", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常削除で 204 No Content を返す", async () => {
		mockedService.delete.mockResolvedValue(undefined);

		const res = await app.request("/work-types/WT-001", {
			method: "DELETE",
		});
		expect(res.status).toBe(204);
	});

	test("存在しないコードで 404 を返す", async () => {
		mockedService.delete.mockRejectedValue(
			new HTTPException(404, {
				message: "Work type with code 'UNKNOWN' not found",
			}),
		);

		const res = await app.request("/work-types/UNKNOWN", {
			method: "DELETE",
		});
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("参照中で 409 を返す", async () => {
		mockedService.delete.mockRejectedValue(
			new HTTPException(409, {
				message:
					"Work type with code 'WT-001' is referenced by other resources and cannot be deleted",
			}),
		);

		const res = await app.request("/work-types/WT-001", {
			method: "DELETE",
		});
		expect(res.status).toBe(409);

		const body = await res.json();
		expect(body.type).toContain("conflict");
	});
});

describe("POST /work-types/:workTypeCode/actions/restore", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常復元で 200 を返す", async () => {
		mockedService.restore.mockResolvedValue(sampleWT);

		const res = await app.request("/work-types/WT-001/actions/restore", {
			method: "POST",
		});
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toMatchObject(sampleWT);
	});

	test("存在しないコードで 404 を返す", async () => {
		mockedService.restore.mockRejectedValue(
			new HTTPException(404, {
				message: "Work type with code 'UNKNOWN' not found",
			}),
		);

		const res = await app.request("/work-types/UNKNOWN/actions/restore", {
			method: "POST",
		});
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("未削除で 409 を返す", async () => {
		mockedService.restore.mockRejectedValue(
			new HTTPException(409, {
				message: "Work type with code 'WT-001' is not soft-deleted",
			}),
		);

		const res = await app.request("/work-types/WT-001/actions/restore", {
			method: "POST",
		});
		expect(res.status).toBe(409);

		const body = await res.json();
		expect(body.type).toContain("conflict");
	});
});

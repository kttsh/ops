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
vi.mock("@/services/standardEffortMasterService", () => ({
	standardEffortMasterService: {
		findAll: vi.fn(),
		findById: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		restore: vi.fn(),
	},
}));

import standardEffortMasters from "@/routes/standardEffortMasters";
import { standardEffortMasterService } from "@/services/standardEffortMasterService";

const mockedService = vi.mocked(standardEffortMasterService);

function createApp() {
	const app = new Hono();

	app.route("/standard-effort-masters", standardEffortMasters);

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
const sampleDetail = {
	standardEffortId: 1,
	businessUnitCode: "BU-001",
	projectTypeCode: "PT-001",
	name: "Sカーブパターン",
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
	weights: [
		{ standardEffortWeightId: 1, progressRate: 0, weight: 0 },
		{ standardEffortWeightId: 2, progressRate: 50, weight: 10 },
		{ standardEffortWeightId: 3, progressRate: 100, weight: 0 },
	],
};

const sampleSummary = {
	standardEffortId: 1,
	businessUnitCode: "BU-001",
	projectTypeCode: "PT-001",
	name: "Sカーブパターン",
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
};

const sampleSummary2 = {
	...sampleSummary,
	standardEffortId: 2,
	name: "バスタブカーブパターン",
};

describe("GET /standard-effort-masters", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("一覧を data 配列と meta.pagination で返す", async () => {
		mockedService.findAll.mockResolvedValue({
			items: [sampleSummary, sampleSummary2],
			totalCount: 2,
		});

		const res = await app.request("/standard-effort-masters");
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toHaveLength(2);
		expect(body.data[0]).toMatchObject(sampleSummary);
		expect(body.meta.pagination).toMatchObject({
			currentPage: 1,
			pageSize: 20,
			totalItems: 2,
			totalPages: 1,
		});
	});

	test("page[number] と page[size] でページネーションする", async () => {
		mockedService.findAll.mockResolvedValue({
			items: [sampleSummary2],
			totalCount: 2,
		});

		const res = await app.request(
			"/standard-effort-masters?page[number]=2&page[size]=1",
		);
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
			businessUnitCode: undefined,
			projectTypeCode: undefined,
		});
	});

	test("filter[includeDisabled]=true で論理削除済みを含む", async () => {
		mockedService.findAll.mockResolvedValue({
			items: [sampleSummary],
			totalCount: 1,
		});

		const res = await app.request(
			"/standard-effort-masters?filter[includeDisabled]=true",
		);
		expect(res.status).toBe(200);

		expect(mockedService.findAll).toHaveBeenCalledWith(
			expect.objectContaining({ includeDisabled: true }),
		);
	});

	test("filter[businessUnitCode] でフィルタリングする", async () => {
		mockedService.findAll.mockResolvedValue({
			items: [sampleSummary],
			totalCount: 1,
		});

		const res = await app.request(
			"/standard-effort-masters?filter[businessUnitCode]=BU-001",
		);
		expect(res.status).toBe(200);

		expect(mockedService.findAll).toHaveBeenCalledWith(
			expect.objectContaining({ businessUnitCode: "BU-001" }),
		);
	});

	test("filter[projectTypeCode] でフィルタリングする", async () => {
		mockedService.findAll.mockResolvedValue({
			items: [sampleSummary],
			totalCount: 1,
		});

		const res = await app.request(
			"/standard-effort-masters?filter[projectTypeCode]=PT-001",
		);
		expect(res.status).toBe(200);

		expect(mockedService.findAll).toHaveBeenCalledWith(
			expect.objectContaining({ projectTypeCode: "PT-001" }),
		);
	});

	test("空リストの場合も正しく返す", async () => {
		mockedService.findAll.mockResolvedValue({
			items: [],
			totalCount: 0,
		});

		const res = await app.request("/standard-effort-masters");
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toHaveLength(0);
		expect(body.meta.pagination.totalItems).toBe(0);
	});

	test("不正なクエリパラメータで 422 を返す", async () => {
		const res = await app.request("/standard-effort-masters?page[number]=-1");
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
		expect(body.status).toBe(422);
		expect(body.errors).toBeDefined();
		expect(body.errors.length).toBeGreaterThan(0);
	});
});

describe("GET /standard-effort-masters/:id", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("指定 ID のマスタを weights 付きで返す", async () => {
		mockedService.findById.mockResolvedValue(sampleDetail);

		const res = await app.request("/standard-effort-masters/1");
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toMatchObject(sampleDetail);
		expect(body.data.weights).toHaveLength(3);
	});

	test("存在しない ID で 404 を返す", async () => {
		mockedService.findById.mockRejectedValue(
			new HTTPException(404, {
				message: "Standard effort master with ID '999' not found",
			}),
		);

		const res = await app.request("/standard-effort-masters/999");
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("不正な ID パラメータで 422 を返す", async () => {
		const res = await app.request("/standard-effort-masters/abc");
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});
});

describe("POST /standard-effort-masters", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常作成で 201 と Location ヘッダを返す", async () => {
		mockedService.create.mockResolvedValue(sampleDetail);

		const res = await app.request("/standard-effort-masters", {
			method: "POST",
			body: JSON.stringify({
				businessUnitCode: "BU-001",
				projectTypeCode: "PT-001",
				name: "Sカーブパターン",
				weights: [
					{ progressRate: 0, weight: 0 },
					{ progressRate: 50, weight: 10 },
					{ progressRate: 100, weight: 0 },
				],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(201);
		expect(res.headers.get("Location")).toBe("/standard-effort-masters/1");

		const body = await res.json();
		expect(body.data).toMatchObject(sampleDetail);
		expect(body.data.weights).toHaveLength(3);
	});

	test("weights なしでも作成できる", async () => {
		const detailNoWeights = { ...sampleDetail, weights: [] };
		mockedService.create.mockResolvedValue(detailNoWeights);

		const res = await app.request("/standard-effort-masters", {
			method: "POST",
			body: JSON.stringify({
				businessUnitCode: "BU-001",
				projectTypeCode: "PT-001",
				name: "Sカーブパターン",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(201);

		const body = await res.json();
		expect(body.data.weights).toHaveLength(0);
	});

	test("複合ユニークキー重複で 409 を返す", async () => {
		mockedService.create.mockRejectedValue(
			new HTTPException(409, {
				message:
					"Standard effort master with name 'Sカーブパターン' already exists for business unit 'BU-001' and project type 'PT-001'",
			}),
		);

		const res = await app.request("/standard-effort-masters", {
			method: "POST",
			body: JSON.stringify({
				businessUnitCode: "BU-001",
				projectTypeCode: "PT-001",
				name: "Sカーブパターン",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(409);

		const body = await res.json();
		expect(body.type).toContain("conflict");
	});

	test("バリデーションエラーで 422 を返す（必須項目欠落）", async () => {
		const res = await app.request("/standard-effort-masters", {
			method: "POST",
			body: JSON.stringify({
				name: "テスト",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
		expect(body.errors).toBeDefined();
		expect(body.errors.length).toBeGreaterThan(0);
	});

	test("バリデーションエラーで 422 を返す（不正な businessUnitCode）", async () => {
		const res = await app.request("/standard-effort-masters", {
			method: "POST",
			body: JSON.stringify({
				businessUnitCode: "BU 001",
				projectTypeCode: "PT-001",
				name: "テスト",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("BU 存在しない場合の 422 を返す", async () => {
		mockedService.create.mockRejectedValue(
			new HTTPException(422, {
				message: "Business unit with code 'UNKNOWN' not found",
			}),
		);

		const res = await app.request("/standard-effort-masters", {
			method: "POST",
			body: JSON.stringify({
				businessUnitCode: "UNKNOWN",
				projectTypeCode: "PT-001",
				name: "テスト",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("weights 内の不正値で 422 を返す", async () => {
		const res = await app.request("/standard-effort-masters", {
			method: "POST",
			body: JSON.stringify({
				businessUnitCode: "BU-001",
				projectTypeCode: "PT-001",
				name: "テスト",
				weights: [{ progressRate: 200, weight: -1 }],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});
});

describe("PUT /standard-effort-masters/:id", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常更新で 200 を返す（name のみ）", async () => {
		const updatedDetail = { ...sampleDetail, name: "更新後パターン" };
		mockedService.update.mockResolvedValue(updatedDetail);

		const res = await app.request("/standard-effort-masters/1", {
			method: "PUT",
			body: JSON.stringify({ name: "更新後パターン" }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data.name).toBe("更新後パターン");
	});

	test("正常更新で 200 を返す（weights 全置換）", async () => {
		const updatedDetail = {
			...sampleDetail,
			weights: [
				{ standardEffortWeightId: 10, progressRate: 0, weight: 5 },
				{ standardEffortWeightId: 11, progressRate: 100, weight: 5 },
			],
		};
		mockedService.update.mockResolvedValue(updatedDetail);

		const res = await app.request("/standard-effort-masters/1", {
			method: "PUT",
			body: JSON.stringify({
				weights: [
					{ progressRate: 0, weight: 5 },
					{ progressRate: 100, weight: 5 },
				],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data.weights).toHaveLength(2);
	});

	test("存在しない ID で 404 を返す", async () => {
		mockedService.update.mockRejectedValue(
			new HTTPException(404, {
				message: "Standard effort master with ID '999' not found",
			}),
		);

		const res = await app.request("/standard-effort-masters/999", {
			method: "PUT",
			body: JSON.stringify({ name: "テスト" }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("名称重複で 409 を返す", async () => {
		mockedService.update.mockRejectedValue(
			new HTTPException(409, {
				message:
					"Standard effort master with name '重複名' already exists for business unit 'BU-001' and project type 'PT-001'",
			}),
		);

		const res = await app.request("/standard-effort-masters/1", {
			method: "PUT",
			body: JSON.stringify({ name: "重複名" }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(409);

		const body = await res.json();
		expect(body.type).toContain("conflict");
	});

	test("バリデーションエラーで 422 を返す（name が空文字）", async () => {
		const res = await app.request("/standard-effort-masters/1", {
			method: "PUT",
			body: JSON.stringify({ name: "" }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("weights 内の不正値で 422 を返す", async () => {
		const res = await app.request("/standard-effort-masters/1", {
			method: "PUT",
			body: JSON.stringify({
				weights: [{ progressRate: -1, weight: 0 }],
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});
});

describe("DELETE /standard-effort-masters/:id", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常削除で 204 No Content を返す", async () => {
		mockedService.delete.mockResolvedValue(undefined);

		const res = await app.request("/standard-effort-masters/1", {
			method: "DELETE",
		});
		expect(res.status).toBe(204);
	});

	test("存在しない ID で 404 を返す", async () => {
		mockedService.delete.mockRejectedValue(
			new HTTPException(404, {
				message: "Standard effort master with ID '999' not found",
			}),
		);

		const res = await app.request("/standard-effort-masters/999", {
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
					"Standard effort master with ID '1' is referenced by other resources and cannot be deleted",
			}),
		);

		const res = await app.request("/standard-effort-masters/1", {
			method: "DELETE",
		});
		expect(res.status).toBe(409);

		const body = await res.json();
		expect(body.type).toContain("conflict");
	});
});

describe("POST /standard-effort-masters/:id/actions/restore", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常復元で 200 を返す", async () => {
		mockedService.restore.mockResolvedValue(sampleDetail);

		const res = await app.request(
			"/standard-effort-masters/1/actions/restore",
			{
				method: "POST",
			},
		);
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toMatchObject(sampleDetail);
	});

	test("存在しない ID で 404 を返す", async () => {
		mockedService.restore.mockRejectedValue(
			new HTTPException(404, {
				message: "Standard effort master with ID '999' not found",
			}),
		);

		const res = await app.request(
			"/standard-effort-masters/999/actions/restore",
			{
				method: "POST",
			},
		);
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("複合ユニークキー重複で 409 を返す", async () => {
		mockedService.restore.mockRejectedValue(
			new HTTPException(409, {
				message:
					"Standard effort master with name 'Sカーブパターン' already exists for business unit 'BU-001' and project type 'PT-001'",
			}),
		);

		const res = await app.request(
			"/standard-effort-masters/1/actions/restore",
			{
				method: "POST",
			},
		);
		expect(res.status).toBe(409);

		const body = await res.json();
		expect(body.type).toContain("conflict");
	});
});

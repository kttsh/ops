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
vi.mock("@/services/projectCaseService", () => ({
	projectCaseService: {
		findAll: vi.fn(),
		findById: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		restore: vi.fn(),
	},
}));

import projectCases from "@/routes/projectCases";
// モックをインポート（vi.mock の後）
import { projectCaseService } from "@/services/projectCaseService";

const mockedService = vi.mocked(projectCaseService);

// テスト用アプリ（グローバルエラーハンドラ付き）
function createApp() {
	const app = new Hono();

	app.route("/projects/:projectId/project-cases", projectCases);

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
const sampleCase = {
	projectCaseId: 1,
	projectId: 10,
	caseName: "標準ケース",
	isPrimary: true,
	description: "標準的な工数見積もり",
	calculationType: "MANUAL",
	standardEffortId: null,
	startYearMonth: "202601",
	durationMonths: 12,
	totalManhour: 1000,
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
	projectName: "テスト案件",
	standardEffortName: null,
};

const sampleCase2 = {
	projectCaseId: 2,
	projectId: 10,
	caseName: "楽観ケース",
	isPrimary: false,
	description: "楽観的な工数見積もり",
	calculationType: "STANDARD",
	standardEffortId: 5,
	startYearMonth: "202601",
	durationMonths: 10,
	totalManhour: 800,
	createdAt: "2026-01-02T00:00:00.000Z",
	updatedAt: "2026-01-02T00:00:00.000Z",
	projectName: "テスト案件",
	standardEffortName: "Webアプリ標準",
};

const BASE_URL = "/projects/10/project-cases";

// =============================================================================
// GET /projects/:projectId/project-cases - 一覧取得
// =============================================================================
describe("GET /projects/:projectId/project-cases", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("一覧を data 配列と meta.pagination で返す", async () => {
		mockedService.findAll.mockResolvedValue({
			items: [sampleCase, sampleCase2],
			totalCount: 2,
		});

		const res = await app.request(BASE_URL);
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toHaveLength(2);
		expect(body.data[0]).toMatchObject(sampleCase);
		expect(body.data[1]).toMatchObject(sampleCase2);
		expect(body.meta.pagination).toMatchObject({
			currentPage: 1,
			pageSize: 20,
			totalItems: 2,
			totalPages: 1,
		});
	});

	test("JOIN 名称（projectName, standardEffortName）がレスポンスに含まれる", async () => {
		mockedService.findAll.mockResolvedValue({
			items: [sampleCase2],
			totalCount: 1,
		});

		const res = await app.request(BASE_URL);
		const body = await res.json();
		expect(body.data[0].projectName).toBe("テスト案件");
		expect(body.data[0].standardEffortName).toBe("Webアプリ標準");
	});

	test("page[number] と page[size] でページネーションする", async () => {
		mockedService.findAll.mockResolvedValue({
			items: [sampleCase2],
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
			projectId: 10,
			page: 2,
			pageSize: 1,
			includeDisabled: false,
		});
	});

	test("filter[includeDisabled]=true で論理削除済みを含む", async () => {
		mockedService.findAll.mockResolvedValue({
			items: [sampleCase],
			totalCount: 1,
		});

		const res = await app.request(`${BASE_URL}?filter[includeDisabled]=true`);
		expect(res.status).toBe(200);

		expect(mockedService.findAll).toHaveBeenCalledWith({
			projectId: 10,
			page: 1,
			pageSize: 20,
			includeDisabled: true,
		});
	});

	test("存在しない projectId で 404 を返す", async () => {
		mockedService.findAll.mockRejectedValue(
			new HTTPException(404, { message: "Project with ID '999' not found" }),
		);

		const res = await app.request("/projects/999/project-cases");
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("不正なクエリパラメータで 422 を返す", async () => {
		const res = await app.request(`${BASE_URL}?page[number]=-1`);
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
		expect(body.errors).toBeDefined();
	});
});

// =============================================================================
// GET /projects/:projectId/project-cases/:projectCaseId - 単一取得
// =============================================================================
describe("GET /projects/:projectId/project-cases/:projectCaseId", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("指定IDの案件ケースを data オブジェクトで返す", async () => {
		mockedService.findById.mockResolvedValue(sampleCase);

		const res = await app.request(`${BASE_URL}/1`);
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toMatchObject(sampleCase);
		expect(body.data.projectName).toBe("テスト案件");
	});

	test("存在しないケースIDで 404 を返す", async () => {
		mockedService.findById.mockRejectedValue(
			new HTTPException(404, {
				message: "Project case with ID '999' not found",
			}),
		);

		const res = await app.request(`${BASE_URL}/999`);
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("projectId 不一致で 404 を返す", async () => {
		mockedService.findById.mockRejectedValue(
			new HTTPException(404, { message: "Project case with ID '1' not found" }),
		);

		const res = await app.request("/projects/20/project-cases/1");
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
// POST /projects/:projectId/project-cases - 新規作成
// =============================================================================
describe("POST /projects/:projectId/project-cases", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常作成で 201 と Location ヘッダを返す", async () => {
		mockedService.create.mockResolvedValue(sampleCase);

		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				caseName: "標準ケース",
				isPrimary: true,
				description: "標準的な工数見積もり",
				startYearMonth: "202601",
				durationMonths: 12,
				totalManhour: 1000,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(201);
		expect(res.headers.get("Location")).toBe("/projects/10/project-cases/1");

		const body = await res.json();
		expect(body.data).toMatchObject(sampleCase);
	});

	test("デフォルト値（isPrimary=false, calculationType=MANUAL）が適用される", async () => {
		mockedService.create.mockResolvedValue(sampleCase);

		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				caseName: "標準ケース",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(201);

		expect(mockedService.create).toHaveBeenCalledWith(10, {
			caseName: "標準ケース",
			isPrimary: false,
			calculationType: "MANUAL",
		});
	});

	test("バリデーションエラーで 422 を返す", async () => {
		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				caseName: "",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
		expect(body.errors).toBeDefined();
	});

	test("存在しない projectId で 404 を返す", async () => {
		mockedService.create.mockRejectedValue(
			new HTTPException(404, { message: "Project with ID '999' not found" }),
		);

		const res = await app.request("/projects/999/project-cases", {
			method: "POST",
			body: JSON.stringify({ caseName: "テスト" }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("STANDARD + standardEffortId 未指定で 422 を返す", async () => {
		mockedService.create.mockRejectedValue(
			new HTTPException(422, {
				message:
					"standardEffortId is required when calculationType is STANDARD",
			}),
		);

		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				caseName: "テスト",
				calculationType: "STANDARD",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("存在しない standardEffortId で 422 を返す", async () => {
		mockedService.create.mockRejectedValue(
			new HTTPException(422, {
				message: "Standard effort with ID '999' not found",
			}),
		);

		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				caseName: "テスト",
				calculationType: "STANDARD",
				standardEffortId: 999,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("startYearMonth の形式不正で 422 を返す", async () => {
		const res = await app.request(BASE_URL, {
			method: "POST",
			body: JSON.stringify({
				caseName: "テスト",
				startYearMonth: "2026-01",
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});
});

// =============================================================================
// PUT /projects/:projectId/project-cases/:projectCaseId - 更新
// =============================================================================
describe("PUT /projects/:projectId/project-cases/:projectCaseId", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常更新で 200 を返す", async () => {
		const updatedCase = { ...sampleCase, caseName: "更新ケース" };
		mockedService.update.mockResolvedValue(updatedCase);

		const res = await app.request(`${BASE_URL}/1`, {
			method: "PUT",
			body: JSON.stringify({ caseName: "更新ケース" }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data.caseName).toBe("更新ケース");
	});

	test("更新されたフィールドの反映を検証する", async () => {
		const updatedCase = {
			...sampleCase,
			description: "更新された説明",
			durationMonths: 24,
		};
		mockedService.update.mockResolvedValue(updatedCase);

		const res = await app.request(`${BASE_URL}/1`, {
			method: "PUT",
			body: JSON.stringify({
				description: "更新された説明",
				durationMonths: 24,
			}),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data.description).toBe("更新された説明");
		expect(body.data.durationMonths).toBe(24);
	});

	test("存在しないケースで 404 を返す", async () => {
		mockedService.update.mockRejectedValue(
			new HTTPException(404, {
				message: "Project case with ID '999' not found",
			}),
		);

		const res = await app.request(`${BASE_URL}/999`, {
			method: "PUT",
			body: JSON.stringify({ caseName: "テスト" }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("バリデーションエラーで 422 を返す", async () => {
		const res = await app.request(`${BASE_URL}/1`, {
			method: "PUT",
			body: JSON.stringify({ caseName: "" }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});

	test("STANDARD 変更時の整合性エラーで 422 を返す", async () => {
		mockedService.update.mockRejectedValue(
			new HTTPException(422, {
				message:
					"standardEffortId is required when calculationType is STANDARD",
			}),
		);

		const res = await app.request(`${BASE_URL}/1`, {
			method: "PUT",
			body: JSON.stringify({ calculationType: "STANDARD" }),
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.type).toContain("validation-error");
	});
});

// =============================================================================
// DELETE /projects/:projectId/project-cases/:projectCaseId - 論理削除
// =============================================================================
describe("DELETE /projects/:projectId/project-cases/:projectCaseId", () => {
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

	test("存在しないケースで 404 を返す", async () => {
		mockedService.delete.mockRejectedValue(
			new HTTPException(404, {
				message: "Project case with ID '999' not found",
			}),
		);

		const res = await app.request(`${BASE_URL}/999`, {
			method: "DELETE",
		});
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("参照ありで 409 を返す", async () => {
		mockedService.delete.mockRejectedValue(
			new HTTPException(409, {
				message:
					"Project case with ID '1' is referenced by other resources and cannot be deleted",
			}),
		);

		const res = await app.request(`${BASE_URL}/1`, {
			method: "DELETE",
		});
		expect(res.status).toBe(409);

		const body = await res.json();
		expect(body.type).toContain("conflict");
	});
});

// =============================================================================
// POST /projects/:projectId/project-cases/:projectCaseId/actions/restore - 復元
// =============================================================================
describe("POST /projects/:projectId/project-cases/:projectCaseId/actions/restore", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = createApp();
	});

	test("正常復元で 200 を返す", async () => {
		mockedService.restore.mockResolvedValue(sampleCase);

		const res = await app.request(`${BASE_URL}/1/actions/restore`, {
			method: "POST",
		});
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.data).toMatchObject(sampleCase);
	});

	test("存在しないケースで 404 を返す", async () => {
		mockedService.restore.mockRejectedValue(
			new HTTPException(404, {
				message: "Project case with ID '999' not found",
			}),
		);

		const res = await app.request(`${BASE_URL}/999/actions/restore`, {
			method: "POST",
		});
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.type).toContain("resource-not-found");
	});

	test("未削除ケースの復元で 409 を返す", async () => {
		mockedService.restore.mockRejectedValue(
			new HTTPException(409, {
				message: "Project case with ID '1' is not soft-deleted",
			}),
		);

		const res = await app.request(`${BASE_URL}/1/actions/restore`, {
			method: "POST",
		});
		expect(res.status).toBe(409);

		const body = await res.json();
		expect(body.type).toContain("conflict");
	});
});

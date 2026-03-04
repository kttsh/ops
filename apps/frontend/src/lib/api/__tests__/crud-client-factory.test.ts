import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock API_BASE_URL before importing
vi.mock("../client", async () => {
	const actual = await vi.importActual<typeof import("../client")>("../client");
	return {
		...actual,
		API_BASE_URL: "http://test-api",
	};
});

import { createCrudClient } from "../crud-client-factory";

// --- 型定義（テスト用） ---

type TestEntity = {
	code: string;
	name: string;
	deletedAt?: string | null;
};

type CreateTestInput = {
	code: string;
	name: string;
};

type UpdateTestInput = {
	name: string;
};

type TestListParams = {
	includeDisabled: boolean;
};

type PaginatedListParams = {
	page: number;
	pageSize: number;
	includeDisabled: boolean;
};

type NumericEntity = {
	id: number;
	name: string;
};

describe("createCrudClient", () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		mockFetch.mockClear();
		vi.stubGlobal("fetch", mockFetch);
		mockFetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: () => Promise.resolve({ data: [] }),
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("設定から6つの関数を持つクライアントオブジェクトを返す", () => {
		const client = createCrudClient<
			TestEntity,
			CreateTestInput,
			UpdateTestInput,
			string,
			TestListParams
		>({
			resourcePath: "work-types",
		});

		expect(client).toHaveProperty("fetchList");
		expect(client).toHaveProperty("fetchDetail");
		expect(client).toHaveProperty("create");
		expect(client).toHaveProperty("update");
		expect(client).toHaveProperty("delete");
		expect(client).toHaveProperty("restore");
		expect(typeof client.fetchList).toBe("function");
		expect(typeof client.fetchDetail).toBe("function");
		expect(typeof client.create).toBe("function");
		expect(typeof client.update).toBe("function");
		expect(typeof client.delete).toBe("function");
		expect(typeof client.restore).toBe("function");
	});

	describe("fetchList（ページネーションなし）", () => {
		it("includeDisabled=false の場合、クエリパラメータなしで GET リクエストを送信する", async () => {
			const client = createCrudClient<
				TestEntity,
				CreateTestInput,
				UpdateTestInput,
				string,
				TestListParams
			>({
				resourcePath: "work-types",
			});

			await client.fetchList({ includeDisabled: false });

			expect(mockFetch).toHaveBeenCalledWith("http://test-api/work-types");
		});

		it("includeDisabled=true の場合、filter[includeDisabled]=true を付与する", async () => {
			const client = createCrudClient<
				TestEntity,
				CreateTestInput,
				UpdateTestInput,
				string,
				TestListParams
			>({
				resourcePath: "work-types",
			});

			await client.fetchList({ includeDisabled: true });

			const url = mockFetch.mock.calls[0][0] as string;
			expect(url).toContain("filter%5BincludeDisabled%5D=true");
		});
	});

	describe("fetchList（ページネーションあり）", () => {
		it("page, pageSize, includeDisabled パラメータを正しく付与する", async () => {
			const client = createCrudClient<
				TestEntity,
				CreateTestInput,
				UpdateTestInput,
				string,
				PaginatedListParams
			>({
				resourcePath: "business-units",
				paginated: true,
			});

			await client.fetchList({ page: 2, pageSize: 20, includeDisabled: false });

			const url = mockFetch.mock.calls[0][0] as string;
			expect(url).toContain("page%5Bnumber%5D=2");
			expect(url).toContain("page%5Bsize%5D=20");
			expect(url).not.toContain("includeDisabled");
		});

		it("ページネーション + includeDisabled=true の場合、両方のパラメータを付与する", async () => {
			const client = createCrudClient<
				TestEntity,
				CreateTestInput,
				UpdateTestInput,
				string,
				PaginatedListParams
			>({
				resourcePath: "business-units",
				paginated: true,
			});

			await client.fetchList({ page: 1, pageSize: 10, includeDisabled: true });

			const url = mockFetch.mock.calls[0][0] as string;
			expect(url).toContain("page%5Bnumber%5D=1");
			expect(url).toContain("page%5Bsize%5D=10");
			expect(url).toContain("filter%5BincludeDisabled%5D=true");
		});
	});

	describe("fetchDetail", () => {
		it("string ID を encodeURIComponent でエンコードして GET リクエストを送信する", async () => {
			const client = createCrudClient<
				TestEntity,
				CreateTestInput,
				UpdateTestInput,
				string,
				TestListParams
			>({
				resourcePath: "work-types",
			});

			await client.fetchDetail("test-code");

			expect(mockFetch).toHaveBeenCalledWith(
				"http://test-api/work-types/test-code",
			);
		});

		it("number ID で正しい URL を生成する", async () => {
			const client = createCrudClient<
				NumericEntity,
				{ name: string },
				{ name: string },
				number,
				PaginatedListParams
			>({
				resourcePath: "projects",
				paginated: true,
			});

			await client.fetchDetail(42);

			expect(mockFetch).toHaveBeenCalledWith("http://test-api/projects/42");
		});
	});

	describe("create", () => {
		it("POST リクエストを Content-Type: application/json ヘッダー付きで送信する", async () => {
			const client = createCrudClient<
				TestEntity,
				CreateTestInput,
				UpdateTestInput,
				string,
				TestListParams
			>({
				resourcePath: "work-types",
			});

			const input: CreateTestInput = { code: "WT-01", name: "テスト" };
			await client.create(input);

			expect(mockFetch).toHaveBeenCalledWith("http://test-api/work-types", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			});
		});
	});

	describe("update", () => {
		it("PUT リクエストを Content-Type: application/json ヘッダー付きで送信する", async () => {
			const client = createCrudClient<
				TestEntity,
				CreateTestInput,
				UpdateTestInput,
				string,
				TestListParams
			>({
				resourcePath: "work-types",
			});

			const input: UpdateTestInput = { name: "更新後" };
			await client.update("WT-01", input);

			expect(mockFetch).toHaveBeenCalledWith(
				"http://test-api/work-types/WT-01",
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(input),
				},
			);
		});

		it("number ID の場合も正しい URL を生成する", async () => {
			const client = createCrudClient<
				NumericEntity,
				{ name: string },
				{ name: string },
				number,
				PaginatedListParams
			>({
				resourcePath: "projects",
				paginated: true,
			});

			await client.update(42, { name: "更新後" });

			expect(mockFetch).toHaveBeenCalledWith("http://test-api/projects/42", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: "更新後" }),
			});
		});
	});

	describe("delete", () => {
		it("DELETE リクエストを送信する", async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				status: 204,
				json: () => Promise.resolve(undefined),
			});

			const client = createCrudClient<
				TestEntity,
				CreateTestInput,
				UpdateTestInput,
				string,
				TestListParams
			>({
				resourcePath: "work-types",
			});

			await client.delete("WT-01");

			expect(mockFetch).toHaveBeenCalledWith(
				"http://test-api/work-types/WT-01",
				{
					method: "DELETE",
				},
			);
		});
	});

	describe("restore", () => {
		it("POST リクエストを /actions/restore エンドポイントに送信する", async () => {
			const client = createCrudClient<
				TestEntity,
				CreateTestInput,
				UpdateTestInput,
				string,
				TestListParams
			>({
				resourcePath: "work-types",
			});

			await client.restore("WT-01");

			expect(mockFetch).toHaveBeenCalledWith(
				"http://test-api/work-types/WT-01/actions/restore",
				{ method: "POST" },
			);
		});

		it("number ID の場合も正しい URL を生成する", async () => {
			const client = createCrudClient<
				NumericEntity,
				{ name: string },
				{ name: string },
				number,
				PaginatedListParams
			>({
				resourcePath: "projects",
				paginated: true,
			});

			await client.restore(42);

			expect(mockFetch).toHaveBeenCalledWith(
				"http://test-api/projects/42/actions/restore",
				{ method: "POST" },
			);
		});
	});
});

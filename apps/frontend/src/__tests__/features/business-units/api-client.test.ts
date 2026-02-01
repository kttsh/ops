import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	ApiError,
	createBusinessUnit,
	deleteBusinessUnit,
	fetchBusinessUnit,
	fetchBusinessUnits,
	restoreBusinessUnit,
	updateBusinessUnit,
} from "@/features/business-units/api/api-client";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

beforeEach(() => {
	mockFetch.mockReset();
});

describe("fetchBusinessUnits", () => {
	it("正常にビジネスユニット一覧を取得する", async () => {
		const mockData = {
			data: [
				{
					businessUnitCode: "BU-001",
					name: "テスト",
					displayOrder: 0,
					createdAt: "2024-01-01",
					updatedAt: "2024-01-01",
				},
			],
			meta: {
				pagination: {
					currentPage: 1,
					pageSize: 20,
					totalItems: 1,
					totalPages: 1,
				},
			},
		};
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => mockData,
		});

		const result = await fetchBusinessUnits({
			page: 1,
			pageSize: 20,
			includeDisabled: false,
		});
		expect(result).toEqual(mockData);
		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("/business-units?"),
		);
	});

	it("includeDisabledパラメータを送信する", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ data: [], meta: { pagination: {} } }),
		});

		await fetchBusinessUnits({ page: 1, pageSize: 20, includeDisabled: true });
		const url = mockFetch.mock.calls[0][0] as string;
		expect(url).toContain("filter%5BincludeDisabled%5D=true");
	});

	it("エラーレスポンスでApiErrorをthrowする", async () => {
		const problemDetails = {
			type: "about:blank",
			status: 422,
			title: "Validation Error",
			detail: "バリデーションエラー",
		};
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 422,
			json: async () => problemDetails,
		});

		await expect(
			fetchBusinessUnits({ page: 1, pageSize: 20, includeDisabled: false }),
		).rejects.toThrow(ApiError);
	});
});

describe("fetchBusinessUnit", () => {
	it("正常に単一のビジネスユニットを取得する", async () => {
		const mockData = {
			data: {
				businessUnitCode: "BU-001",
				name: "テスト",
				displayOrder: 0,
				createdAt: "2024-01-01",
				updatedAt: "2024-01-01",
			},
		};
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => mockData,
		});

		const result = await fetchBusinessUnit("BU-001");
		expect(result).toEqual(mockData);
		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("/business-units/BU-001"),
		);
	});

	it("404エラーでApiErrorをthrowする", async () => {
		const problemDetails = {
			type: "about:blank",
			status: 404,
			title: "Not Found",
			detail: "ビジネスユニットが見つかりません",
		};
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 404,
			json: async () => problemDetails,
		});

		try {
			await fetchBusinessUnit("NONEXISTENT");
		} catch (err) {
			expect(err).toBeInstanceOf(ApiError);
			expect((err as ApiError).problemDetails.status).toBe(404);
		}
	});
});

describe("createBusinessUnit", () => {
	it("正常にビジネスユニットを作成する", async () => {
		const mockData = {
			data: {
				businessUnitCode: "BU-NEW",
				name: "新規",
				displayOrder: 0,
				createdAt: "2024-01-01",
				updatedAt: "2024-01-01",
			},
		};
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 201,
			json: async () => mockData,
		});

		const result = await createBusinessUnit({
			businessUnitCode: "BU-NEW",
			name: "新規",
			displayOrder: 0,
		});
		expect(result).toEqual(mockData);
		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("/business-units"),
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
			}),
		);
	});

	it("409 ConflictでApiErrorをthrowする", async () => {
		const problemDetails = {
			type: "about:blank",
			status: 409,
			title: "Conflict",
			detail: "同一コードが存在します",
		};
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 409,
			json: async () => problemDetails,
		});

		try {
			await createBusinessUnit({
				businessUnitCode: "BU-EXISTING",
				name: "重複",
				displayOrder: 0,
			});
		} catch (err) {
			expect(err).toBeInstanceOf(ApiError);
			expect((err as ApiError).problemDetails.status).toBe(409);
		}
	});
});

describe("updateBusinessUnit", () => {
	it("正常にビジネスユニットを更新する", async () => {
		const mockData = {
			data: {
				businessUnitCode: "BU-001",
				name: "更新済み",
				displayOrder: 5,
				createdAt: "2024-01-01",
				updatedAt: "2024-01-02",
			},
		};
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => mockData,
		});

		const result = await updateBusinessUnit("BU-001", {
			name: "更新済み",
			displayOrder: 5,
		});
		expect(result).toEqual(mockData);
		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("/business-units/BU-001"),
			expect.objectContaining({ method: "PUT" }),
		);
	});
});

describe("deleteBusinessUnit", () => {
	it("正常にビジネスユニットを削除する", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 204,
		});

		await expect(deleteBusinessUnit("BU-001")).resolves.toBeUndefined();
		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("/business-units/BU-001"),
			expect.objectContaining({ method: "DELETE" }),
		);
	});
});

describe("restoreBusinessUnit", () => {
	it("正常にビジネスユニットを復元する", async () => {
		const mockData = {
			data: {
				businessUnitCode: "BU-001",
				name: "テスト",
				displayOrder: 0,
				createdAt: "2024-01-01",
				updatedAt: "2024-01-03",
			},
		};
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => mockData,
		});

		const result = await restoreBusinessUnit("BU-001");
		expect(result).toEqual(mockData);
		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("/business-units/BU-001/actions/restore"),
			expect.objectContaining({ method: "POST" }),
		);
	});
});

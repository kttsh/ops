import { describe, expect, test } from "vitest";
import { Hono } from "hono";
import {
	buildPaginatedResponse,
	setLocationHeader,
} from "@/utils/responseHelper";

describe("buildPaginatedResponse", () => {
	test("正しい JSON 構造を返す", () => {
		const result = buildPaginatedResponse(
			{ items: [{ id: 1 }, { id: 2 }], totalCount: 50 },
			{ page: 1, pageSize: 20 },
		);
		expect(result).toEqual({
			data: [{ id: 1 }, { id: 2 }],
			meta: {
				pagination: {
					currentPage: 1,
					pageSize: 20,
					totalItems: 50,
					totalPages: 3,
				},
			},
		});
	});

	test("totalPages が Math.ceil(totalCount / pageSize) で算出される", () => {
		const result = buildPaginatedResponse(
			{ items: [], totalCount: 21 },
			{ page: 1, pageSize: 10 },
		);
		expect(result.meta.pagination.totalPages).toBe(3);
	});

	test("totalCount が pageSize で割り切れる場合の totalPages", () => {
		const result = buildPaginatedResponse(
			{ items: [], totalCount: 40 },
			{ page: 1, pageSize: 20 },
		);
		expect(result.meta.pagination.totalPages).toBe(2);
	});

	test("空配列（0 件）で totalPages: 0 を返す", () => {
		const result = buildPaginatedResponse(
			{ items: [], totalCount: 0 },
			{ page: 1, pageSize: 20 },
		);
		expect(result).toEqual({
			data: [],
			meta: {
				pagination: {
					currentPage: 1,
					pageSize: 20,
					totalItems: 0,
					totalPages: 0,
				},
			},
		});
	});

	test("data が items と同一参照である", () => {
		const items = [{ id: 1 }];
		const result = buildPaginatedResponse(
			{ items, totalCount: 1 },
			{ page: 1, pageSize: 20 },
		);
		expect(result.data).toBe(items);
	});
});

describe("setLocationHeader", () => {
	test("正しい Location ヘッダーを設定する", async () => {
		const app = new Hono();
		app.get("/test", (c) => {
			setLocationHeader(c, "/projects", 42);
			return c.json({ ok: true });
		});

		const res = await app.request("/test");
		expect(res.headers.get("Location")).toBe("/projects/42");
	});

	test("文字列の resourceId でパスを正しく結合する", async () => {
		const app = new Hono();
		app.get("/test", (c) => {
			setLocationHeader(c, "/business-units", "BU-001");
			return c.json({ ok: true });
		});

		const res = await app.request("/test");
		expect(res.headers.get("Location")).toBe("/business-units/BU-001");
	});
});

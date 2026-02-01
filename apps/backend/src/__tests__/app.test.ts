import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { StatusCode } from "hono/utils/http-status";
import { describe, expect, test } from "vitest";
import {
	getProblemType,
	getStatusTitle,
	problemResponse,
} from "@/utils/errorHelper";

// テスト用アプリを構築（index.ts と同じエラーハンドラ構成）
function createTestApp() {
	const app = new Hono();

	// HTTPException を throw するテスト用ルート
	app.get("/error/http-exception", () => {
		throw new HTTPException(404, { message: "Test resource not found" });
	});

	app.get("/error/http-exception-409", () => {
		throw new HTTPException(409, { message: "Resource already exists" });
	});

	// 予期しないエラーを throw するテスト用ルート
	app.get("/error/unexpected", () => {
		throw new Error("Something went wrong unexpectedly");
	});

	// グローバルエラーハンドラ
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

	// Not Found ハンドラ
	app.notFound((c) => {
		return problemResponse(
			c,
			{
				type: "https://example.com/problems/resource-not-found",
				status: 404,
				title: "Resource Not Found",
				detail: `The requested resource '${c.req.path}' was not found`,
				instance: c.req.path,
				timestamp: new Date().toISOString(),
			},
			404,
		);
	});

	return app;
}

describe("グローバルエラーハンドラ", () => {
	const app = createTestApp();

	describe("HTTPException の処理", () => {
		test("HTTPException(404) を RFC 9457 形式で返す", async () => {
			const res = await app.request("/error/http-exception");
			expect(res.status).toBe(404);
			expect(res.headers.get("Content-Type")).toContain(
				"application/problem+json",
			);

			const body = await res.json();
			expect(body).toMatchObject({
				type: "https://example.com/problems/resource-not-found",
				status: 404,
				title: "Resource Not Found",
				detail: "Test resource not found",
				instance: "/error/http-exception",
			});
			expect(body.timestamp).toBeDefined();
		});

		test("HTTPException(409) を RFC 9457 形式で返す", async () => {
			const res = await app.request("/error/http-exception-409");
			expect(res.status).toBe(409);
			expect(res.headers.get("Content-Type")).toContain(
				"application/problem+json",
			);

			const body = await res.json();
			expect(body).toMatchObject({
				type: "https://example.com/problems/conflict",
				status: 409,
				title: "Resource Conflict",
				detail: "Resource already exists",
				instance: "/error/http-exception-409",
			});
			expect(body.timestamp).toBeDefined();
		});
	});

	describe("予期しないエラーの処理", () => {
		test("予期しないエラーを 500 RFC 9457 形式で返す", async () => {
			const res = await app.request("/error/unexpected");
			expect(res.status).toBe(500);
			expect(res.headers.get("Content-Type")).toContain(
				"application/problem+json",
			);

			const body = await res.json();
			expect(body).toMatchObject({
				type: "https://example.com/problems/internal-error",
				status: 500,
				title: "Internal Server Error",
				detail: "An unexpected error occurred",
				instance: "/error/unexpected",
			});
			expect(body.timestamp).toBeDefined();
		});

		test("予期しないエラーでは内部エラー情報を漏洩させない", async () => {
			const res = await app.request("/error/unexpected");
			const body = await res.json();
			expect(body.detail).not.toContain("Something went wrong unexpectedly");
			expect(body.detail).toBe("An unexpected error occurred");
		});
	});

	describe("Not Found ハンドラ", () => {
		test("未定義ルートに対して 404 RFC 9457 形式のレスポンスを返す", async () => {
			const res = await app.request("/non-existent-route");
			expect(res.status).toBe(404);
			expect(res.headers.get("Content-Type")).toContain(
				"application/problem+json",
			);

			const body = await res.json();
			expect(body).toMatchObject({
				type: "https://example.com/problems/resource-not-found",
				status: 404,
				title: "Resource Not Found",
				detail: "The requested resource '/non-existent-route' was not found",
				instance: "/non-existent-route",
			});
			expect(body.timestamp).toBeDefined();
		});
	});
});

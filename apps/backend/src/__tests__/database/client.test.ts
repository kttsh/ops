import { beforeEach, describe, expect, test, vi } from "vitest";

// mssql モジュールをモック
vi.mock("mssql", () => {
	class MockConnectionPool {
		connected = true;
		connect = vi.fn().mockResolvedValue(this);
		request = vi.fn();
	}
	return {
		default: {
			ConnectionPool: MockConnectionPool,
		},
	};
});

// dotenv/config をモック（副作用インポート）
vi.mock("dotenv/config", () => ({}));

describe("database/client", () => {
	beforeEach(() => {
		vi.resetModules();
		process.env.DB_SERVER = "localhost";
		process.env.DB_PORT = "1433";
		process.env.DB_DATABASE = "test_db";
		process.env.DB_USER = "test_user";
		process.env.DB_PASSWORD = "test_password";
	});

	test("getPool はコネクションプールを返す", async () => {
		const { getPool } = await import("@/database/client");
		const pool = await getPool();
		expect(pool).toBeDefined();
		expect(pool.connected).toBe(true);
	});

	test("getPool は同じインスタンスを返す（シングルトン）", async () => {
		const { getPool } = await import("@/database/client");
		const pool1 = await getPool();
		const pool2 = await getPool();
		expect(pool1).toBe(pool2);
	});
});

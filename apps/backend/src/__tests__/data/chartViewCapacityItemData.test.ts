import { beforeEach, describe, expect, test, vi } from "vitest";

// --- mssql モック ---
const mockInput = vi.fn().mockReturnThis();
const mockQuery = vi.fn();
const mockRequest = vi.fn(() => ({
	input: mockInput,
	query: mockQuery,
}));

const mockTransactionBegin = vi.fn();
const mockTransactionCommit = vi.fn();
const mockTransactionRollback = vi.fn();

class MockTransaction {
	begin = mockTransactionBegin;
	commit = mockTransactionCommit;
	rollback = mockTransactionRollback;
}

class MockRequest {
	input = mockInput;
	query = mockQuery;
}

vi.mock("mssql", () => {
	const Int = "Int";
	const Bit = "Bit";
	const VarChar = "VarChar";
	return {
		default: {
			Int,
			Bit,
			VarChar,
			Transaction: MockTransaction,
			Request: MockRequest,
		},
		Int,
		Bit,
		VarChar,
		Transaction: MockTransaction,
		Request: MockRequest,
	};
});

vi.mock("@/database/client", () => ({
	getPool: vi.fn().mockResolvedValue({
		request: mockRequest,
	}),
}));

describe("chartViewCapacityItemData", () => {
	let chartViewCapacityItemData: typeof import("@/data/chartViewCapacityItemData").chartViewCapacityItemData;

	beforeEach(async () => {
		vi.clearAllMocks();
		mockRequest.mockReturnValue({
			input: mockInput,
			query: mockQuery,
		});
		mockInput.mockReturnThis();
		const mod = await import("@/data/chartViewCapacityItemData");
		chartViewCapacityItemData = mod.chartViewCapacityItemData;
	});

	// ===========================================================================
	// findAll
	// ===========================================================================
	describe("findAll", () => {
		test("chartViewId でフィルタされた行を返す", async () => {
			const rows = [
				{
					chart_view_capacity_item_id: 1,
					chart_view_id: 10,
					capacity_scenario_id: 1,
				},
				{
					chart_view_capacity_item_id: 2,
					chart_view_id: 10,
					capacity_scenario_id: 2,
				},
			];
			mockQuery.mockResolvedValue({ recordset: rows });

			const result = await chartViewCapacityItemData.findAll(10);

			expect(result).toEqual(rows);
			expect(mockInput).toHaveBeenCalledWith("chartViewId", "Int", 10);
		});

		test("空配列を返す場合", async () => {
			mockQuery.mockResolvedValue({ recordset: [] });

			const result = await chartViewCapacityItemData.findAll(10);

			expect(result).toEqual([]);
		});
	});

	// ===========================================================================
	// bulkUpsert
	// ===========================================================================
	describe("bulkUpsert", () => {
		test("MERGE + DELETE を実行しトランザクションをコミットする", async () => {
			mockTransactionBegin.mockResolvedValue(undefined);
			mockTransactionCommit.mockResolvedValue(undefined);
			// MERGE クエリ（各アイテム分）
			mockQuery.mockResolvedValueOnce({ rowsAffected: [1] });
			mockQuery.mockResolvedValueOnce({ rowsAffected: [1] });
			// DELETE クエリ
			mockQuery.mockResolvedValueOnce({ rowsAffected: [0] });
			// findAll クエリ（戻り値）
			const rows = [
				{
					chart_view_capacity_item_id: 1,
					chart_view_id: 10,
					capacity_scenario_id: 1,
				},
				{
					chart_view_capacity_item_id: 2,
					chart_view_id: 10,
					capacity_scenario_id: 2,
				},
			];
			mockQuery.mockResolvedValueOnce({ recordset: rows });

			const result = await chartViewCapacityItemData.bulkUpsert(10, [
				{
					capacityScenarioId: 1,
					isVisible: true,
					colorCode: "#dc2626",
				},
				{
					capacityScenarioId: 2,
					isVisible: false,
					colorCode: null,
				},
			]);

			expect(result).toEqual(rows);
			expect(mockTransactionBegin).toHaveBeenCalled();
			expect(mockTransactionCommit).toHaveBeenCalled();
		});

		test("空配列の場合、全アイテムを DELETE しコミットする", async () => {
			mockTransactionBegin.mockResolvedValue(undefined);
			mockTransactionCommit.mockResolvedValue(undefined);
			// DELETE クエリ
			mockQuery.mockResolvedValueOnce({ rowsAffected: [2] });
			// findAll クエリ（戻り値）
			mockQuery.mockResolvedValueOnce({ recordset: [] });

			const result = await chartViewCapacityItemData.bulkUpsert(10, []);

			expect(result).toEqual([]);
			expect(mockTransactionBegin).toHaveBeenCalled();
			expect(mockTransactionCommit).toHaveBeenCalled();
		});

		test("エラー発生時にロールバックする", async () => {
			mockTransactionBegin.mockResolvedValue(undefined);
			mockQuery.mockRejectedValue(new Error("DB error"));
			mockTransactionRollback.mockResolvedValue(undefined);

			await expect(
				chartViewCapacityItemData.bulkUpsert(10, [
					{
						capacityScenarioId: 1,
						isVisible: true,
						colorCode: null,
					},
				]),
			).rejects.toThrow("DB error");

			expect(mockTransactionRollback).toHaveBeenCalled();
		});
	});

	// ===========================================================================
	// chartViewExists
	// ===========================================================================
	describe("chartViewExists", () => {
		test("存在する場合 true を返す", async () => {
			mockQuery.mockResolvedValue({ recordset: [{ exists: true }] });

			const result = await chartViewCapacityItemData.chartViewExists(10);

			expect(result).toBe(true);
		});

		test("存在しない場合 false を返す", async () => {
			mockQuery.mockResolvedValue({ recordset: [{ exists: false }] });

			const result = await chartViewCapacityItemData.chartViewExists(999);

			expect(result).toBe(false);
		});
	});

	// ===========================================================================
	// capacityScenariosExist
	// ===========================================================================
	describe("capacityScenariosExist", () => {
		test("全シナリオが存在する場合 true を返す", async () => {
			mockQuery.mockResolvedValue({ recordset: [{ cnt: 2 }] });

			const result = await chartViewCapacityItemData.capacityScenariosExist([
				1, 2,
			]);

			expect(result).toBe(true);
		});

		test("一部が存在しない場合 false を返す", async () => {
			mockQuery.mockResolvedValue({ recordset: [{ cnt: 1 }] });

			const result = await chartViewCapacityItemData.capacityScenariosExist([
				1, 999,
			]);

			expect(result).toBe(false);
		});

		test("空配列の場合 true を返す", async () => {
			const result = await chartViewCapacityItemData.capacityScenariosExist([]);

			expect(result).toBe(true);
		});
	});
});

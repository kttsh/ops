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
	return {
		default: {
			Int,
			Bit,
			Transaction: MockTransaction,
			Request: MockRequest,
		},
		Int,
		Bit,
		Transaction: MockTransaction,
		Request: MockRequest,
	};
});

const _mockPool = {
	request: mockRequest,
};

vi.mock("@/database/client", () => ({
	getPool: vi.fn().mockResolvedValue({
		request: mockRequest,
	}),
}));

describe("chartViewProjectItemData", () => {
	let chartViewProjectItemData: typeof import("@/data/chartViewProjectItemData").chartViewProjectItemData;

	beforeEach(async () => {
		vi.clearAllMocks();
		mockRequest.mockReturnValue({
			input: mockInput,
			query: mockQuery,
		});
		mockInput.mockReturnThis();
		const mod = await import("@/data/chartViewProjectItemData");
		chartViewProjectItemData = mod.chartViewProjectItemData;
	});

	// ===========================================================================
	// findAll
	// ===========================================================================
	describe("findAll", () => {
		test("chartViewId でフィルタされた行を返す", async () => {
			const rows = [
				{ chart_view_project_item_id: 1, chart_view_id: 10, display_order: 0 },
				{ chart_view_project_item_id: 2, chart_view_id: 10, display_order: 1 },
			];
			mockQuery.mockResolvedValue({ recordset: rows });

			const result = await chartViewProjectItemData.findAll(10);

			expect(result).toEqual(rows);
			expect(mockInput).toHaveBeenCalledWith("chartViewId", "Int", 10);
		});

		test("空配列を返す場合", async () => {
			mockQuery.mockResolvedValue({ recordset: [] });

			const result = await chartViewProjectItemData.findAll(10);

			expect(result).toEqual([]);
		});
	});

	// ===========================================================================
	// findById
	// ===========================================================================
	describe("findById", () => {
		test("指定IDの行を返す", async () => {
			const row = { chart_view_project_item_id: 1, chart_view_id: 10 };
			mockQuery.mockResolvedValue({ recordset: [row] });

			const result = await chartViewProjectItemData.findById(1);

			expect(result).toEqual(row);
			expect(mockInput).toHaveBeenCalledWith("id", "Int", 1);
		});

		test("存在しないIDの場合 undefined を返す", async () => {
			mockQuery.mockResolvedValue({ recordset: [] });

			const result = await chartViewProjectItemData.findById(999);

			expect(result).toBeUndefined();
		});
	});

	// ===========================================================================
	// create
	// ===========================================================================
	describe("create", () => {
		test("INSERT して findById で完全なレコードを返す", async () => {
			const insertedRow = {
				chart_view_project_item_id: 3,
				chart_view_id: 10,
				project_id: 5,
				project_case_id: 12,
				display_order: 0,
				is_visible: true,
				project_code: "PRJ-001",
				project_name: "テストプロジェクト",
				case_name: "テストケース",
			};
			// INSERT クエリ
			mockQuery.mockResolvedValueOnce({
				recordset: [{ chart_view_project_item_id: 3 }],
			});
			// findById クエリ
			mockQuery.mockResolvedValueOnce({
				recordset: [insertedRow],
			});

			const result = await chartViewProjectItemData.create({
				chartViewId: 10,
				projectId: 5,
				projectCaseId: 12,
				displayOrder: 0,
				isVisible: true,
			});

			expect(result).toEqual(insertedRow);
		});

		test("projectCaseId が null でも作成できる", async () => {
			mockQuery.mockResolvedValueOnce({
				recordset: [{ chart_view_project_item_id: 4 }],
			});
			mockQuery.mockResolvedValueOnce({
				recordset: [
					{
						chart_view_project_item_id: 4,
						project_case_id: null,
						case_name: null,
					},
				],
			});

			const result = await chartViewProjectItemData.create({
				chartViewId: 10,
				projectId: 8,
				projectCaseId: null,
				displayOrder: 1,
				isVisible: true,
			});

			expect(result.project_case_id).toBeNull();
		});
	});

	// ===========================================================================
	// update
	// ===========================================================================
	describe("update", () => {
		test("動的SET句を生成して更新する", async () => {
			const updatedRow = { chart_view_project_item_id: 1, display_order: 5 };
			// update クエリ
			mockQuery.mockResolvedValueOnce({ rowsAffected: [1] });
			// findById クエリ
			mockQuery.mockResolvedValueOnce({ recordset: [updatedRow] });

			const result = await chartViewProjectItemData.update(1, {
				displayOrder: 5,
			});

			expect(result).toEqual(updatedRow);
		});

		test("projectCaseId のみ更新する場合", async () => {
			const updatedRow = { chart_view_project_item_id: 1, project_case_id: 15 };
			mockQuery.mockResolvedValueOnce({ rowsAffected: [1] });
			mockQuery.mockResolvedValueOnce({ recordset: [updatedRow] });

			const result = await chartViewProjectItemData.update(1, {
				projectCaseId: 15,
			});

			expect(result).toEqual(updatedRow);
		});

		test("isVisible のみ更新する場合", async () => {
			const updatedRow = { chart_view_project_item_id: 1, is_visible: false };
			mockQuery.mockResolvedValueOnce({ rowsAffected: [1] });
			mockQuery.mockResolvedValueOnce({ recordset: [updatedRow] });

			const result = await chartViewProjectItemData.update(1, {
				isVisible: false,
			});

			expect(result).toEqual(updatedRow);
		});

		test("複数フィールドを同時に更新する場合", async () => {
			const updatedRow = {
				chart_view_project_item_id: 1,
				display_order: 3,
				is_visible: false,
			};
			mockQuery.mockResolvedValueOnce({ rowsAffected: [1] });
			mockQuery.mockResolvedValueOnce({ recordset: [updatedRow] });

			const result = await chartViewProjectItemData.update(1, {
				displayOrder: 3,
				isVisible: false,
			});

			expect(result).toEqual(updatedRow);
		});
	});

	// ===========================================================================
	// deleteById
	// ===========================================================================
	describe("deleteById", () => {
		test("物理削除に成功した場合 true を返す", async () => {
			mockQuery.mockResolvedValue({ rowsAffected: [1] });

			const result = await chartViewProjectItemData.deleteById(1);

			expect(result).toBe(true);
			expect(mockInput).toHaveBeenCalledWith("id", "Int", 1);
		});

		test("対象が存在しない場合 false を返す", async () => {
			mockQuery.mockResolvedValue({ rowsAffected: [0] });

			const result = await chartViewProjectItemData.deleteById(999);

			expect(result).toBe(false);
		});
	});

	// ===========================================================================
	// updateDisplayOrders
	// ===========================================================================
	describe("updateDisplayOrders", () => {
		test("トランザクション内でループ UPDATE を実行する", async () => {
			mockTransactionBegin.mockResolvedValue(undefined);
			mockTransactionCommit.mockResolvedValue(undefined);
			mockQuery.mockResolvedValue({ rowsAffected: [1] });

			await chartViewProjectItemData.updateDisplayOrders([
				{ chartViewProjectItemId: 1, displayOrder: 1 },
				{ chartViewProjectItemId: 2, displayOrder: 0 },
			]);

			expect(mockTransactionBegin).toHaveBeenCalled();
			expect(mockTransactionCommit).toHaveBeenCalled();
		});

		test("エラー発生時にロールバックする", async () => {
			mockTransactionBegin.mockResolvedValue(undefined);
			mockQuery.mockRejectedValue(new Error("DB error"));
			mockTransactionRollback.mockResolvedValue(undefined);

			await expect(
				chartViewProjectItemData.updateDisplayOrders([
					{ chartViewProjectItemId: 1, displayOrder: 0 },
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

			const result = await chartViewProjectItemData.chartViewExists(10);

			expect(result).toBe(true);
		});

		test("存在しない場合 false を返す", async () => {
			mockQuery.mockResolvedValue({ recordset: [{ exists: false }] });

			const result = await chartViewProjectItemData.chartViewExists(999);

			expect(result).toBe(false);
		});
	});

	// ===========================================================================
	// projectExists
	// ===========================================================================
	describe("projectExists", () => {
		test("存在する場合 true を返す", async () => {
			mockQuery.mockResolvedValue({ recordset: [{ exists: true }] });

			const result = await chartViewProjectItemData.projectExists(5);

			expect(result).toBe(true);
		});

		test("存在しない場合 false を返す", async () => {
			mockQuery.mockResolvedValue({ recordset: [{ exists: false }] });

			const result = await chartViewProjectItemData.projectExists(999);

			expect(result).toBe(false);
		});
	});

	// ===========================================================================
	// projectCaseBelongsToProject
	// ===========================================================================
	describe("projectCaseBelongsToProject", () => {
		test("所属する場合 true を返す", async () => {
			mockQuery.mockResolvedValue({ recordset: [{ exists: true }] });

			const result = await chartViewProjectItemData.projectCaseBelongsToProject(
				12,
				5,
			);

			expect(result).toBe(true);
		});

		test("所属しない場合 false を返す", async () => {
			mockQuery.mockResolvedValue({ recordset: [{ exists: false }] });

			const result = await chartViewProjectItemData.projectCaseBelongsToProject(
				12,
				999,
			);

			expect(result).toBe(false);
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
				{ chart_view_project_item_id: 1, chart_view_id: 10, display_order: 0 },
				{ chart_view_project_item_id: 2, chart_view_id: 10, display_order: 1 },
			];
			mockQuery.mockResolvedValueOnce({ recordset: rows });

			const result = await chartViewProjectItemData.bulkUpsert(10, [
				{
					projectId: 5,
					projectCaseId: 12,
					displayOrder: 0,
					isVisible: true,
					color: "#3b82f6",
				},
				{
					projectId: 8,
					projectCaseId: null,
					displayOrder: 1,
					isVisible: true,
					color: null,
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

			const result = await chartViewProjectItemData.bulkUpsert(10, []);

			expect(result).toEqual([]);
			expect(mockTransactionBegin).toHaveBeenCalled();
			expect(mockTransactionCommit).toHaveBeenCalled();
		});

		test("エラー発生時にロールバックする", async () => {
			mockTransactionBegin.mockResolvedValue(undefined);
			mockQuery.mockRejectedValue(new Error("DB error"));
			mockTransactionRollback.mockResolvedValue(undefined);

			await expect(
				chartViewProjectItemData.bulkUpsert(10, [
					{
						projectId: 5,
						projectCaseId: null,
						displayOrder: 0,
						isVisible: true,
						color: null,
					},
				]),
			).rejects.toThrow("DB error");

			expect(mockTransactionRollback).toHaveBeenCalled();
		});
	});
});

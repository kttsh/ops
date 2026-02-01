import { describe, expect, test } from "vitest";
import { toWorkTypeResponse } from "@/transform/workTypeTransform";
import type { WorkTypeRow } from "@/types/workType";

describe("workTypeTransform", () => {
	describe("toWorkTypeResponse", () => {
		test("snake_case の DB 行を camelCase の API レスポンス形式に変換する", () => {
			const row: WorkTypeRow = {
				work_type_code: "WT-001",
				name: "作業種類1",
				display_order: 1,
				color: "#FF5733",
				created_at: new Date("2026-01-01T00:00:00Z"),
				updated_at: new Date("2026-01-15T00:00:00Z"),
				deleted_at: null,
			};

			const result = toWorkTypeResponse(row);

			expect(result).toEqual({
				workTypeCode: "WT-001",
				name: "作業種類1",
				displayOrder: 1,
				color: "#FF5733",
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
			});
		});

		test("Date 型を ISO 8601 文字列に変換する", () => {
			const row: WorkTypeRow = {
				work_type_code: "WT-002",
				name: "テスト",
				display_order: 0,
				color: null,
				created_at: new Date("2026-06-15T09:30:00Z"),
				updated_at: new Date("2026-06-15T10:00:00Z"),
				deleted_at: null,
			};

			const result = toWorkTypeResponse(row);

			expect(result.createdAt).toBe("2026-06-15T09:30:00.000Z");
			expect(result.updatedAt).toBe("2026-06-15T10:00:00.000Z");
		});

		test("color が null の場合はそのまま null を返す", () => {
			const row: WorkTypeRow = {
				work_type_code: "WT-003",
				name: "カラーなし",
				display_order: 0,
				color: null,
				created_at: new Date("2026-01-01T00:00:00Z"),
				updated_at: new Date("2026-01-01T00:00:00Z"),
				deleted_at: null,
			};

			const result = toWorkTypeResponse(row);

			expect(result.color).toBeNull();
		});

		test("color が値を持つ場合はそのまま返す", () => {
			const row: WorkTypeRow = {
				work_type_code: "WT-004",
				name: "カラーあり",
				display_order: 0,
				color: "#00FF00",
				created_at: new Date("2026-01-01T00:00:00Z"),
				updated_at: new Date("2026-01-01T00:00:00Z"),
				deleted_at: null,
			};

			const result = toWorkTypeResponse(row);

			expect(result.color).toBe("#00FF00");
		});

		test("deleted_at フィールドがレスポンスに含まれない", () => {
			const row: WorkTypeRow = {
				work_type_code: "WT-005",
				name: "削除済み",
				display_order: 5,
				color: "#FF0000",
				created_at: new Date("2026-01-01T00:00:00Z"),
				updated_at: new Date("2026-01-10T00:00:00Z"),
				deleted_at: new Date("2026-01-10T00:00:00Z"),
			};

			const result = toWorkTypeResponse(row);

			expect(result).not.toHaveProperty("deletedAt");
			expect(result).not.toHaveProperty("deleted_at");
		});

		test("displayOrder が 0 の場合も正しく変換する", () => {
			const row: WorkTypeRow = {
				work_type_code: "WT-006",
				name: "デフォルト順",
				display_order: 0,
				color: null,
				created_at: new Date("2026-01-01T00:00:00Z"),
				updated_at: new Date("2026-01-01T00:00:00Z"),
				deleted_at: null,
			};

			const result = toWorkTypeResponse(row);

			expect(result.displayOrder).toBe(0);
		});
	});
});

import { describe, expect, test } from "vitest";
import { toProjectResponse } from "@/transform/projectTransform";
import type { ProjectRow } from "@/types/project";

describe("projectTransform", () => {
	describe("toProjectResponse", () => {
		test("snake_case の DB 行を camelCase の API レスポンス形式に変換する", () => {
			const row: ProjectRow = {
				project_id: 1,
				project_code: "PRJ-001",
				name: "テスト案件",
				business_unit_code: "BU-001",
				business_unit_name: "エンジニアリング部",
				project_type_code: "PT-001",
				project_type_name: "受託開発",
				start_year_month: "202601",
				total_manhour: 100,
				status: "ACTIVE",
				duration_months: 12,
				created_at: new Date("2026-01-01T00:00:00Z"),
				updated_at: new Date("2026-01-15T00:00:00Z"),
				deleted_at: null,
			};

			const result = toProjectResponse(row);

			expect(result).toEqual({
				projectId: 1,
				projectCode: "PRJ-001",
				name: "テスト案件",
				businessUnitCode: "BU-001",
				businessUnitName: "エンジニアリング部",
				projectTypeCode: "PT-001",
				projectTypeName: "受託開発",
				startYearMonth: "202601",
				totalManhour: 100,
				status: "active",
				durationMonths: 12,
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
				deletedAt: null,
			});
		});

		test("Date 型を ISO 8601 文字列に変換する", () => {
			const row: ProjectRow = {
				project_id: 2,
				project_code: "PRJ-002",
				name: "テスト",
				business_unit_code: "BU-001",
				business_unit_name: "テスト部",
				project_type_code: null,
				project_type_name: null,
				start_year_month: "202606",
				total_manhour: 50,
				status: "DRAFT",
				duration_months: null,
				created_at: new Date("2026-06-15T09:30:00Z"),
				updated_at: new Date("2026-06-15T10:00:00Z"),
				deleted_at: null,
			};

			const result = toProjectResponse(row);

			expect(result.createdAt).toBe("2026-06-15T09:30:00.000Z");
			expect(result.updatedAt).toBe("2026-06-15T10:00:00.000Z");
		});

		test("null 許容フィールドをそのまま保持する（projectTypeCode, projectTypeName, durationMonths）", () => {
			const row: ProjectRow = {
				project_id: 3,
				project_code: "PRJ-003",
				name: "NULLテスト",
				business_unit_code: "BU-001",
				business_unit_name: "テスト部",
				project_type_code: null,
				project_type_name: null,
				start_year_month: "202601",
				total_manhour: 200,
				status: "ACTIVE",
				duration_months: null,
				created_at: new Date("2026-01-01T00:00:00Z"),
				updated_at: new Date("2026-01-01T00:00:00Z"),
				deleted_at: null,
			};

			const result = toProjectResponse(row);

			expect(result.projectTypeCode).toBeNull();
			expect(result.projectTypeName).toBeNull();
			expect(result.durationMonths).toBeNull();
		});

		test("deleted_at フィールドが deletedAt として ISO 文字列に変換される", () => {
			const row: ProjectRow = {
				project_id: 4,
				project_code: "PRJ-004",
				name: "削除済み案件",
				business_unit_code: "BU-001",
				business_unit_name: "テスト部",
				project_type_code: "PT-001",
				project_type_name: "受託開発",
				start_year_month: "202601",
				total_manhour: 100,
				status: "ACTIVE",
				duration_months: 6,
				created_at: new Date("2026-01-01T00:00:00Z"),
				updated_at: new Date("2026-01-10T00:00:00Z"),
				deleted_at: new Date("2026-01-10T00:00:00Z"),
			};

			const result = toProjectResponse(row);

			expect(result).toHaveProperty("deletedAt", "2026-01-10T00:00:00.000Z");
			expect(result).not.toHaveProperty("deleted_at");
		});

		test("totalManhour が正しく変換される", () => {
			const row: ProjectRow = {
				project_id: 5,
				project_code: "PRJ-005",
				name: "工数テスト",
				business_unit_code: "BU-001",
				business_unit_name: "テスト部",
				project_type_code: null,
				project_type_name: null,
				start_year_month: "202601",
				total_manhour: 9999,
				status: "ACTIVE",
				duration_months: null,
				created_at: new Date("2026-01-01T00:00:00Z"),
				updated_at: new Date("2026-01-01T00:00:00Z"),
				deleted_at: null,
			};

			const result = toProjectResponse(row);

			expect(result.totalManhour).toBe(9999);
		});
	});
});

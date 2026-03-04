import { createFieldMapper } from "@/utils/fieldMapper";

// テスト用の型定義
interface TestRow {
	user_id: number;
	user_name: string;
	display_order: number;
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
	status: string;
	extra_field: string;
}

interface TestResponse {
	userId: number;
	userName: string;
	displayOrder: number;
	createdAt: string;
	updatedAt: string;
}

describe("createFieldMapper", () => {
	describe("直接マッピング", () => {
		test("snake_case キーから camelCase フィールドへ変換する", () => {
			const mapper = createFieldMapper<TestRow, TestResponse>({
				userId: "user_id",
				userName: "user_name",
				displayOrder: "display_order",
				createdAt: "created_at",
				updatedAt: "updated_at",
			});

			const row: TestRow = {
				user_id: 1,
				user_name: "テスト太郎",
				display_order: 5,
				created_at: new Date("2025-01-01T00:00:00.000Z"),
				updated_at: new Date("2025-06-15T12:30:00.000Z"),
				deleted_at: null,
				status: "ACTIVE",
				extra_field: "ignored",
			};

			const result = mapper(row);

			expect(result).toEqual({
				userId: 1,
				userName: "テスト太郎",
				displayOrder: 5,
				createdAt: "2025-01-01T00:00:00.000Z",
				updatedAt: "2025-06-15T12:30:00.000Z",
			});
		});
	});

	describe("Date 自動変換", () => {
		test("Date オブジェクトを ISO 8601 文字列に変換する", () => {
			const mapper = createFieldMapper<
				Pick<TestRow, "created_at" | "updated_at">,
				Pick<TestResponse, "createdAt" | "updatedAt">
			>({
				createdAt: "created_at",
				updatedAt: "updated_at",
			});

			const result = mapper({
				created_at: new Date("2025-03-01T09:00:00.000Z"),
				updated_at: new Date("2025-03-02T10:00:00.000Z"),
			});

			expect(result.createdAt).toBe("2025-03-01T09:00:00.000Z");
			expect(result.updatedAt).toBe("2025-03-02T10:00:00.000Z");
		});
	});

	describe("Nullable Date", () => {
		interface NullableDateRow {
			id: number;
			created_at: Date;
			deleted_at: Date | null;
		}
		interface NullableDateResponse {
			id: number;
			createdAt: string;
			deletedAt: string | null;
		}

		test("null の Date フィールドは null として出力する", () => {
			const mapper = createFieldMapper<NullableDateRow, NullableDateResponse>({
				id: "id",
				createdAt: "created_at",
				deletedAt: "deleted_at",
			});

			const result = mapper({
				id: 1,
				created_at: new Date("2025-01-01T00:00:00.000Z"),
				deleted_at: null,
			});

			expect(result.deletedAt).toBeNull();
		});

		test("値がある Date フィールドは ISO 8601 文字列に変換する", () => {
			const mapper = createFieldMapper<NullableDateRow, NullableDateResponse>({
				id: "id",
				createdAt: "created_at",
				deletedAt: "deleted_at",
			});

			const result = mapper({
				id: 1,
				created_at: new Date("2025-01-01T00:00:00.000Z"),
				deleted_at: new Date("2025-12-31T23:59:59.000Z"),
			});

			expect(result.deletedAt).toBe("2025-12-31T23:59:59.000Z");
		});
	});

	describe("カスタム変換（transform）", () => {
		interface CustomRow {
			status: string;
			is_visible: boolean;
		}
		interface CustomResponse {
			status: string;
			isVisible: boolean;
		}

		test("transform 関数が正しく適用される", () => {
			const mapper = createFieldMapper<CustomRow, CustomResponse>({
				status: { field: "status", transform: (v) => v.toLowerCase() },
				isVisible: { field: "is_visible", transform: (v) => !!v },
			});

			const result = mapper({ status: "ACTIVE", is_visible: true });

			expect(result.status).toBe("active");
			expect(result.isVisible).toBe(true);
		});
	});

	describe("計算フィールド（computed）", () => {
		interface NestedRow {
			project_code: string;
			project_name: string;
			case_id: number | null;
			case_name: string | null;
		}
		interface NestedResponse {
			project: { code: string; name: string };
			projectCase: { caseName: string } | null;
		}

		test("computed 関数が Row 全体を受け取り正しい値を返す", () => {
			const mapper = createFieldMapper<NestedRow, NestedResponse>({
				project: {
					computed: (row) => ({
						code: row.project_code,
						name: row.project_name,
					}),
				},
				projectCase: {
					computed: (row) =>
						row.case_id !== null ? { caseName: row.case_name! } : null,
				},
			});

			expect(
				mapper({
					project_code: "P001",
					project_name: "テストプロジェクト",
					case_id: 1,
					case_name: "ケースA",
				}),
			).toEqual({
				project: { code: "P001", name: "テストプロジェクト" },
				projectCase: { caseName: "ケースA" },
			});

			expect(
				mapper({
					project_code: "P002",
					project_name: "テスト2",
					case_id: null,
					case_name: null,
				}),
			).toEqual({
				project: { code: "P002", name: "テスト2" },
				projectCase: null,
			});
		});
	});

	describe("フィールド除外", () => {
		test("マッピングに含まれない Row フィールドは Response に含まれない", () => {
			const mapper = createFieldMapper<TestRow, Pick<TestResponse, "userId">>({
				userId: "user_id",
			});

			const result = mapper({
				user_id: 1,
				user_name: "テスト",
				display_order: 0,
				created_at: new Date(),
				updated_at: new Date(),
				deleted_at: null,
				status: "ACTIVE",
				extra_field: "should not appear",
			});

			expect(Object.keys(result)).toEqual(["userId"]);
		});
	});
});

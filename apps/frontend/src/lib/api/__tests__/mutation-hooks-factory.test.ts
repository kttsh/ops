import { describe, expect, it, vi } from "vitest";
import { createCrudMutations } from "../mutation-hooks-factory";
import { createQueryKeys } from "../query-key-factory";
import type { CrudClient, BaseListParams } from "../crud-client-factory";
import type { SingleResponse, PaginatedResponse } from "../types";

// Mock TanStack Query hooks
const mockInvalidateQueries = vi.fn();
vi.mock("@tanstack/react-query", () => ({
	useMutation: (opts: { mutationFn: unknown; onSuccess: unknown }) => ({
		mutationFn: opts.mutationFn,
		onSuccess: opts.onSuccess,
	}),
	useQueryClient: () => ({
		invalidateQueries: mockInvalidateQueries,
	}),
}));

type TestEntity = { code: string; name: string };
type CreateInput = { code: string; name: string };
type UpdateInput = { name: string };
type TestListParams = { includeDisabled: boolean };

function createMockClient(): CrudClient<TestEntity, CreateInput, UpdateInput, string, BaseListParams> {
	return {
		fetchList: vi.fn<(params: BaseListParams) => Promise<PaginatedResponse<TestEntity>>>(),
		fetchDetail: vi.fn<(id: string) => Promise<SingleResponse<TestEntity>>>(),
		create: vi.fn<(input: CreateInput) => Promise<SingleResponse<TestEntity>>>(),
		update: vi.fn<(id: string, input: UpdateInput) => Promise<SingleResponse<TestEntity>>>(),
		delete: vi.fn<(id: string) => Promise<void>>(),
		restore: vi.fn<(id: string) => Promise<SingleResponse<TestEntity>>>(),
	};
}

describe("createCrudMutations", () => {
	it("4つの Mutation Hook を含むオブジェクトを返す", () => {
		const client = createMockClient();
		const queryKeys = createQueryKeys<string, TestListParams>("work-types");

		const mutations = createCrudMutations({ client, queryKeys });

		expect(mutations).toHaveProperty("useCreate");
		expect(mutations).toHaveProperty("useUpdate");
		expect(mutations).toHaveProperty("useDelete");
		expect(mutations).toHaveProperty("useRestore");
		expect(typeof mutations.useCreate).toBe("function");
		expect(typeof mutations.useUpdate).toBe("function");
		expect(typeof mutations.useDelete).toBe("function");
		expect(typeof mutations.useRestore).toBe("function");
	});

	describe("useCreate", () => {
		it("lists() キーを無効化する onSuccess を持つ", () => {
			mockInvalidateQueries.mockClear();
			const client = createMockClient();
			const queryKeys = createQueryKeys<string, TestListParams>("work-types");
			const mutations = createCrudMutations({ client, queryKeys });

			const result = mutations.useCreate() as unknown as { onSuccess: () => void };
			result.onSuccess();

			expect(mockInvalidateQueries).toHaveBeenCalledWith({
				queryKey: ["work-types", "list"],
			});
		});

		it("呼び出し側の onSuccess コールバックを実行する", () => {
			mockInvalidateQueries.mockClear();
			const client = createMockClient();
			const queryKeys = createQueryKeys<string, TestListParams>("work-types");
			const mutations = createCrudMutations({ client, queryKeys });

			const customOnSuccess = vi.fn();
			const result = mutations.useCreate({ onSuccess: customOnSuccess }) as unknown as {
				onSuccess: (data: SingleResponse<TestEntity>) => void;
			};
			const mockData = { data: { code: "WT-01", name: "test" } };
			result.onSuccess(mockData);

			expect(customOnSuccess).toHaveBeenCalledWith(mockData);
		});
	});

	describe("useUpdate", () => {
		it("lists() キーと detail(id) キーを無効化する onSuccess を持つ", () => {
			mockInvalidateQueries.mockClear();
			const client = createMockClient();
			const queryKeys = createQueryKeys<string, TestListParams>("work-types");
			const mutations = createCrudMutations({ client, queryKeys });

			const result = mutations.useUpdate("WT-01") as unknown as { onSuccess: () => void };
			result.onSuccess();

			expect(mockInvalidateQueries).toHaveBeenCalledWith({
				queryKey: ["work-types", "list"],
			});
			expect(mockInvalidateQueries).toHaveBeenCalledWith({
				queryKey: ["work-types", "detail", "WT-01"],
			});
		});
	});

	describe("useDelete", () => {
		it("lists() キーを無効化する onSuccess を持つ", () => {
			mockInvalidateQueries.mockClear();
			const client = createMockClient();
			const queryKeys = createQueryKeys<string, TestListParams>("work-types");
			const mutations = createCrudMutations({ client, queryKeys });

			const result = mutations.useDelete() as unknown as { onSuccess: () => void };
			result.onSuccess();

			expect(mockInvalidateQueries).toHaveBeenCalledWith({
				queryKey: ["work-types", "list"],
			});
		});
	});

	describe("useRestore", () => {
		it("lists() キーを無効化する onSuccess を持つ", () => {
			mockInvalidateQueries.mockClear();
			const client = createMockClient();
			const queryKeys = createQueryKeys<string, TestListParams>("work-types");
			const mutations = createCrudMutations({ client, queryKeys });

			const result = mutations.useRestore() as unknown as { onSuccess: () => void };
			result.onSuccess();

			expect(mockInvalidateQueries).toHaveBeenCalledWith({
				queryKey: ["work-types", "list"],
			});
		});
	});
});

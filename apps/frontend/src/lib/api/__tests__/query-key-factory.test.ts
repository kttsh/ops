import { describe, expect, it } from "vitest";
import { createDetailQueryOptions, createListQueryOptions, createQueryKeys } from "../query-key-factory";
import { STALE_TIMES } from "../constants";

describe("createQueryKeys", () => {
	it("リソース名から5つのキー生成関数を持つオブジェクトを返す", () => {
		const keys = createQueryKeys("work-types");

		expect(keys).toHaveProperty("all");
		expect(keys).toHaveProperty("lists");
		expect(keys).toHaveProperty("list");
		expect(keys).toHaveProperty("details");
		expect(keys).toHaveProperty("detail");
	});

	it("all は [resourceName] を返す", () => {
		const keys = createQueryKeys("work-types");
		expect(keys.all).toEqual(["work-types"]);
	});

	it("lists() は [resourceName, 'list'] を返す", () => {
		const keys = createQueryKeys("work-types");
		expect(keys.lists()).toEqual(["work-types", "list"]);
	});

	it("list(params) は [resourceName, 'list', params] を返す", () => {
		const keys = createQueryKeys<string, { includeDisabled: boolean }>("work-types");
		const params = { includeDisabled: true };
		expect(keys.list(params)).toEqual(["work-types", "list", params]);
	});

	it("details() は [resourceName, 'detail'] を返す", () => {
		const keys = createQueryKeys("work-types");
		expect(keys.details()).toEqual(["work-types", "detail"]);
	});

	it("detail(id) は [resourceName, 'detail', id] を返す（string ID）", () => {
		const keys = createQueryKeys<string>("work-types");
		expect(keys.detail("WT-01")).toEqual(["work-types", "detail", "WT-01"]);
	});

	it("detail(id) は [resourceName, 'detail', id] を返す（number ID）", () => {
		const keys = createQueryKeys<number>("projects");
		expect(keys.detail(42)).toEqual(["projects", "detail", 42]);
	});

	it("キーが TanStack Query の階層的無効化に対応した構造を持つ", () => {
		const keys = createQueryKeys("work-types");
		const all = keys.all;
		const lists = keys.lists();
		const list = keys.list({ includeDisabled: false });
		const details = keys.details();
		const detail = keys.detail("WT-01");

		// all がすべてのキーのプレフィックスとして含まれる
		expect(lists.slice(0, 1)).toEqual(all);
		expect(list.slice(0, 1)).toEqual(all);
		expect(details.slice(0, 1)).toEqual(all);
		expect(detail.slice(0, 1)).toEqual(all);

		// lists がリストキーのプレフィックスとして含まれる
		expect(list.slice(0, 2)).toEqual([...lists]);

		// details が詳細キーのプレフィックスとして含まれる
		expect(detail.slice(0, 2)).toEqual([...details]);
	});
});

describe("createListQueryOptions", () => {
	it("queryKey と queryFn と staleTime を含む queryOptions を返す", () => {
		const keys = createQueryKeys<string, { includeDisabled: boolean }>("work-types");
		const fetchList = async (_params: { includeDisabled: boolean }) => ({
			data: [],
			meta: { pagination: { currentPage: 1, pageSize: 20, totalItems: 0, totalPages: 0 } },
		});

		const getOptions = createListQueryOptions({
			queryKeys: keys,
			fetchList,
		});

		const options = getOptions({ includeDisabled: false });

		expect(options.queryKey).toEqual(["work-types", "list", { includeDisabled: false }]);
		expect(options.staleTime).toBe(STALE_TIMES.STANDARD);
		expect(typeof options.queryFn).toBe("function");
	});

	it("staleTime をオーバーライドできる", () => {
		const keys = createQueryKeys<string, { includeDisabled: boolean }>("work-types");
		const fetchList = async (_params: { includeDisabled: boolean }) => ({
			data: [],
			meta: { pagination: { currentPage: 1, pageSize: 20, totalItems: 0, totalPages: 0 } },
		});

		const getOptions = createListQueryOptions({
			queryKeys: keys,
			fetchList,
			staleTime: STALE_TIMES.SHORT,
		});

		const options = getOptions({ includeDisabled: false });
		expect(options.staleTime).toBe(STALE_TIMES.SHORT);
	});
});

describe("createDetailQueryOptions", () => {
	it("queryKey と queryFn と staleTime を含む queryOptions を返す", () => {
		const keys = createQueryKeys<string>("work-types");
		const fetchDetail = async (_id: string) => ({ data: { code: "WT-01", name: "test" } });

		const getOptions = createDetailQueryOptions({
			queryKeys: keys,
			fetchDetail,
		});

		const options = getOptions("WT-01");

		expect(options.queryKey).toEqual(["work-types", "detail", "WT-01"]);
		expect(options.staleTime).toBe(STALE_TIMES.STANDARD);
		expect(typeof options.queryFn).toBe("function");
	});

	it("number ID でも正しく動作する", () => {
		const keys = createQueryKeys<number>("projects");
		const fetchDetail = async (_id: number) => ({ data: { id: 42, name: "test" } });

		const getOptions = createDetailQueryOptions({
			queryKeys: keys,
			fetchDetail,
		});

		const options = getOptions(42);
		expect(options.queryKey).toEqual(["projects", "detail", 42]);
	});

	it("staleTime をオーバーライドできる", () => {
		const keys = createQueryKeys<string>("work-types");
		const fetchDetail = async (_id: string) => ({ data: { code: "WT-01", name: "test" } });

		const getOptions = createDetailQueryOptions({
			queryKeys: keys,
			fetchDetail,
			staleTime: STALE_TIMES.LONG,
		});

		const options = getOptions("WT-01");
		expect(options.staleTime).toBe(STALE_TIMES.LONG);
	});
});

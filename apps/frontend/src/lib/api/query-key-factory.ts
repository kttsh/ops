import { queryOptions } from "@tanstack/react-query";
import { STALE_TIMES } from "./constants";
import type { PaginatedResponse, SingleResponse } from "./types";

// --- Query Key 型 ---

interface QueryKeys<TId extends string | number, TListParams> {
	all: readonly [string];
	lists: () => readonly [string, "list"];
	list: (params: TListParams) => readonly [string, "list", TListParams];
	details: () => readonly [string, "detail"];
	detail: (id: TId) => readonly [string, "detail", TId];
}

// --- Query Key ジェネレータ ---

export function createQueryKeys<
	TId extends string | number = string,
	TListParams = unknown,
>(
	resourceName: string,
): QueryKeys<TId, TListParams> {
	return {
		all: [resourceName] as const,
		lists: () => [resourceName, "list"] as const,
		list: (params: TListParams) => [resourceName, "list", params] as const,
		details: () => [resourceName, "detail"] as const,
		detail: (id: TId) => [resourceName, "detail", id] as const,
	};
}

// --- queryOptions ヘルパー ---

export function createListQueryOptions<TEntity, TListParams>(options: {
	queryKeys: QueryKeys<string | number, TListParams>;
	fetchList: (params: TListParams) => Promise<PaginatedResponse<TEntity>>;
	staleTime?: number;
}): (params: TListParams) => ReturnType<typeof queryOptions> {
	const { queryKeys, fetchList, staleTime = STALE_TIMES.STANDARD } = options;

	return (params: TListParams) =>
		queryOptions({
			queryKey: queryKeys.list(params),
			queryFn: () => fetchList(params),
			staleTime,
		});
}

export function createDetailQueryOptions<TEntity, TId extends string | number>(options: {
	queryKeys: QueryKeys<TId, unknown>;
	fetchDetail: (id: TId) => Promise<SingleResponse<TEntity>>;
	staleTime?: number;
}): (id: TId) => ReturnType<typeof queryOptions> {
	const { queryKeys, fetchDetail, staleTime = STALE_TIMES.STANDARD } = options;

	return (id: TId) =>
		queryOptions({
			queryKey: queryKeys.detail(id),
			queryFn: () => fetchDetail(id),
			staleTime,
		});
}

export type { QueryKeys };

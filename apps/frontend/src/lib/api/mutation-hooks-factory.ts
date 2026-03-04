import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BaseListParams, CrudClient } from "./crud-client-factory";
import type { QueryKeys } from "./query-key-factory";
import type { SingleResponse } from "./types";

// --- 設定型 ---

interface CrudMutationConfig<
	TEntity,
	TCreateInput,
	TUpdateInput,
	TId extends string | number,
	TListParams,
> {
	client: CrudClient<TEntity, TCreateInput, TUpdateInput, TId, BaseListParams>;
	queryKeys: QueryKeys<TId, TListParams>;
}

// --- 戻り値型 ---

interface CrudMutations<
	TEntity,
	TCreateInput,
	TUpdateInput,
	TId extends string | number,
> {
	useCreate: (options?: {
		onSuccess?: (data: SingleResponse<TEntity>) => void;
	}) => UseMutationResult<SingleResponse<TEntity>, Error, TCreateInput>;

	useUpdate: (
		id: TId,
		options?: {
			onSuccess?: (data: SingleResponse<TEntity>) => void;
		},
	) => UseMutationResult<SingleResponse<TEntity>, Error, TUpdateInput>;

	useDelete: (options?: {
		onSuccess?: () => void;
	}) => UseMutationResult<void, Error, TId>;

	useRestore: (options?: {
		onSuccess?: (data: SingleResponse<TEntity>) => void;
	}) => UseMutationResult<SingleResponse<TEntity>, Error, TId>;
}

// --- ファクトリ関数 ---

export function createCrudMutations<
	TEntity,
	TCreateInput,
	TUpdateInput,
	TId extends string | number,
	TListParams,
>(
	config: CrudMutationConfig<
		TEntity,
		TCreateInput,
		TUpdateInput,
		TId,
		TListParams
	>,
): CrudMutations<TEntity, TCreateInput, TUpdateInput, TId> {
	const { client, queryKeys } = config;

	return {
		useCreate(options?) {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: (input: TCreateInput) => client.create(input),
				onSuccess: (data) => {
					queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
					options?.onSuccess?.(data);
				},
			});
		},

		useUpdate(id: TId, options?) {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: (input: TUpdateInput) => client.update(id, input),
				onSuccess: (data) => {
					queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
					queryClient.invalidateQueries({ queryKey: queryKeys.detail(id) });
					options?.onSuccess?.(data);
				},
			});
		},

		useDelete(options?) {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: (id: TId) => client.delete(id),
				onSuccess: () => {
					queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
					options?.onSuccess?.();
				},
			});
		},

		useRestore(options?) {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: (id: TId) => client.restore(id),
				onSuccess: (data) => {
					queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
					options?.onSuccess?.(data);
				},
			});
		},
	};
}

export type { CrudMutationConfig, CrudMutations };

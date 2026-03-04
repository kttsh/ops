import { API_BASE_URL, handleResponse } from "./client";
import type { PaginatedResponse, SingleResponse } from "./types";

// --- 設定型 ---

interface BaseListParams {
	includeDisabled?: boolean;
	page?: number;
	pageSize?: number;
}

interface CrudClientConfig {
	resourcePath: string;
	paginated?: boolean;
}

// --- 戻り値型 ---

interface CrudClient<
	TEntity,
	TCreateInput,
	TUpdateInput,
	TId extends string | number,
	TListParams extends BaseListParams,
> {
	fetchList(params: TListParams): Promise<PaginatedResponse<TEntity>>;
	fetchDetail(id: TId): Promise<SingleResponse<TEntity>>;
	create(input: TCreateInput): Promise<SingleResponse<TEntity>>;
	update(id: TId, input: TUpdateInput): Promise<SingleResponse<TEntity>>;
	delete(id: TId): Promise<void>;
	restore(id: TId): Promise<SingleResponse<TEntity>>;
}

// --- ファクトリ関数 ---

export function createCrudClient<
	TEntity,
	TCreateInput,
	TUpdateInput,
	TId extends string | number = string,
	TListParams extends BaseListParams = BaseListParams,
>(
	config: CrudClientConfig,
): CrudClient<TEntity, TCreateInput, TUpdateInput, TId, TListParams> {
	const { resourcePath, paginated = false } = config;
	const baseUrl = `${API_BASE_URL}/${resourcePath}`;

	function buildIdUrl(id: TId): string {
		return `${baseUrl}/${encodeURIComponent(String(id))}`;
	}

	return {
		async fetchList(params: TListParams): Promise<PaginatedResponse<TEntity>> {
			const searchParams = new URLSearchParams();

			if (paginated && params.page != null && params.pageSize != null) {
				searchParams.set("page[number]", String(params.page));
				searchParams.set("page[size]", String(params.pageSize));
			}

			if (params.includeDisabled) {
				searchParams.set("filter[includeDisabled]", "true");
			}

			const query = searchParams.toString();
			const url = query ? `${baseUrl}?${query}` : baseUrl;
			const response = await fetch(url);
			return handleResponse<PaginatedResponse<TEntity>>(response);
		},

		async fetchDetail(id: TId): Promise<SingleResponse<TEntity>> {
			const response = await fetch(buildIdUrl(id));
			return handleResponse<SingleResponse<TEntity>>(response);
		},

		async create(input: TCreateInput): Promise<SingleResponse<TEntity>> {
			const response = await fetch(baseUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			});
			return handleResponse<SingleResponse<TEntity>>(response);
		},

		async update(
			id: TId,
			input: TUpdateInput,
		): Promise<SingleResponse<TEntity>> {
			const response = await fetch(buildIdUrl(id), {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			});
			return handleResponse<SingleResponse<TEntity>>(response);
		},

		async delete(id: TId): Promise<void> {
			const response = await fetch(buildIdUrl(id), {
				method: "DELETE",
			});
			return handleResponse<void>(response);
		},

		async restore(id: TId): Promise<SingleResponse<TEntity>> {
			const response = await fetch(`${buildIdUrl(id)}/actions/restore`, {
				method: "POST",
			});
			return handleResponse<SingleResponse<TEntity>>(response);
		},
	};
}

export type { BaseListParams, CrudClient, CrudClientConfig };

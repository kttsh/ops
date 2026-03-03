import type { Context } from "hono";

interface PaginationParams {
	page: number;
	pageSize: number;
}

interface PaginatedResult<T> {
	items: T[];
	totalCount: number;
}

interface PaginatedResponse<T> {
	data: T[];
	meta: {
		pagination: {
			currentPage: number;
			pageSize: number;
			totalItems: number;
			totalPages: number;
		};
	};
}

/**
 * ページネーション付きレスポンスオブジェクトを構築する。
 */
export function buildPaginatedResponse<T>(
	result: PaginatedResult<T>,
	params: PaginationParams,
): PaginatedResponse<T> {
	return {
		data: result.items,
		meta: {
			pagination: {
				currentPage: params.page,
				pageSize: params.pageSize,
				totalItems: result.totalCount,
				totalPages: Math.ceil(result.totalCount / params.pageSize),
			},
		},
	};
}

/**
 * リソース作成後の Location ヘッダーを設定する。
 */
export function setLocationHeader(
	c: Context,
	basePath: string,
	resourceId: string | number,
): void {
	c.header("Location", `${basePath}/${resourceId}`);
}

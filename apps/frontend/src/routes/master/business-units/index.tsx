import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { BusinessUnit } from "@/features/business-units";
import {
	ApiError,
	businessUnitSearchSchema,
	businessUnitsQueryOptions,
	useRestoreBusinessUnit,
} from "@/features/business-units";
import { createColumns } from "@/features/business-units/components/columns";
import { DataTable } from "@/components/shared/DataTable";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { RestoreConfirmDialog } from "@/components/shared/RestoreConfirmDialog";
export const Route = createFileRoute("/master/business-units/")({
	validateSearch: businessUnitSearchSchema,
	component: BusinessUnitListPage,
});

function BusinessUnitListPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const [restoreTarget, setRestoreTarget] = useState<string | null>(null);

	const { data, isLoading, isError, error } = useQuery(
		businessUnitsQueryOptions({
			page: search.page,
			pageSize: search.pageSize,
			includeDisabled: search.includeDisabled,
		}),
	);

	const restoreMutation = useRestoreBusinessUnit();

	const columns = useMemo(
		() =>
			createColumns({
				onRestore: search.includeDisabled
					? (code) => setRestoreTarget(code)
					: undefined,
			}),
		[search.includeDisabled],
	);

	const handleSearchChange = (value: string) => {
		navigate({ search: (prev) => ({ ...prev, search: value, page: 1 }) });
	};

	const handleIncludeDisabledChange = (value: boolean) => {
		navigate({
			search: (prev) => ({ ...prev, includeDisabled: value, page: 1 }),
		});
	};

	const handlePageChange = (page: number) => {
		navigate({ search: (prev) => ({ ...prev, page }) });
	};

	const handlePageSizeChange = (pageSize: number) => {
		navigate({ search: (prev) => ({ ...prev, pageSize, page: 1 }) });
	};

	const handleRestore = async () => {
		if (!restoreTarget) return;
		try {
			await restoreMutation.mutateAsync(restoreTarget);
			toast.success("復元しました");
			setRestoreTarget(null);
		} catch (err) {
			if (err instanceof ApiError) {
				toast.error(err.message, { duration: Infinity });
			}
			setRestoreTarget(null);
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold tracking-tight">ビジネスユニット</h2>
				<p className="text-sm text-muted-foreground mt-1">
					ビジネスユニットの一覧を管理します
				</p>
			</div>

			<DataTableToolbar
				search={search.search}
				onSearchChange={handleSearchChange}
				includeDisabled={search.includeDisabled}
				onIncludeDisabledChange={handleIncludeDisabledChange}
				newItemHref="/master/business-units/new"
			/>

			<DataTable
				columns={columns}
				data={data?.data ?? []}
				globalFilter={search.search}
				pagination={{
					currentPage: search.page,
					pageSize: search.pageSize,
					totalItems: data?.meta.pagination.totalItems ?? 0,
					totalPages: data?.meta.pagination.totalPages ?? 0,
				}}
				onPageChange={handlePageChange}
				onPageSizeChange={handlePageSizeChange}
				isLoading={isLoading}
				isError={isError}
				errorMessage={error?.message}
				rowClassName={(row: BusinessUnit) =>
					row.deletedAt ? "opacity-50" : ""
				}
			/>

			<RestoreConfirmDialog
				open={!!restoreTarget}
				onOpenChange={(open) => !open && setRestoreTarget(null)}
				onConfirm={handleRestore}
				entityLabel="ビジネスユニット"
				isLoading={restoreMutation.isPending}
			/>
		</div>
	);
}

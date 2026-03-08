import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import type { BusinessUnit } from "@/features/business-units";
import {
	businessUnitKeys,
	businessUnitSearchSchema,
	businessUnitsQueryOptions,
} from "@/features/business-units";
import { BusinessUnitDetailSheet } from "@/features/business-units/components/BusinessUnitDetailSheet";
import { createColumns } from "@/features/business-units/components/columns";
import { useMasterSheet } from "@/hooks/useMasterSheet";

export const Route = createFileRoute("/master/business-units/")({
	validateSearch: businessUnitSearchSchema,
	component: BusinessUnitListPage,
});

function BusinessUnitListPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const queryClient = useQueryClient();
	const sheet = useMasterSheet<BusinessUnit>();

	const { data, isLoading, isError, error } = useQuery(
		businessUnitsQueryOptions({
			page: search.page,
			pageSize: search.pageSize,
			includeDisabled: search.includeDisabled,
		}),
	);

	const columns = useMemo(
		() =>
			createColumns({
				onRestore: search.includeDisabled
					? (code) => {
							const entity = data?.data?.find(
								(bu) => bu.businessUnitCode === code,
							);
							if (entity) sheet.openView(entity);
						}
					: undefined,
			}),
		[search.includeDisabled, data?.data, sheet.openView],
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

	const handleMutationSuccess = () => {
		queryClient.invalidateQueries({ queryKey: businessUnitKeys.lists() });
	};

	const handleSheetOpenChange = (open: boolean) => {
		if (!open) sheet.close();
	};

	return (
		<div className="flex h-full flex-col">
			{/* ヘッダー */}
			<div className="flex items-center justify-between border-b border-border px-4 py-2">
				<h1 className="text-lg font-semibold">ビジネスユニット</h1>
			</div>

			{/* メインコンテンツ */}
			<div className="flex-1 overflow-auto p-4">
				<div className="rounded-xl bg-card border border-border shadow-sm p-4">
					<div className="space-y-4">
						<DataTableToolbar
							search={search.search}
							onSearchChange={handleSearchChange}
							includeDisabled={search.includeDisabled}
							onIncludeDisabledChange={handleIncludeDisabledChange}
							onNewItemClick={sheet.openCreate}
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
							onRowClick={(row: BusinessUnit) => sheet.openView(row)}
							isLoading={isLoading}
							isError={isError}
							errorMessage={error?.message}
							rowClassName={(row: BusinessUnit) =>
								row.deletedAt ? "opacity-50" : ""
							}
						/>
					</div>
				</div>
			</div>

			<BusinessUnitDetailSheet
				sheetState={sheet.state}
				isOpen={sheet.isOpen}
				onOpenChange={handleSheetOpenChange}
				openEdit={sheet.switchToEdit}
				openView={sheet.switchToView}
				close={sheet.close}
				onMutationSuccess={handleMutationSuccess}
			/>
		</div>
	);
}

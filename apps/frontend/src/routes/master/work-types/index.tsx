import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import type { WorkType } from "@/features/work-types";
import {
	workTypeKeys,
	workTypeSearchSchema,
	workTypesQueryOptions,
} from "@/features/work-types";
import { createColumns } from "@/features/work-types/components/columns";
import { WorkTypeDetailSheet } from "@/features/work-types/components/WorkTypeDetailSheet";
import { useMasterSheet } from "@/hooks/useMasterSheet";

export const Route = createFileRoute("/master/work-types/")({
	validateSearch: workTypeSearchSchema,
	component: WorkTypeListPage,
});

function WorkTypeListPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const queryClient = useQueryClient();
	const sheet = useMasterSheet<WorkType>();

	const { data, isLoading, isError, error } = useQuery(
		workTypesQueryOptions({
			includeDisabled: search.includeDisabled,
		}),
	);

	const columns = useMemo(
		() =>
			createColumns({
				onRestore: search.includeDisabled
					? (code) => {
							const entity = data?.data?.find((wt) => wt.workTypeCode === code);
							if (entity) sheet.openView(entity);
						}
					: undefined,
			}),
		[search.includeDisabled, data?.data, sheet.openView],
	);

	const handleSearchChange = (value: string) => {
		navigate({ search: (prev) => ({ ...prev, search: value }) });
	};

	const handleIncludeDisabledChange = (value: boolean) => {
		navigate({ search: (prev) => ({ ...prev, includeDisabled: value }) });
	};

	const handleMutationSuccess = () => {
		queryClient.invalidateQueries({ queryKey: workTypeKeys.lists() });
	};

	const handleSheetOpenChange = (open: boolean) => {
		if (!open) sheet.close();
	};

	return (
		<div className="flex h-full flex-col">
			{/* ヘッダー */}
			<div className="flex items-center justify-between border-b border-border px-4 py-2">
				<h1 className="text-lg font-semibold">作業種類</h1>
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
							onRowClick={(row: WorkType) => sheet.openView(row)}
							isLoading={isLoading}
							isError={isError}
							errorMessage={error?.message}
							rowClassName={(row: WorkType) =>
								row.deletedAt ? "opacity-50" : ""
							}
						/>
					</div>
				</div>
			</div>

			<WorkTypeDetailSheet
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

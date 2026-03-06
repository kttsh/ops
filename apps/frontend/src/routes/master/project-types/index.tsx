import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { PageHeader } from "@/components/shared/PageHeader";
import type { ProjectType } from "@/features/project-types";
import {
	projectTypeKeys,
	projectTypeSearchSchema,
	projectTypesQueryOptions,
} from "@/features/project-types";
import { createColumns } from "@/features/project-types/components/columns";
import { ProjectTypeDetailSheet } from "@/features/project-types/components/ProjectTypeDetailSheet";
import { useMasterSheet } from "@/hooks/useMasterSheet";

export const Route = createFileRoute("/master/project-types/")({
	validateSearch: projectTypeSearchSchema,
	component: ProjectTypeListPage,
});

function ProjectTypeListPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const queryClient = useQueryClient();
	const sheet = useMasterSheet<ProjectType>();

	const { data, isLoading, isError, error } = useQuery(
		projectTypesQueryOptions({
			includeDisabled: search.includeDisabled,
		}),
	);

	const columns = useMemo(
		() =>
			createColumns({
				onRestore: search.includeDisabled
					? (code) => {
							const entity = data?.data?.find(
								(pt) => pt.projectTypeCode === code,
							);
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
		queryClient.invalidateQueries({ queryKey: projectTypeKeys.lists() });
	};

	const handleSheetOpenChange = (open: boolean) => {
		if (!open) sheet.close();
	};

	return (
		<div className="grid grid-cols-1 gap-6">
			<PageHeader
				title="案件タイプ"
				description="案件タイプの一覧を管理します"
			/>

			<div className="rounded-3xl bg-card border border-border shadow-sm p-6">
				<div className="space-y-6">
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
						onRowClick={(row: ProjectType) => sheet.openView(row)}
						isLoading={isLoading}
						isError={isError}
						errorMessage={error?.message}
						rowClassName={(row: ProjectType) =>
							row.deletedAt ? "opacity-50" : ""
						}
					/>
				</div>
			</div>

			<ProjectTypeDetailSheet
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

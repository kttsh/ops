import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { DataTable } from "@/components/shared/DataTable";
import type { Project } from "@/features/projects";
import {
	ApiError,
	projectSearchSchema,
	projectsQueryOptions,
	useRestoreProject,
} from "@/features/projects";
import { createColumns } from "@/features/projects/components/columns";
import { RestoreConfirmDialog } from "@/components/shared/RestoreConfirmDialog";

export const Route = createFileRoute("/master/projects/")({
	validateSearch: projectSearchSchema,
	component: ProjectListPage,
});

function ProjectListPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const [restoreTarget, setRestoreTarget] = useState<number | null>(null);

	const { data, isLoading, isError, error } = useQuery(
		projectsQueryOptions({
			page: search.page,
			pageSize: search.pageSize,
			includeDisabled: search.includeDisabled,
		}),
	);

	const restoreMutation = useRestoreProject();

	const columns = useMemo(
		() =>
			createColumns({
				onRestore: search.includeDisabled
					? (id) => setRestoreTarget(id)
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
		if (restoreTarget === null) return;
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
				<h2 className="text-2xl font-bold tracking-tight">案件</h2>
				<p className="text-sm text-muted-foreground mt-1">
					案件の一覧を管理します
				</p>
			</div>

			<DataTableToolbar
				search={search.search}
				onSearchChange={handleSearchChange}
				includeDisabled={search.includeDisabled}
				onIncludeDisabledChange={handleIncludeDisabledChange}
				newItemHref="/master/projects/new"
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
				rowClassName={(row: Project) => (row.deletedAt ? "opacity-50" : "")}
			/>

			<RestoreConfirmDialog
				open={restoreTarget !== null}
				onOpenChange={(open) => !open && setRestoreTarget(null)}
				onConfirm={handleRestore}
				entityLabel="案件"
				isLoading={restoreMutation.isPending}
			/>
		</div>
	);
}

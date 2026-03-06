import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Loader2, Upload } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { ExcelImportDialog } from "@/components/shared/ExcelImportDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { RestoreConfirmDialog } from "@/components/shared/RestoreConfirmDialog";
import { Button } from "@/components/ui/button";
import type { Project } from "@/features/projects";
import {
	ApiError,
	projectQueryOptions,
	projectSearchSchema,
	projectsQueryOptions,
	useProjectBulkExport,
	useProjectBulkImport,
	useRestoreProject,
} from "@/features/projects";
import { createColumns } from "@/features/projects/components/columns";

export const Route = createFileRoute("/master/projects/")({
	validateSearch: projectSearchSchema,
	component: ProjectListPage,
});

function ProjectListPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const queryClient = useQueryClient();
	const [restoreTarget, setRestoreTarget] = useState<number | null>(null);
	const [importDialogOpen, setImportDialogOpen] = useState(false);
	const { exportToExcel, isExporting } = useProjectBulkExport();
	const { parseFile, confirmImport, isImporting } = useProjectBulkImport();

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

	const handleRowHover = useCallback(
		(row: Project) => {
			queryClient.ensureQueryData(projectQueryOptions(row.projectId));
		},
		[queryClient],
	);

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
		<div className="grid grid-cols-1 gap-6">
			<PageHeader title="案件" description="案件の一覧を管理します" />

			<div className="rounded-3xl bg-card border border-border shadow-sm p-6">
				<div className="space-y-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex-1">
							<DataTableToolbar
								search={search.search}
								onSearchChange={handleSearchChange}
								includeDisabled={search.includeDisabled}
								onIncludeDisabledChange={handleIncludeDisabledChange}
								newItemHref="/master/projects/new"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={exportToExcel}
								disabled={isExporting}
							>
								{isExporting ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Download className="h-4 w-4" />
								)}
								エクスポート
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setImportDialogOpen(true)}
							>
								<Upload className="h-4 w-4" />
								インポート
							</Button>
						</div>
					</div>

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
						onRowClick={(row: Project) =>
							navigate({
								to: "/master/projects/$projectId",
								params: { projectId: String(row.projectId) },
							})
						}
						onRowHover={handleRowHover}
						isLoading={isLoading}
						isError={isError}
						errorMessage={error?.message}
						rowClassName={(row: Project) => (row.deletedAt ? "opacity-50" : "")}
					/>
				</div>
			</div>

			<ExcelImportDialog
				open={importDialogOpen}
				onOpenChange={setImportDialogOpen}
				title="案件工数 一括インポート"
				description="エクスポートしたExcelファイルを編集し、工数データを一括更新します。"
				onFileParsed={parseFile}
				onConfirm={confirmImport}
				isImporting={isImporting}
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

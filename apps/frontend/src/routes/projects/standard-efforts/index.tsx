import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Loader2, Upload } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { ExcelImportDialog } from "@/components/shared/ExcelImportDialog";
import { FieldWrapper } from "@/components/shared/FieldWrapper";
import { PageHeader } from "@/components/shared/PageHeader";
import { QuerySelect } from "@/components/shared/QuerySelect";
import { RestoreConfirmDialog } from "@/components/shared/RestoreConfirmDialog";
import { Button } from "@/components/ui/button";
import type { StandardEffortMaster } from "@/features/standard-effort-masters";
import {
	ApiError,
	businessUnitsForSelectQueryOptions,
	createColumns,
	projectTypesForSelectQueryOptions,
	standardEffortMasterQueryOptions,
	standardEffortMasterSearchSchema,
	standardEffortMastersQueryOptions,
	useRestoreStandardEffortMaster,
	useStandardEffortBulkExport,
	useStandardEffortBulkImport,
} from "@/features/standard-effort-masters";

export const Route = createFileRoute("/projects/standard-efforts/")({
	validateSearch: standardEffortMasterSearchSchema,
	component: StandardEffortMasterListPage,
});

function StandardEffortMasterListPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const queryClient = useQueryClient();
	const [restoreTarget, setRestoreTarget] = useState<number | null>(null);
	const [importDialogOpen, setImportDialogOpen] = useState(false);
	const { exportToExcel, isExporting } = useStandardEffortBulkExport();
	const { parseFile, confirmImport, isImporting } =
		useStandardEffortBulkImport();

	const buQuery = useQuery(businessUnitsForSelectQueryOptions());
	const ptQuery = useQuery(projectTypesForSelectQueryOptions());

	const { data, isLoading, isError, error } = useQuery(
		standardEffortMastersQueryOptions({
			page: search.page,
			pageSize: search.pageSize,
			includeDisabled: search.includeDisabled,
			businessUnitCode: search.businessUnitCode,
			projectTypeCode: search.projectTypeCode,
		}),
	)

	const restoreMutation = useRestoreStandardEffortMaster();

	const buNameMap = useMemo(() => {
		const map = new Map<string, string>();
		if (buQuery.data) {
			for (const bu of buQuery.data) {
				map.set(bu.value, bu.label);
			}
		}
		return map;
	}, [buQuery.data]);

	const ptNameMap = useMemo(() => {
		const map = new Map<string, string>();
		if (ptQuery.data) {
			for (const pt of ptQuery.data) {
				map.set(pt.value, pt.label);
			}
		}
		return map;
	}, [ptQuery.data]);

	const columns = useMemo(
		() =>
			createColumns({
				onRestore: search.includeDisabled
					? (id) => setRestoreTarget(id)
					: undefined,
				buNameMap,
				ptNameMap,
			}),
		[search.includeDisabled, buNameMap, ptNameMap],
	)

	const handleSearchChange = (value: string) => {
		navigate({ search: (prev) => ({ ...prev, search: value, page: 1 }) });
	}

	const handleIncludeDisabledChange = (value: boolean) => {
		navigate({
			search: (prev) => ({ ...prev, includeDisabled: value, page: 1 }),
		})
	}

	const handlePageChange = (page: number) => {
		navigate({ search: (prev) => ({ ...prev, page }) });
	}

	const handlePageSizeChange = (pageSize: number) => {
		navigate({ search: (prev) => ({ ...prev, pageSize, page: 1 }) });
	}

	const handleBuFilterChange = (value: string) => {
		navigate({
			search: (prev) => ({ ...prev, businessUnitCode: value, page: 1 }),
		})
	}

	const handlePtFilterChange = (value: string) => {
		navigate({
			search: (prev) => ({ ...prev, projectTypeCode: value, page: 1 }),
		})
	}

	const handleRowHover = useCallback(
		(row: StandardEffortMaster) => {
			queryClient.ensureQueryData(
				standardEffortMasterQueryOptions(row.standardEffortId),
			)
		},
		[queryClient],
	)

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
	}

	return (
		<div className="grid grid-cols-1 gap-6">
			<PageHeader
				title="標準工数パターン"
				description="標準工数パターンの一覧を管理します"
			/>

			<div className="rounded-3xl bg-card border border-border shadow-sm p-6">
				<div className="space-y-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
						<div className="flex-1">
							<DataTableToolbar
								search={search.search}
								onSearchChange={handleSearchChange}
								includeDisabled={search.includeDisabled}
								onIncludeDisabledChange={handleIncludeDisabledChange}
								newItemHref="/projects/standard-efforts/new"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									exportToExcel(search.businessUnitCode || undefined)
								}
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

					{/* BU/PT フィルタ */}
					<div className="flex flex-wrap gap-4">
						<div className="w-48">
							<FieldWrapper label="事業部フィルタ">
								<QuerySelect
									value={search.businessUnitCode}
									onValueChange={handleBuFilterChange}
									placeholder="すべて"
									queryResult={buQuery}
									allowEmpty
									emptyLabel="すべて"
								/>
							</FieldWrapper>
						</div>
						<div className="w-48">
							<FieldWrapper label="案件タイプフィルタ">
								<QuerySelect
									value={search.projectTypeCode}
									onValueChange={handlePtFilterChange}
									placeholder="すべて"
									queryResult={ptQuery}
									allowEmpty
									emptyLabel="すべて"
								/>
							</FieldWrapper>
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
						onRowClick={(row: StandardEffortMaster) =>
							navigate({
								to: "/projects/standard-efforts/$standardEffortId",
								params: {
									standardEffortId: String(row.standardEffortId),
								},
							})
						}
						onRowHover={handleRowHover}
						isLoading={isLoading}
						isError={isError}
						errorMessage={error?.message}
						rowClassName={(row: StandardEffortMaster) =>
							row.deletedAt ? "opacity-50" : ""
						}
					/>
				</div>
			</div>

			<ExcelImportDialog
				open={importDialogOpen}
				onOpenChange={setImportDialogOpen}
				title="標準工数パターン 一括インポート"
				description="エクスポートしたExcelファイルを編集し、重みデータを一括更新します。"
				onFileParsed={parseFile}
				onConfirm={confirmImport}
				isImporting={isImporting}
			/>

			<RestoreConfirmDialog
				open={restoreTarget !== null}
				onOpenChange={(open) => !open && setRestoreTarget(null)}
				onConfirm={handleRestore}
				entityLabel="標準工数パターン"
				isLoading={restoreMutation.isPending}
			/>
		</div>
	)
}

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { ProjectType } from "@/features/project-types";
import {
	ApiError,
	projectTypeSearchSchema,
	projectTypesQueryOptions,
	useRestoreProjectType,
} from "@/features/project-types";
import { createColumns } from "@/features/project-types/components/columns";
import { DataTable } from "@/components/shared/DataTable";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { PageHeader } from "@/components/shared/PageHeader";
import { RestoreConfirmDialog } from "@/components/shared/RestoreConfirmDialog";

export const Route = createFileRoute("/master/project-types/")({
	validateSearch: projectTypeSearchSchema,
	component: ProjectTypeListPage,
});

function ProjectTypeListPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const [restoreTarget, setRestoreTarget] = useState<string | null>(null);

	const { data, isLoading, isError, error } = useQuery(
		projectTypesQueryOptions({
			includeDisabled: search.includeDisabled,
		}),
	);

	const restoreMutation = useRestoreProjectType();

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
		navigate({ search: (prev) => ({ ...prev, search: value }) });
	};

	const handleIncludeDisabledChange = (value: boolean) => {
		navigate({ search: (prev) => ({ ...prev, includeDisabled: value }) });
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
			<PageHeader title="案件タイプ" description="案件タイプの一覧を管理します" />

			<DataTableToolbar
				search={search.search}
				onSearchChange={handleSearchChange}
				includeDisabled={search.includeDisabled}
				onIncludeDisabledChange={handleIncludeDisabledChange}
				newItemHref="/master/project-types/new"
			/>

			<DataTable
				columns={columns}
				data={data?.data ?? []}
				globalFilter={search.search}
				onRowClick={(row: ProjectType) =>
					navigate({
						to: "/master/project-types/$projectTypeCode",
						params: { projectTypeCode: row.projectTypeCode },
					})
				}
				isLoading={isLoading}
				isError={isError}
				errorMessage={error?.message}
				rowClassName={(row: ProjectType) => (row.deletedAt ? "opacity-50" : "")}
			/>

			<RestoreConfirmDialog
				open={!!restoreTarget}
				onOpenChange={(open) => !open && setRestoreTarget(null)}
				onConfirm={handleRestore}
				entityLabel="案件タイプ"
				isLoading={restoreMutation.isPending}
			/>
		</div>
	);
}

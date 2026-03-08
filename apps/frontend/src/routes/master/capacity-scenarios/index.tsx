import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { z } from "zod";
import {
	createDateTimeColumn,
	createRestoreActionColumn,
	createSortableColumn,
	createStatusColumn,
} from "@/components/shared/column-helpers";
import { DataTable } from "@/components/shared/DataTable";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { SortableHeader } from "@/components/shared/SortableHeader";
import { Badge } from "@/components/ui/badge";
import type { CapacityScenario } from "@/features/indirect-case-study";
import {
	capacityScenariosQueryOptions,
	indirectCaseStudyKeys,
} from "@/features/indirect-case-study";
import { CapacityScenarioDetailSheet } from "@/features/indirect-case-study/components/CapacityScenarioDetailSheet";
import { useMasterSheet } from "@/hooks/useMasterSheet";

const capacityScenarioSearchSchema = z.object({
	search: z.string().catch("").default(""),
	includeDisabled: z.boolean().catch(false).default(false),
});

export const Route = createFileRoute("/master/capacity-scenarios/")({
	validateSearch: capacityScenarioSearchSchema,
	component: CapacityScenariosPage,
});

function createColumns(options?: {
	onRestore?: (id: number) => void;
}): ColumnDef<CapacityScenario>[] {
	return [
		createSortableColumn<CapacityScenario>({
			accessorKey: "scenarioName",
			label: "名前",
		}),
		{
			accessorKey: "hoursPerPerson",
			header: ({ column }) => (
				<SortableHeader column={column} label="稼働時間/人" />
			),
			cell: ({ row }) => (
				<span className="tabular-nums">
					{row.original.hoursPerPerson} 時間/人
				</span>
			),
		},
		{
			id: "isPrimary",
			header: "プライマリ",
			cell: ({ row }) =>
				row.original.isPrimary ? (
					<Badge variant="secondary">Primary</Badge>
				) : null,
		},
		createStatusColumn<CapacityScenario>(),
		createDateTimeColumn<CapacityScenario>({
			accessorKey: "updatedAt",
			label: "更新日時",
		}),
		createRestoreActionColumn<CapacityScenario, number>({
			idKey: "capacityScenarioId",
			onRestore: options?.onRestore,
		}),
	];
}

function CapacityScenariosPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const queryClient = useQueryClient();
	const sheet = useMasterSheet<CapacityScenario>();

	const { data, isLoading, isError, error } = useQuery(
		capacityScenariosQueryOptions({
			includeDisabled: search.includeDisabled,
		}),
	);

	const columns = useMemo(
		() =>
			createColumns({
				onRestore: search.includeDisabled
					? (id) => {
							const entity = data?.data?.find(
								(s) => s.capacityScenarioId === id,
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
		queryClient.invalidateQueries({
			queryKey: indirectCaseStudyKeys.capacityScenarios(),
		});
	};

	const handleSheetOpenChange = (open: boolean) => {
		if (!open) sheet.close();
	};

	return (
		<div className="flex h-full flex-col">
			{/* ヘッダー */}
			<div className="flex items-center justify-between border-b border-border px-4 py-2">
				<h1 className="text-lg font-semibold">稼働時間</h1>
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
							onRowClick={(row: CapacityScenario) => sheet.openView(row)}
							isLoading={isLoading}
							isError={isError}
							errorMessage={error?.message}
							rowClassName={(row: CapacityScenario) =>
								row.deletedAt ? "opacity-50" : ""
							}
						/>
					</div>
				</div>
			</div>

			<CapacityScenarioDetailSheet
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

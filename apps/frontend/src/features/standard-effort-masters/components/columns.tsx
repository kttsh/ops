import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
	createDateTimeColumn,
	createRestoreActionColumn,
	createStatusColumn,
} from "@/components/shared/column-helpers";
import { SortableHeader } from "@/components/shared/SortableHeader";
import type { StandardEffortMaster } from "@/features/standard-effort-masters/types";

export function createColumns(options: {
	onRestore?: (id: number) => void;
	buNameMap: Map<string, string>;
	ptNameMap: Map<string, string>;
}): ColumnDef<StandardEffortMaster>[] {
	return [
		{
			accessorKey: "name",
			minSize: 320,
			header: ({ column }) => (
				<SortableHeader column={column} label="パターン名" />
			),
			cell: ({ row }) => (
				<Link
					to="/master/standard-effort-masters/$standardEffortId"
					params={{
						standardEffortId: String(row.original.standardEffortId),
					}}
					className="font-medium text-primary hover:underline"
				>
					{row.original.name}
				</Link>
			),
		},
		{
			id: "businessUnitName",
			header: ({ column }) => (
				<SortableHeader column={column} label="事業部" />
			),
			accessorFn: (row) =>
				options.buNameMap.get(row.businessUnitCode) ??
				row.businessUnitCode,
		},
		{
			id: "projectTypeName",
			header: ({ column }) => (
				<SortableHeader column={column} label="案件タイプ" />
			),
			accessorFn: (row) =>
				options.ptNameMap.get(row.projectTypeCode) ??
				row.projectTypeCode,
		},
		createStatusColumn<StandardEffortMaster>(),
		createDateTimeColumn<StandardEffortMaster>({
			accessorKey: "updatedAt",
			label: "更新日時",
		}),
		createRestoreActionColumn<StandardEffortMaster, number>({
			idKey: "standardEffortId",
			onRestore: options.onRestore,
		}),
	];
}

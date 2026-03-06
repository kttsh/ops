import type { ColumnDef } from "@tanstack/react-table";
import {
	createDateTimeColumn,
	createRestoreActionColumn,
	createSortableColumn,
	createStatusColumn,
} from "@/components/shared/column-helpers";
import { SortableHeader } from "@/components/shared/SortableHeader";
import type { ProjectType } from "@/features/project-types/types";

export function createColumns(options: {
	onRestore?: (code: string) => void;
}): ColumnDef<ProjectType>[] {
	return [
		{
			accessorKey: "projectTypeCode",
			header: ({ column }) => <SortableHeader column={column} label="コード" />,
			cell: ({ row }) => (
				<span className="font-medium">{row.original.projectTypeCode}</span>
			),
		},
		createSortableColumn<ProjectType>({ accessorKey: "name", label: "名称" }),
		createSortableColumn<ProjectType>({
			accessorKey: "displayOrder",
			label: "表示順",
		}),
		createStatusColumn<ProjectType>(),
		createDateTimeColumn<ProjectType>({
			accessorKey: "updatedAt",
			label: "更新日時",
		}),
		createRestoreActionColumn<ProjectType, string>({
			idKey: "projectTypeCode",
			onRestore: options.onRestore,
		}),
	];
}

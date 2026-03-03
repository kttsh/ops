import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/components/shared/SortableHeader";
import {
	createDateTimeColumn,
	createRestoreActionColumn,
	createSortableColumn,
	createStatusColumn,
} from "@/components/shared/column-helpers";
import type { WorkType } from "@/features/work-types/types";

export function createColumns(options: {
	onRestore?: (code: string) => void;
}): ColumnDef<WorkType>[] {
	return [
		{
			accessorKey: "workTypeCode",
			header: ({ column }) => <SortableHeader column={column} label="コード" />,
			cell: ({ row }) => (
				<Link
					to="/master/work-types/$workTypeCode"
					params={{ workTypeCode: row.original.workTypeCode }}
					className="font-medium text-primary hover:underline"
				>
					{row.original.workTypeCode}
				</Link>
			),
		},
		createSortableColumn<WorkType>({ accessorKey: "name", label: "名称" }),
		{
			accessorKey: "color",
			header: "カラー",
			cell: ({ row }) => {
				const color = row.original.color;
				if (!color) return <span className="text-muted-foreground">-</span>;
				return (
					<div className="flex items-center gap-2">
						<div
							className="w-6 h-6 rounded-full border border-border"
							style={{ backgroundColor: color }}
						/>
						<span className="text-sm text-muted-foreground">{color}</span>
					</div>
				);
			},
		},
		createSortableColumn<WorkType>({ accessorKey: "displayOrder", label: "表示順" }),
		createStatusColumn<WorkType>(),
		createDateTimeColumn<WorkType>({ accessorKey: "updatedAt", label: "更新日時" }),
		createRestoreActionColumn<WorkType, string>({
			idKey: "workTypeCode",
			onRestore: options.onRestore,
		}),
	];
}

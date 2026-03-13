import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
	createDateTimeColumn,
	createRestoreActionColumn,
} from "@/components/shared/column-helpers";
import { SortableHeader } from "@/components/shared/SortableHeader";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/features/projects/types";
import { PROJECT_STATUSES } from "@/features/projects/types";

function formatYearMonth(ym: string) {
	if (ym.length !== 6) return ym;
	return `${ym.slice(0, 4)}/${ym.slice(4, 6)}`;
}

function getStatusLabel(value: string) {
	const v = value.toLowerCase();
	const status = PROJECT_STATUSES.find((s) => s.value === v);
	return status?.label ?? value;
}

export function createColumns(options: {
	onRestore?: (id: number) => void;
}): ColumnDef<Project>[] {
	return [
		{
			accessorKey: "name",
			minSize: 320,
			header: ({ column }) => <SortableHeader column={column} label="名称" />,
			cell: ({ row }) => (
				<Link
					to="/projects/$projectId"
					params={{ projectId: String(row.original.projectId) }}
					className="font-medium text-primary hover:underline"
				>
					{row.original.name}
				</Link>
			),
		},
		{
			accessorKey: "businessUnitName",
			header: ({ column }) => <SortableHeader column={column} label="事業部" />,
		},
		{
			accessorKey: "projectTypeName",
			header: ({ column }) => <SortableHeader column={column} label="種別" />,
			cell: ({ row }) => row.original.projectTypeName ?? "—",
		},
		{
			accessorKey: "fiscalYear",
			header: ({ column }) => <SortableHeader column={column} label="年度" />,
			cell: ({ row }) => row.original.fiscalYear ?? "—",
		},
		{
			accessorKey: "customerName",
			header: ({ column }) => <SortableHeader column={column} label="客先名" />,
			cell: ({ row }) => row.original.customerName ?? "—",
		},
		{
			accessorKey: "orderNumber",
			header: ({ column }) => (
				<SortableHeader column={column} label="オーダー番号" />
			),
			cell: ({ row }) => row.original.orderNumber ?? "—",
		},
		{
			accessorKey: "startYearMonth",
			header: ({ column }) => (
				<SortableHeader column={column} label="開始年月" />
			),
			cell: ({ row }) => formatYearMonth(row.original.startYearMonth),
		},
		{
			accessorKey: "totalManhour",
			header: ({ column }) => (
				<div className="flex justify-end">
					<SortableHeader column={column} label="総工数" className="h-8" />
				</div>
			),
			cell: ({ row }) => (
				<div className="text-right">
					{row.original.totalManhour?.toLocaleString("ja-JP") ?? "—"}
				</div>
			),
		},
		{
			accessorKey: "status",
			header: "ステータス",
			cell: ({ row }) => {
				const value = row.original.status;
				const label = getStatusLabel(value);
				const v = value.toLowerCase();
				const variant =
					v === "confirmed"
						? "success"
						: v === "planning"
							? "default"
							: "secondary";
				return <Badge variant={variant}>{label}</Badge>;
			},
		},
		createDateTimeColumn<Project>({
			accessorKey: "updatedAt",
			label: "更新日時",
		}),
		createRestoreActionColumn<Project, number>({
			idKey: "projectId",
			onRestore: options.onRestore,
		}),
	];
}

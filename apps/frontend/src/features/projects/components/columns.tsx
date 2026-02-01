import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Project } from "@/features/projects/types";
import { PROJECT_STATUSES } from "@/features/projects/types";

function formatDateTime(dateStr: string) {
	return new Date(dateStr).toLocaleString("ja-JP", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

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
			header: ({ column }) => (
				<Button
					variant="ghost"
					size="sm"
					className="-ml-3 h-8"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					名称
					<ArrowUpDown className="ml-1 h-3 w-3" />
				</Button>
			),
			cell: ({ row }) => (
				<Link
					to="/master/projects/$projectId"
					params={{ projectId: String(row.original.projectId) }}
					className="font-medium text-primary hover:underline"
				>
					{row.original.name}
				</Link>
			),
		},
		{
			accessorKey: "businessUnitName",
			header: ({ column }) => (
				<Button
					variant="ghost"
					size="sm"
					className="-ml-3 h-8"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					事業部
					<ArrowUpDown className="ml-1 h-3 w-3" />
				</Button>
			),
		},
		{
			accessorKey: "projectTypeName",
			header: ({ column }) => (
				<Button
					variant="ghost"
					size="sm"
					className="-ml-3 h-8"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					種別
					<ArrowUpDown className="ml-1 h-3 w-3" />
				</Button>
			),
			cell: ({ row }) => row.original.projectTypeName ?? "—",
		},
		{
			accessorKey: "startYearMonth",
			header: ({ column }) => (
				<Button
					variant="ghost"
					size="sm"
					className="-ml-3 h-8"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					開始年月
					<ArrowUpDown className="ml-1 h-3 w-3" />
				</Button>
			),
			cell: ({ row }) => formatYearMonth(row.original.startYearMonth),
		},
		{
			accessorKey: "totalManhour",
			header: ({ column }) => (
				<div className="flex justify-end">
					<Button
						variant="ghost"
						size="sm"
						className="h-8"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						総工数
						<ArrowUpDown className="ml-1 h-3 w-3" />
					</Button>
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
		{
			accessorKey: "updatedAt",
			header: ({ column }) => (
				<Button
					variant="ghost"
					size="sm"
					className="-ml-3 h-8"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					更新日時
					<ArrowUpDown className="ml-1 h-3 w-3" />
				</Button>
			),
			cell: ({ row }) => formatDateTime(row.original.updatedAt),
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const isDeleted = !!row.original.deletedAt;
				if (!isDeleted || !options.onRestore) return null;
				return (
					<Button
						variant="outline"
						size="sm"
						onClick={(e) => {
							e.stopPropagation();
							options.onRestore!(row.original.projectId);
						}}
					>
						復元
					</Button>
				);
			},
		},
	];
}

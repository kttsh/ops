import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SortableHeader } from "@/components/shared/SortableHeader";
import type { WorkType } from "@/features/work-types/types";

function formatDateTime(dateStr: string) {
	return new Date(dateStr).toLocaleString("ja-JP", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

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
		{
			accessorKey: "name",
			header: ({ column }) => <SortableHeader column={column} label="名称" />,
		},
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
		{
			accessorKey: "displayOrder",
			header: ({ column }) => <SortableHeader column={column} label="表示順" />,
		},
		{
			id: "status",
			header: "ステータス",
			cell: ({ row }) => {
				const isDeleted = !!row.original.deletedAt;
				return isDeleted ? (
					<Badge variant="destructive">削除済み</Badge>
				) : (
					<Badge variant="success">アクティブ</Badge>
				);
			},
		},
		{
			accessorKey: "updatedAt",
			header: ({ column }) => <SortableHeader column={column} label="更新日時" />,
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
							options.onRestore!(row.original.workTypeCode);
						}}
					>
						復元
					</Button>
				);
			},
		},
	];
}

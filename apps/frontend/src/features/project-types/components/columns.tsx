import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SortableHeader } from "@/components/shared/SortableHeader";
import type { ProjectType } from "@/features/project-types/types";

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
}): ColumnDef<ProjectType>[] {
	return [
		{
			accessorKey: "projectTypeCode",
			header: ({ column }) => <SortableHeader column={column} label="コード" />,
			cell: ({ row }) => (
				<Link
					to="/master/project-types/$projectTypeCode"
					params={{ projectTypeCode: row.original.projectTypeCode }}
					className="font-medium text-primary hover:underline"
				>
					{row.original.projectTypeCode}
				</Link>
			),
		},
		{
			accessorKey: "name",
			header: ({ column }) => <SortableHeader column={column} label="名称" />,
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
							options.onRestore!(row.original.projectTypeCode);
						}}
					>
						復元
					</Button>
				);
			},
		},
	];
}

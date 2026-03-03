import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SortableHeader } from "@/components/shared/SortableHeader";
import { formatDateTime } from "@/lib/format-utils";
import { createElement } from "react";
import { Button } from "@/components/ui/button";

// --- ステータスカラム ---

export function createStatusColumn<TData extends { deletedAt?: string | null }>(options?: {
	id?: string;
	header?: string;
	activeLabel?: string;
	deletedLabel?: string;
}): ColumnDef<TData> {
	const {
		id = "status",
		header = "ステータス",
		activeLabel,
		deletedLabel,
	} = options ?? {};

	return {
		id,
		header,
		cell: ({ row }) =>
			createElement(StatusBadge, {
				isDeleted: !!row.original.deletedAt,
				...(activeLabel ? { activeLabel } : {}),
				...(deletedLabel ? { deletedLabel } : {}),
			}),
	};
}

// --- 復元アクションカラム ---

export function createRestoreActionColumn<
	TData extends { deletedAt?: string | null },
	TId extends string | number = string,
>(options: {
	idKey: keyof TData;
	onRestore?: (id: TId) => void;
}): ColumnDef<TData> {
	const { idKey, onRestore } = options;

	return {
		id: "actions",
		cell: ({ row }) => {
			const isDeleted = !!row.original.deletedAt;
			if (!isDeleted || !onRestore) return null;
			return createElement(
				Button,
				{
					variant: "outline",
					size: "sm",
					onClick: (e: React.MouseEvent) => {
						e.stopPropagation();
						onRestore(row.original[idKey] as TId);
					},
				},
				"復元",
			);
		},
	};
}

// --- 日時カラム ---

export function createDateTimeColumn<TData>(options: {
	accessorKey: keyof TData & string;
	label: string;
}): ColumnDef<TData> {
	const { accessorKey, label } = options;

	return {
		accessorKey,
		header: ({ column }) => createElement(SortableHeader, { column, label }),
		cell: ({ row }) => formatDateTime(row.original[accessorKey] as string),
	};
}

// --- ソータブルカラム ---

export function createSortableColumn<TData>(options: {
	accessorKey: keyof TData & string;
	label: string;
}): ColumnDef<TData> {
	const { accessorKey, label } = options;

	return {
		accessorKey,
		header: ({ column }) => createElement(SortableHeader, { column, label }),
	};
}

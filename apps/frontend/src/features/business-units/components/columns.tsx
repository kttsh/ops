import type { ColumnDef } from "@tanstack/react-table";
import {
	createDateTimeColumn,
	createRestoreActionColumn,
	createSortableColumn,
	createStatusColumn,
} from "@/components/shared/column-helpers";
import { SortableHeader } from "@/components/shared/SortableHeader";
import type { BusinessUnit } from "@/features/business-units/types";

export function createColumns(options: {
	onRestore?: (code: string) => void;
}): ColumnDef<BusinessUnit>[] {
	return [
		{
			accessorKey: "businessUnitCode",
			header: ({ column }) => <SortableHeader column={column} label="コード" />,
			cell: ({ row }) => (
				<span className="font-medium">{row.original.businessUnitCode}</span>
			),
		},
		createSortableColumn<BusinessUnit>({ accessorKey: "name", label: "名称" }),
		createSortableColumn<BusinessUnit>({
			accessorKey: "displayOrder",
			label: "表示順",
		}),
		createStatusColumn<BusinessUnit>(),
		createDateTimeColumn<BusinessUnit>({
			accessorKey: "updatedAt",
			label: "更新日時",
		}),
		createRestoreActionColumn<BusinessUnit, string>({
			idKey: "businessUnitCode",
			onRestore: options.onRestore,
		}),
	];
}

import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const PAGE_SIZES = [10, 20, 50, 100] as const;

interface PaginationConfig {
	currentPage: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

interface DataTableProps<TData> {
	columns: ColumnDef<TData, unknown>[];
	data: TData[];
	globalFilter: string;
	isLoading?: boolean;
	isError?: boolean;
	errorMessage?: string;
	pagination?: PaginationConfig;
	onPageChange?: (page: number) => void;
	onPageSizeChange?: (size: number) => void;
	onRowClick?: (row: TData) => void;
	onRowHover?: (row: TData) => void;
	rowClassName?: (row: TData) => string;
}

export function DataTable<TData>({
	columns,
	data,
	globalFilter,
	isLoading,
	isError,
	errorMessage,
	pagination,
	onPageChange,
	onPageSizeChange,
	onRowClick,
	onRowHover,
	rowClassName,
}: DataTableProps<TData>) {
	const [sorting, setSorting] = useState<SortingState>([]);

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			globalFilter,
		},
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex items-center justify-center py-16">
				<p className="text-destructive">
					{errorMessage ?? "データの取得に失敗しました"}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="rounded-2xl border shadow-sm overflow-hidden">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									className={cn(
										onRowClick && "cursor-pointer",
										"transition-colors",
										rowClassName?.(row.original),
									)}
									onClick={(e) => {
										if (!onRowClick) return;
										const target = e.target as HTMLElement;
										if (target.closest("a, button")) return;
										onRowClick(row.original);
									}}
									onMouseEnter={() => onRowHover?.(row.original)}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center text-muted-foreground"
								>
									データがありません
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{pagination && onPageChange && onPageSizeChange ? (
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						{pagination.totalItems > PAGE_SIZES[0] ? (
							<>
								<span>表示件数</span>
								<select
									value={pagination.pageSize}
									onChange={(e) => onPageSizeChange(Number(e.target.value))}
									className="rounded-lg border border-input bg-background px-2 py-1 text-sm"
								>
									{PAGE_SIZES.map((size) => (
										<option key={size} value={size}>
											{size}
										</option>
									))}
								</select>
								<span>/ 全 {pagination.totalItems} 件</span>
							</>
						) : (
							<span>全 {pagination.totalItems} 件</span>
						)}
					</div>
					{pagination.totalPages > 1 && (
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => onPageChange(pagination.currentPage - 1)}
								disabled={pagination.currentPage <= 1}
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<span className="text-sm text-muted-foreground">
								{pagination.currentPage} / {pagination.totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								onClick={() => onPageChange(pagination.currentPage + 1)}
								disabled={pagination.currentPage >= pagination.totalPages}
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					)}
				</div>
			) : (
				<div className="flex items-center text-sm text-muted-foreground">
					<span>全 {data.length} 件</span>
				</div>
			)}
		</div>
	);
}

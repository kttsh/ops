import { Loader2 } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { MonthlyCapacity } from "@/features/indirect-case-study/types";

interface MonthlyCapacityTableProps {
	capacities: MonthlyCapacity[];
	isLoading: boolean;
	fiscalYear: number;
}

export type PivotRow = {
	businessUnitCode: string;
	values: Record<string, number>;
};

export function buildFiscalYearMonths(fiscalYear: number): string[] {
	const months: string[] = [];
	for (let i = 0; i < 12; i++) {
		const month = ((i + 3) % 12) + 1;
		const year = i < 9 ? fiscalYear : fiscalYear + 1;
		months.push(`${year}-${String(month).padStart(2, "0")}`);
	}
	return months;
}

export function pivotCapacities(
	capacities: MonthlyCapacity[],
	_months: string[],
): PivotRow[] {
	const map = new Map<string, Record<string, number>>();
	for (const c of capacities) {
		if (!map.has(c.businessUnitCode)) {
			map.set(c.businessUnitCode, {});
		}
		map.get(c.businessUnitCode)![c.yearMonth] = c.capacity;
	}
	return Array.from(map.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([businessUnitCode, values]) => ({ businessUnitCode, values }));
}

function formatMonth(yearMonth: string): string {
	const [, month] = yearMonth.split("-");
	return `${Number(month)}月`;
}

export function MonthlyCapacityTable({
	capacities,
	isLoading,
	fiscalYear,
}: MonthlyCapacityTableProps) {
	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const months = buildFiscalYearMonths(fiscalYear);
	const rows = pivotCapacities(capacities, months);

	if (rows.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-muted-foreground">
				シナリオを選択してください
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="sticky left-0 bg-muted/50">BU</TableHead>
						{months.map((m) => (
							<TableHead key={m} className="text-right min-w-[70px]">
								{formatMonth(m)}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((row) => (
						<TableRow key={row.businessUnitCode}>
							<TableCell className="sticky left-0 bg-card font-medium">
								{row.businessUnitCode}
							</TableCell>
							{months.map((m) => (
								<TableCell key={m} className="text-right tabular-nums">
									{row.values[m] != null
										? row.values[m].toLocaleString("ja-JP", {
												maximumFractionDigits: 1,
											})
										: "-"}
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

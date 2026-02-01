import { useCallback, useMemo, useState } from "react";
import type {
	ChartDataResponse,
	TableRow,
	TableRowType,
} from "@/features/workload/types";

export interface UseTableDataReturn {
	rows: TableRow[];
	selectedYear: number;
	availableYears: number[];
	setSelectedYear: (year: number) => void;
	searchText: string;
	setSearchText: (text: string) => void;
	rowTypeFilter: TableRowType | "all";
	setRowTypeFilter: (filter: TableRowType | "all") => void;
	filteredRows: TableRow[];
}

const CURRENT_YEAR = new Date().getFullYear();

export function useTableData(
	rawResponse: ChartDataResponse | undefined,
): UseTableDataReturn {
	const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
	const [searchText, setSearchText] = useState("");
	const [rowTypeFilter, setRowTypeFilter] = useState<TableRowType | "all">(
		"all",
	);

	const { rows, availableYears } = useMemo(() => {
		if (!rawResponse) {
			return { rows: [] as TableRow[], availableYears: [CURRENT_YEAR] };
		}

		const allRows: TableRow[] = [];
		const yearSet = new Set<number>();

		// キャパシティ行
		for (const cap of rawResponse.capacities) {
			const monthly: Record<string, number> = {};
			let total = 0;
			for (const m of cap.monthly) {
				const month = m.yearMonth.slice(4, 6);
				const year = parseInt(m.yearMonth.slice(0, 4), 10);
				yearSet.add(year);
				monthly[`${year}_${month}`] = m.capacity;
				total += m.capacity;
			}
			allRows.push({
				id: `capacity_${cap.capacityScenarioId}`,
				rowType: "capacity",
				name: cap.scenarioName,
				total,
				monthly,
			});
		}

		// 間接作業行
		for (const iw of rawResponse.indirectWorkLoads) {
			const monthly: Record<string, number> = {};
			let total = 0;
			for (const m of iw.monthly) {
				const month = m.yearMonth.slice(4, 6);
				const year = parseInt(m.yearMonth.slice(0, 4), 10);
				yearSet.add(year);
				monthly[`${year}_${month}`] = m.manhour;
				total += m.manhour;
			}
			allRows.push({
				id: `indirect_${iw.indirectWorkCaseId}`,
				rowType: "indirect",
				name: iw.caseName,
				businessUnitCode: iw.businessUnitCode,
				total,
				monthly,
			});
		}

		// 案件行（案件単位）
		for (const pl of rawResponse.projectLoads) {
			const monthly: Record<string, number> = {};
			let total = 0;
			for (const m of pl.monthly) {
				const month = m.yearMonth.slice(4, 6);
				const year = parseInt(m.yearMonth.slice(0, 4), 10);
				yearSet.add(year);
				monthly[`${year}_${month}`] = m.manhour;
				total += m.manhour;
			}

			allRows.push({
				id: `project_${pl.projectId}`,
				rowType: "project",
				name: pl.projectName,
				projectTypeCode: pl.projectTypeCode,
				total,
				monthly,
			});
		}

		const years = Array.from(yearSet).sort();

		return {
			rows: allRows,
			availableYears: years.length > 0 ? years : [CURRENT_YEAR],
		};
	}, [rawResponse]);

	const filteredRows = useMemo(() => {
		let result = rows;

		if (rowTypeFilter !== "all") {
			result = result.filter(
				(r) => r.rowType === rowTypeFilter || r.rowType === "projectDetail",
			);
		}

		if (searchText.trim()) {
			const lower = searchText.toLowerCase();
			result = result.filter((r) => {
				// 親行自身がマッチするか
				if (r.name.toLowerCase().includes(lower)) return true;
				// サブ行にマッチするものがあるか
				if (r.subRows?.some((sub) => sub.name.toLowerCase().includes(lower)))
					return true;
				return false;
			});
		}

		return result;
	}, [rows, rowTypeFilter, searchText]);

	const safeSetSelectedYear = useCallback(
		(year: number) => {
			if (availableYears.includes(year)) {
				setSelectedYear(year);
			}
		},
		[availableYears],
	);

	return {
		rows,
		selectedYear,
		availableYears,
		setSelectedYear: safeSetSelectedYear,
		searchText,
		setSearchText,
		rowTypeFilter,
		setRowTypeFilter,
		filteredRows,
	};
}

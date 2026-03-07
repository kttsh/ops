import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import {
	type ChartDataParams,
	saveBusinessUnitsToStorage,
	type WorkloadSearchParams,
} from "@/features/workload/types";

export interface UseWorkloadFiltersReturn {
	filters: WorkloadSearchParams;
	setBusinessUnits: (codes: string[]) => void;
	setPeriod: (from: string | undefined, months: number) => void;
	setPeriodAndBusinessUnits: (
		from: string | undefined,
		months: number,
		businessUnitCodes: string[],
	) => void;
	setViewMode: (mode: "chart" | "table" | "both") => void;
	setSidePanelTab: (tab: "projects" | "indirect" | "settings") => void;
	hasBusinessUnits: boolean;
	chartDataParams: ChartDataParams | null;
}

export function useWorkloadFilters(): UseWorkloadFiltersReturn {
	const filters = useSearch({ from: "/workload/" });
	const navigate = useNavigate({ from: "/workload/" });

	const setBusinessUnits = useCallback(
		(codes: string[]) => {
			saveBusinessUnitsToStorage(codes);
			navigate({ search: (prev) => ({ ...prev, bu: codes }) });
		},
		[navigate],
	);

	const setPeriod = useCallback(
		(from: string | undefined, months: number) => {
			navigate({ search: (prev) => ({ ...prev, from, months }) });
		},
		[navigate],
	);

	const setPeriodAndBusinessUnits = useCallback(
		(from: string | undefined, months: number, businessUnitCodes: string[]) => {
			saveBusinessUnitsToStorage(businessUnitCodes);
			navigate({
				search: (prev) => ({ ...prev, from, months, bu: businessUnitCodes }),
			});
		},
		[navigate],
	);

	const setViewMode = useCallback(
		(mode: "chart" | "table" | "both") => {
			navigate({ search: (prev) => ({ ...prev, view: mode }) });
		},
		[navigate],
	);

	const setSidePanelTab = useCallback(
		(tab: "projects" | "indirect" | "settings") => {
			navigate({ search: (prev) => ({ ...prev, tab }) });
		},
		[navigate],
	);

	const hasBusinessUnits = filters.bu.length > 0;

	const chartDataParams: ChartDataParams | null = useMemo(() => {
		if (!hasBusinessUnits) return null;

		const now = new Date();
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth() + 1;
		// 今年度開始月: 4月始まり。1-3月なら前年度4月
		const fiscalStartYear = currentMonth >= 4 ? currentYear : currentYear - 1;
		const defaultFrom = `${fiscalStartYear}04`;

		const startYearMonth = filters.from ?? defaultFrom;
		const months = filters.months;

		// 終了年月を開始年月＋期間から計算
		const startY = parseInt(startYearMonth.slice(0, 4), 10);
		const startM = parseInt(startYearMonth.slice(4, 6), 10);
		let endM = startM + months - 1;
		let endY = startY;
		while (endM > 12) {
			endM -= 12;
			endY++;
		}
		const endYearMonth = `${endY}${String(endM).padStart(2, "0")}`;

		return {
			businessUnitCodes: filters.bu,
			startYearMonth,
			endYearMonth,
		};
	}, [filters.bu, filters.from, filters.months, hasBusinessUnits]);

	return {
		filters,
		setBusinessUnits,
		setPeriod,
		setPeriodAndBusinessUnits,
		setViewMode,
		setSidePanelTab,
		hasBusinessUnits,
		chartDataParams,
	};
}

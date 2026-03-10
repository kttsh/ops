import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import { useBulkSaveMonthlyIndirectWorkLoads } from "@/features/indirect-case-study/api/mutations";
import {
	indirectWorkCasesQueryOptions,
	monthlyIndirectWorkLoadsQueryOptions,
} from "@/features/indirect-case-study/api/queries";
import type { MonthlyIndirectWorkLoad } from "@/features/indirect-case-study/types";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

type UseMonthlyLoadsPageParams = {
	businessUnitCode: string;
};

/** yearMonth（YYYYMM）から年度を算出する */
export function toFiscalYear(yearMonth: string): number {
	const year = Number(yearMonth.slice(0, 4));
	const month = Number(yearMonth.slice(4, 6));
	return month >= 4 ? year : year - 1;
}

/** 年度 + 月インデックス（0=4月, 11=3月）→ yearMonth（YYYYMM） */
export function toYearMonth(fiscalYear: number, monthIndex: number): string {
	const month = ((monthIndex + 4 - 1) % 12) + 1; // 0→4, 1→5, ..., 8→12, 9→1, 10→2, 11→3
	const year = month >= 4 ? fiscalYear : fiscalYear + 1;
	return `${year}${String(month).padStart(2, "0")}`;
}

const MAX_MANHOUR = 99999999;

function initializeFromApiData(loads: MonthlyIndirectWorkLoad[]) {
	const localData: Record<string, number> = {};
	const originalSources: Record<string, string> = {};
	for (const load of loads) {
		localData[load.yearMonth] = load.manhour;
		originalSources[load.yearMonth] = load.source;
	}
	return { localData, originalSources };
}

export function useMonthlyLoadsPage({
	businessUnitCode,
}: UseMonthlyLoadsPageParams) {
	const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
	const [localData, setLocalData] = useState<Record<string, number>>({});
	const [originalSources, setOriginalSources] = useState<
		Record<string, string>
	>({});
	const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});
	const [
		hasAcknowledgedCalculatedWarning,
		setHasAcknowledgedCalculatedWarning,
	] = useState(false);

	// BU変更時のリセット
	const [prevBusinessUnitCode, setPrevBusinessUnitCode] =
		useState(businessUnitCode);
	if (businessUnitCode !== prevBusinessUnitCode) {
		setPrevBusinessUnitCode(businessUnitCode);
		setSelectedCaseId(null);
		setLocalData({});
		setOriginalSources({});
		setDirtyKeys(new Set());
		setValidationErrors({});
		setHasAcknowledgedCalculatedWarning(false);
	}

	// ケース一覧
	const casesQuery = useQuery(
		indirectWorkCasesQueryOptions({
			businessUnitCode,
			includeDisabled: false,
		}),
	);
	const cases = useMemo(() => casesQuery.data?.data ?? [], [casesQuery.data]);

	// 月次データ
	const loadsQuery = useQuery(
		monthlyIndirectWorkLoadsQueryOptions(selectedCaseId ?? 0, businessUnitCode),
	);
	const monthlyLoads = useMemo(
		() => loadsQuery.data?.data ?? [],
		[loadsQuery.data],
	);

	// APIデータからローカル状態を初期化（ケース変更時）
	const prevCaseIdRef = useRef<number | null>(null);
	if (selectedCaseId !== prevCaseIdRef.current) {
		prevCaseIdRef.current = selectedCaseId;
		if (selectedCaseId !== null && monthlyLoads.length > 0) {
			const init = initializeFromApiData(monthlyLoads);
			setLocalData(init.localData);
			setOriginalSources(init.originalSources);
		} else {
			setLocalData({});
			setOriginalSources({});
		}
		setDirtyKeys(new Set());
		setValidationErrors({});
		setHasAcknowledgedCalculatedWarning(false);
	}

	// loadsQueryが変わった時にlocalDataが空ならAPIデータで初期化
	const prevLoadsRef = useRef(monthlyLoads);
	if (
		monthlyLoads !== prevLoadsRef.current &&
		monthlyLoads.length > 0 &&
		dirtyKeys.size === 0
	) {
		prevLoadsRef.current = monthlyLoads;
		const init = initializeFromApiData(monthlyLoads);
		setLocalData(init.localData);
		setOriginalSources(init.originalSources);
	} else {
		prevLoadsRef.current = monthlyLoads;
	}

	// 年度一覧（ソート済み、最大5年分）
	const fiscalYears = useMemo(() => {
		const fySet = new Set<number>();
		for (const ym of Object.keys(localData)) {
			fySet.add(toFiscalYear(ym));
		}
		return Array.from(fySet)
			.sort((a, b) => a - b)
			.slice(0, 5);
	}, [localData]);

	const isDirty = dirtyKeys.size > 0;
	const hasValidationErrors = Object.keys(validationErrors).length > 0;

	// セル変更ハンドラ
	const handleChange = useCallback((yearMonth: string, value: number) => {
		setLocalData((prev) => ({ ...prev, [yearMonth]: value }));
		setDirtyKeys((prev) => new Set(prev).add(yearMonth));

		// バリデーション
		if (!Number.isInteger(value) || value < 0 || value > MAX_MANHOUR) {
			setValidationErrors((prev) => ({
				...prev,
				[yearMonth]: `0〜${MAX_MANHOUR.toLocaleString()}の整数を入力してください`,
			}));
		} else {
			setValidationErrors((prev) => {
				const next = { ...prev };
				delete next[yearMonth];
				return next;
			});
		}
	}, []);

	// Mutation
	const bulkSaveMutation = useBulkSaveMonthlyIndirectWorkLoads();

	const save = useCallback(async () => {
		if (!selectedCaseId || dirtyKeys.size === 0) return;

		const items = Array.from(dirtyKeys).map((yearMonth) => ({
			businessUnitCode,
			yearMonth,
			manhour: localData[yearMonth] ?? 0,
			source: "manual" as const,
		}));

		await bulkSaveMutation.mutateAsync({
			caseId: selectedCaseId,
			input: { items },
		});

		setDirtyKeys(new Set());
		// originalSources を manual に更新
		setOriginalSources((prev) => {
			const next = { ...prev };
			for (const yearMonth of items.map((i) => i.yearMonth)) {
				next[yearMonth] = "manual";
			}
			return next;
		});
	}, [
		selectedCaseId,
		dirtyKeys,
		localData,
		businessUnitCode,
		bulkSaveMutation,
	]);

	const unsaved = useUnsavedChanges({
		isDirty,
		onSave: save,
	});

	return {
		// ケース
		cases,
		isLoadingCases: casesQuery.isLoading,
		selectedCaseId,
		setSelectedCaseId,

		// 月次データ
		monthlyLoads,
		isLoadingLoads: loadsQuery.isLoading,

		// ローカル編集状態
		localData,
		originalSources,
		dirtyKeys,
		fiscalYears,
		validationErrors,
		hasValidationErrors,

		// 操作
		handleChange,
		save,
		isSaving: bulkSaveMutation.isPending,
		isDirty,

		// 未保存警告
		unsaved,

		// calculated 警告
		hasAcknowledgedCalculatedWarning,
		setHasAcknowledgedCalculatedWarning,
	};
}

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useBulkUpdateMonthlyHeadcountPlans } from "@/features/indirect-case-study/api/mutations";
import {
	headcountPlanCasesQueryOptions,
	monthlyHeadcountPlansQueryOptions,
} from "@/features/indirect-case-study/api/queries";
import type { MonthlyHeadcountPlan } from "@/features/indirect-case-study/types";

type UseHeadcountPlansPageParams = {
	businessUnitCode: string;
};

const MONTHS = [
	"04",
	"05",
	"06",
	"07",
	"08",
	"09",
	"10",
	"11",
	"12",
	"01",
	"02",
	"03",
];

function getCurrentFiscalYear(): number {
	const now = new Date();
	return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

function generateFiscalYearOptions(): number[] {
	const fy = getCurrentFiscalYear();
	const years: number[] = [];
	for (let i = fy - 2; i <= fy + 8; i++) {
		years.push(i);
	}
	return years;
}

function getYearMonth(fiscalYear: number, monthStr: string): string {
	const month = parseInt(monthStr, 10);
	const year = month >= 4 ? fiscalYear : fiscalYear + 1;
	return `${year}${monthStr}`;
}

export function useHeadcountPlansPage({
	businessUnitCode,
}: UseHeadcountPlansPageParams) {
	// 選択状態
	const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);

	// includeDisabled（削除済みを含む）トグル
	const [includeDisabled, setIncludeDisabled] = useState(false);

	// 全年度リスト
	const fiscalYears = useMemo(() => generateFiscalYearOptions(), []);
	const currentFiscalYear = useMemo(() => getCurrentFiscalYear(), []);

	// ローカルデータ・オリジナルデータ
	const [localData, setLocalData] = useState<Record<string, number>>({});
	const [originalData, setOriginalData] = useState<Record<string, number>>({});

	// クエリ
	const casesQuery = useQuery(
		headcountPlanCasesQueryOptions({
			businessUnitCode,
			includeDisabled,
		}),
	);

	const monthlyQuery = useQuery(
		monthlyHeadcountPlansQueryOptions(selectedCaseId ?? 0, businessUnitCode),
	);

	// APIデータからローカルデータを初期化
	const [prevDataId, setPrevDataId] = useState<unknown>(null);
	if (monthlyQuery.data?.data && monthlyQuery.data !== prevDataId) {
		const map: Record<string, number> = {};
		monthlyQuery.data.data.forEach((item: MonthlyHeadcountPlan) => {
			map[item.yearMonth] = item.headcount;
		});
		setLocalData(map);
		setOriginalData(map);
		setPrevDataId(monthlyQuery.data);
	}

	// Mutation
	const bulkHeadcountMutation = useBulkUpdateMonthlyHeadcountPlans();

	// BU変更時にリセット
	const [prevBusinessUnitCode, setPrevBusinessUnitCode] =
		useState(businessUnitCode);
	if (businessUnitCode !== prevBusinessUnitCode) {
		setPrevBusinessUnitCode(businessUnitCode);
		setSelectedCaseId(null);
		setLocalData({});
		setOriginalData({});
		setPrevDataId(null);
	}

	// セル単位のdirty判定
	const isCellDirty = useCallback(
		(yearMonth: string): boolean => {
			return (localData[yearMonth] ?? 0) !== (originalData[yearMonth] ?? 0);
		},
		[localData, originalData],
	);

	// 全体dirty判定
	const isDirty = useMemo(() => {
		const allKeys = new Set([
			...Object.keys(localData),
			...Object.keys(originalData),
		]);
		for (const key of allKeys) {
			if ((localData[key] ?? 0) !== (originalData[key] ?? 0)) {
				return true;
			}
		}
		return false;
	}, [localData, originalData]);

	// セル値変更
	const handleCellChange = useCallback((yearMonth: string, value: number) => {
		setLocalData((prev) => ({ ...prev, [yearMonth]: value }));
	}, []);

	// 一括入力ハンドラー
	const handleBulkSet = useCallback((year: number, headcount: number) => {
		setLocalData((prev) => {
			const updated = { ...prev };
			MONTHS.forEach((m) => {
				updated[getYearMonth(year, m)] = headcount;
			});
			return updated;
		});
	}, []);

	const handleBulkInterpolation = useCallback(
		(year: number, monthlyValues: number[]) => {
			setLocalData((prev) => {
				const updated = { ...prev };
				MONTHS.forEach((m, i) => {
					updated[getYearMonth(year, m)] = monthlyValues[i];
				});
				return updated;
			});
		},
		[],
	);

	// 保存
	const saveHeadcountPlans = useCallback(async () => {
		if (!selectedCaseId) return;

		// 差分のみ抽出
		const changedItems: {
			businessUnitCode: string;
			yearMonth: string;
			headcount: number;
		}[] = [];
		const allKeys = new Set([
			...Object.keys(localData),
			...Object.keys(originalData),
		]);
		for (const key of allKeys) {
			if ((localData[key] ?? 0) !== (originalData[key] ?? 0)) {
				changedItems.push({
					businessUnitCode,
					yearMonth: key,
					headcount: localData[key] ?? 0,
				});
			}
		}

		if (changedItems.length === 0) return;

		try {
			await bulkHeadcountMutation.mutateAsync({
				caseId: selectedCaseId,
				input: { items: changedItems },
			});
			// 保存成功: originalData を更新
			setOriginalData({ ...localData });
		} catch {
			// エラートーストは mutation の onError で表示済み
		}
	}, [
		selectedCaseId,
		localData,
		originalData,
		businessUnitCode,
		bulkHeadcountMutation,
	]);

	return {
		// クエリ結果
		cases: casesQuery.data?.data ?? [],
		isLoadingCases: casesQuery.isLoading,

		// 選択状態
		selectedCaseId,
		setSelectedCaseId,

		// includeDisabled
		includeDisabled,
		setIncludeDisabled,

		// 年度
		fiscalYears,
		currentFiscalYear,

		// データ管理
		localData,
		originalData,
		isCellDirty,
		handleCellChange,

		// 一括入力
		handleBulkSet,
		handleBulkInterpolation,

		// Dirty・保存
		isDirty,
		saveHeadcountPlans,
		isSaving: bulkHeadcountMutation.isPending,
		isLoadingMonthly: monthlyQuery.isLoading,
	};
}

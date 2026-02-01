import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	useBulkSaveMonthlyIndirectWorkLoads,
	useBulkUpdateIndirectWorkTypeRatios,
	useBulkUpdateMonthlyHeadcountPlans,
} from "@/features/indirect-case-study/api/mutations";
import {
	capacityScenariosQueryOptions,
	headcountPlanCasesQueryOptions,
	indirectWorkCasesQueryOptions,
	indirectWorkTypeRatiosQueryOptions,
	monthlyHeadcountPlansQueryOptions,
} from "@/features/indirect-case-study/api/queries";
import type {
	BulkIndirectWorkRatioInput,
	BulkMonthlyHeadcountInput,
	CalculateCapacityResult,
	IndirectWorkCalcResult,
} from "@/features/indirect-case-study/types";
import { useCapacityCalculation } from "./useCapacityCalculation";
import { useIndirectWorkCalculation } from "./useIndirectWorkCalculation";

type UseIndirectCaseStudyPageParams = {
	businessUnitCode: string;
};

function getCurrentFiscalYear(): number {
	const now = new Date();
	return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

export function useIndirectCaseStudyPage({
	businessUnitCode,
}: UseIndirectCaseStudyPageParams) {
	// 選択状態
	const [selectedHeadcountPlanCaseId, setSelectedHeadcountPlanCaseId] =
		useState<number | null>(null);
	const [selectedCapacityScenarioId, setSelectedCapacityScenarioId] = useState<
		number | null
	>(null);
	const [selectedIndirectWorkCaseId, setSelectedIndirectWorkCaseId] = useState<
		number | null
	>(null);

	// 年度管理
	const [settingsFiscalYear, setSettingsFiscalYear] = useState(
		getCurrentFiscalYear(),
	);
	const [resultFiscalYear, setResultFiscalYear] = useState(
		getCurrentFiscalYear(),
	);

	// 計算結果
	const [capacityResult, setCapacityResult] =
		useState<CalculateCapacityResult | null>(null);
	const [indirectWorkResult, setIndirectWorkResult] =
		useState<IndirectWorkCalcResult | null>(null);

	// Dirty状態
	const [headcountDirty, setHeadcountDirty] = useState(false);
	const [ratioDirty, setRatioDirty] = useState(false);
	const [indirectWorkResultDirty, setIndirectWorkResultDirty] = useState(false);

	// includeDisabled（削除済みを含む）トグル
	const [hpcIncludeDisabled, setHpcIncludeDisabled] = useState(false);
	const [csIncludeDisabled, setCsIncludeDisabled] = useState(false);
	const [iwcIncludeDisabled, setIwcIncludeDisabled] = useState(false);

	// 保存用ローカルデータ
	const [headcountLocalData, setHeadcountLocalData] =
		useState<BulkMonthlyHeadcountInput | null>(null);
	const [ratioLocalData, setRatioLocalData] =
		useState<BulkIndirectWorkRatioInput | null>(null);

	// フック
	const capacityCalc = useCapacityCalculation();
	const indirectCalc = useIndirectWorkCalculation();

	// クエリ
	const headcountCasesQuery = useQuery(
		headcountPlanCasesQueryOptions({
			businessUnitCode,
			includeDisabled: hpcIncludeDisabled,
		}),
	);

	const capacityScenariosQuery = useQuery(
		capacityScenariosQueryOptions({ includeDisabled: csIncludeDisabled }),
	);

	const indirectWorkCasesQuery = useQuery(
		indirectWorkCasesQueryOptions({
			businessUnitCode,
			includeDisabled: iwcIncludeDisabled,
		}),
	);

	const monthlyHeadcountQuery = useQuery(
		monthlyHeadcountPlansQueryOptions(
			selectedHeadcountPlanCaseId ?? 0,
			businessUnitCode,
		),
	);

	const ratiosQuery = useQuery(
		indirectWorkTypeRatiosQueryOptions(selectedIndirectWorkCaseId ?? 0),
	);

	// Mutations
	const bulkHeadcountMutation = useBulkUpdateMonthlyHeadcountPlans();
	const bulkRatioMutation = useBulkUpdateIndirectWorkTypeRatios();
	const bulkIndirectWorkLoadsMutation = useBulkSaveMonthlyIndirectWorkLoads();

	// BU変更時にリセット（レンダー中に派生stateとして更新）
	const [prevBusinessUnitCode, setPrevBusinessUnitCode] =
		useState(businessUnitCode);
	if (businessUnitCode !== prevBusinessUnitCode) {
		setPrevBusinessUnitCode(businessUnitCode);
		setSelectedHeadcountPlanCaseId(null);
		setSelectedCapacityScenarioId(null);
		setSelectedIndirectWorkCaseId(null);
		setCapacityResult(null);
		setIndirectWorkResult(null);
		setHeadcountDirty(false);
		setRatioDirty(false);
		setIndirectWorkResultDirty(false);
		setHeadcountLocalData(null);
		setRatioLocalData(null);
		capacityCalc.reset();
		indirectCalc.reset();
	}

	// キャパシティ計算
	const calculateCapacity = useCallback(async () => {
		if (!selectedCapacityScenarioId || !selectedHeadcountPlanCaseId) return;
		try {
			const result = await capacityCalc.calculate({
				capacityScenarioId: selectedCapacityScenarioId,
				headcountPlanCaseId: selectedHeadcountPlanCaseId,
				businessUnitCodes: [businessUnitCode],
			});
			setCapacityResult(result);
			// キャパシティ計算結果はAPI側でDB保存されるので dirty 不要
		} catch {
			toast.error("キャパシティ計算に失敗しました");
		}
	}, [
		selectedCapacityScenarioId,
		selectedHeadcountPlanCaseId,
		businessUnitCode,
		capacityCalc,
	]);

	// 間接工数計算
	const calculateIndirectWork = useCallback(() => {
		if (!capacityResult || !ratiosQuery.data) return;
		const result = indirectCalc.calculate({
			capacities: capacityResult.items,
			ratios: ratiosQuery.data.data,
		});
		setIndirectWorkResult(result);
		setIndirectWorkResultDirty(true);
	}, [capacityResult, ratiosQuery.data, indirectCalc]);

	// 間接作業工数を保存
	const saveIndirectWorkLoads = useCallback(async () => {
		if (!selectedIndirectWorkCaseId || !indirectWorkResult) return;
		await bulkIndirectWorkLoadsMutation.mutateAsync({
			caseId: selectedIndirectWorkCaseId,
			input: { items: indirectWorkResult.monthlyLoads },
		});
		setIndirectWorkResultDirty(false);
	}, [
		selectedIndirectWorkCaseId,
		indirectWorkResult,
		bulkIndirectWorkLoadsMutation,
	]);

	// 人員計画を保存
	const saveHeadcountPlans = useCallback(async () => {
		if (!selectedHeadcountPlanCaseId || !headcountLocalData) return;
		await bulkHeadcountMutation.mutateAsync({
			caseId: selectedHeadcountPlanCaseId,
			input: headcountLocalData,
		});
		setHeadcountDirty(false);
	}, [selectedHeadcountPlanCaseId, headcountLocalData, bulkHeadcountMutation]);

	// 間接作業比率を保存
	const saveRatios = useCallback(async () => {
		if (!selectedIndirectWorkCaseId || !ratioLocalData) return;
		await bulkRatioMutation.mutateAsync({
			caseId: selectedIndirectWorkCaseId,
			input: ratioLocalData,
		});
		setRatioDirty(false);
	}, [selectedIndirectWorkCaseId, ratioLocalData, bulkRatioMutation]);

	// 全dirty対象を保存
	const saveAll = useCallback(async () => {
		if (headcountDirty) await saveHeadcountPlans();
		if (ratioDirty) await saveRatios();
		if (indirectWorkResultDirty) await saveIndirectWorkLoads();
	}, [
		headcountDirty,
		ratioDirty,
		indirectWorkResultDirty,
		saveHeadcountPlans,
		saveRatios,
		saveIndirectWorkLoads,
	]);

	const isDirty = headcountDirty || ratioDirty || indirectWorkResultDirty;

	const canCalculateCapacity = useMemo(
		() =>
			selectedHeadcountPlanCaseId !== null &&
			selectedCapacityScenarioId !== null,
		[selectedHeadcountPlanCaseId, selectedCapacityScenarioId],
	);

	const canCalculateIndirectWork = useMemo(
		() => capacityResult !== null && selectedIndirectWorkCaseId !== null,
		[capacityResult, selectedIndirectWorkCaseId],
	);

	return {
		// クエリ結果
		headcountCases: headcountCasesQuery.data?.data ?? [],
		capacityScenarios: capacityScenariosQuery.data?.data ?? [],
		indirectWorkCases: indirectWorkCasesQuery.data?.data ?? [],
		monthlyHeadcountPlans: monthlyHeadcountQuery.data?.data ?? [],
		ratios: ratiosQuery.data?.data ?? [],
		isLoadingCases:
			headcountCasesQuery.isLoading ||
			capacityScenariosQuery.isLoading ||
			indirectWorkCasesQuery.isLoading,

		// 選択状態
		selectedHeadcountPlanCaseId,
		setSelectedHeadcountPlanCaseId,
		selectedCapacityScenarioId,
		setSelectedCapacityScenarioId,
		selectedIndirectWorkCaseId,
		setSelectedIndirectWorkCaseId,

		// 計算結果
		capacityResult,
		indirectWorkResult,

		// 年度
		settingsFiscalYear,
		setSettingsFiscalYear,
		resultFiscalYear,
		setResultFiscalYear,

		// 計算アクション
		calculateCapacity,
		calculateIndirectWork,
		isCalculatingCapacity: capacityCalc.isCalculating,
		canCalculateCapacity,
		canCalculateIndirectWork,

		// 保存アクション
		saveHeadcountPlans,
		saveRatios,
		saveIndirectWorkLoads,
		saveAll,
		isSavingResults: bulkIndirectWorkLoadsMutation.isPending,
		isSavingHeadcount: bulkHeadcountMutation.isPending,
		isSavingRatios: bulkRatioMutation.isPending,

		// Dirty管理
		isDirty,
		headcountDirty,
		setHeadcountDirty,
		ratioDirty,
		setRatioDirty,
		indirectWorkResultDirty,

		// ローカルデータ更新
		setHeadcountLocalData,
		setRatioLocalData,

		// includeDisabled
		hpcIncludeDisabled,
		setHpcIncludeDisabled,
		csIncludeDisabled,
		setCsIncludeDisabled,
		iwcIncludeDisabled,
		setIwcIncludeDisabled,
	};
}

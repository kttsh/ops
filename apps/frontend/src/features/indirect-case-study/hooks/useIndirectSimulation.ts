import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useBulkSaveMonthlyIndirectWorkLoads } from "@/features/indirect-case-study/api/mutations";
import {
	capacityScenariosQueryOptions,
	headcountPlanCasesQueryOptions,
	indirectWorkCasesQueryOptions,
	indirectWorkTypeRatiosQueryOptions,
	monthlyHeadcountPlansQueryOptions,
} from "@/features/indirect-case-study/api/queries";
import type {
	CalculateCapacityResult,
	IndirectWorkCalcResult,
} from "@/features/indirect-case-study/types";
import { useCapacityCalculation } from "./useCapacityCalculation";
import { useIndirectWorkCalculation } from "./useIndirectWorkCalculation";

type UseIndirectSimulationParams = {
	businessUnitCode: string;
};

function getCurrentFiscalYear(): number {
	const now = new Date();
	return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

export function useIndirectSimulation({
	businessUnitCode,
}: UseIndirectSimulationParams) {
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
	const [resultFiscalYear, setResultFiscalYear] = useState(
		getCurrentFiscalYear(),
	);

	// 計算結果
	const [capacityResult, setCapacityResult] =
		useState<CalculateCapacityResult | null>(null);
	const [indirectWorkResult, setIndirectWorkResult] =
		useState<IndirectWorkCalcResult | null>(null);

	// Dirty状態
	const [indirectWorkResultDirty, setIndirectWorkResultDirty] = useState(false);

	// フック
	const capacityCalc = useCapacityCalculation();
	const indirectCalc = useIndirectWorkCalculation();

	// クエリ
	const headcountCasesQuery = useQuery(
		headcountPlanCasesQueryOptions({
			businessUnitCode,
			includeDisabled: false,
		}),
	);

	const capacityScenariosQuery = useQuery(
		capacityScenariosQueryOptions({ includeDisabled: false }),
	);

	const indirectWorkCasesQuery = useQuery(
		indirectWorkCasesQueryOptions({
			businessUnitCode,
			includeDisabled: false,
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

	// Mutation
	const bulkIndirectWorkLoadsMutation = useBulkSaveMonthlyIndirectWorkLoads();

	// BU変更時にリセット
	const [prevBusinessUnitCode, setPrevBusinessUnitCode] =
		useState(businessUnitCode);
	if (businessUnitCode !== prevBusinessUnitCode) {
		setPrevBusinessUnitCode(businessUnitCode);
		setSelectedHeadcountPlanCaseId(null);
		setSelectedCapacityScenarioId(null);
		setSelectedIndirectWorkCaseId(null);
		setCapacityResult(null);
		setIndirectWorkResult(null);
		setIndirectWorkResultDirty(false);
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

		// 計算アクション
		calculateCapacity,
		calculateIndirectWork,
		isCalculatingCapacity: capacityCalc.isCalculating,
		canCalculateCapacity,
		canCalculateIndirectWork,

		// 結果保存
		saveIndirectWorkLoads,
		isSavingResults: bulkIndirectWorkLoadsMutation.isPending,
		indirectWorkResultDirty,

		// 年度
		resultFiscalYear,
		setResultFiscalYear,
	};
}

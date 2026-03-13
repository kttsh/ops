import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useBulkSaveMonthlyIndirectWorkLoads } from "@/features/indirect-case-study/api/mutations";
import {
	capacityScenariosQueryOptions,
	headcountPlanCasesQueryOptions,
	indirectCaseStudyKeys,
	indirectWorkCasesQueryOptions,
	indirectWorkTypeRatiosQueryOptions,
	monthlyCapacitiesQueryOptions,
	monthlyHeadcountPlansQueryOptions,
	monthlyIndirectWorkLoadsQueryOptions,
} from "@/features/indirect-case-study/api/queries";
import {
	getAvailableFiscalYears,
	getLastCalculatedAt,
	resolveSelectedCaseId,
} from "./simulation-utils";
import { useCapacityCalculation } from "./useCapacityCalculation";
import { useIndirectWorkCalculation } from "./useIndirectWorkCalculation";

type UseIndirectSimulationParams = {
	businessUnitCode: string;
	/** URL検索パラメータから渡されるケースID（0 = 未指定） */
	selectedHeadcountCaseId?: number;
	selectedCapacityScenarioId?: number;
	selectedIndirectWorkCaseId?: number;
};

export function useIndirectSimulation({
	businessUnitCode,
	selectedHeadcountCaseId = 0,
	selectedCapacityScenarioId = 0,
	selectedIndirectWorkCaseId = 0,
}: UseIndirectSimulationParams) {
	const queryClient = useQueryClient();

	// 計算フック
	const capacityCalc = useCapacityCalculation();
	const indirectCalc = useIndirectWorkCalculation();

	// 再計算中フラグ
	const [isRecalculating, setIsRecalculating] = useState(false);

	// ケースリストクエリ
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

	// ケース一覧
	const headcountCases = useMemo(
		() => headcountCasesQuery.data?.data ?? [],
		[headcountCasesQuery.data],
	);
	const capacityScenarios = useMemo(
		() => capacityScenariosQuery.data?.data ?? [],
		[capacityScenariosQuery.data],
	);
	const indirectWorkCases = useMemo(
		() => indirectWorkCasesQuery.data?.data ?? [],
		[indirectWorkCasesQuery.data],
	);

	// ケースID解決（URL param > プライマリ > 0）
	const resolvedHeadcountCaseId = useMemo(
		() =>
			resolveSelectedCaseId(
				headcountCases,
				selectedHeadcountCaseId,
				(c) => c.headcountPlanCaseId,
				(c) => c.isPrimary,
			),
		[headcountCases, selectedHeadcountCaseId],
	);

	const resolvedCapacityScenarioId = useMemo(
		() =>
			resolveSelectedCaseId(
				capacityScenarios,
				selectedCapacityScenarioId,
				(s) => s.capacityScenarioId,
				(s) => s.isPrimary,
			),
		[capacityScenarios, selectedCapacityScenarioId],
	);

	const resolvedIndirectWorkCaseId = useMemo(
		() =>
			resolveSelectedCaseId(
				indirectWorkCases,
				selectedIndirectWorkCaseId,
				(c) => c.indirectWorkCaseId,
				(c) => c.isPrimary,
			),
		[indirectWorkCases, selectedIndirectWorkCaseId],
	);

	// 再計算可能判定（3つの解決済みIDがすべて > 0）
	const canRecalculate =
		resolvedHeadcountCaseId > 0 &&
		resolvedCapacityScenarioId > 0 &&
		resolvedIndirectWorkCaseId > 0;

	// 保存済みデータクエリ（解決済みケースIDベース）
	const monthlyHeadcountQuery = useQuery(
		monthlyHeadcountPlansQueryOptions(
			resolvedHeadcountCaseId,
			businessUnitCode,
		),
	);

	const monthlyCapacitiesQuery = useQuery(
		monthlyCapacitiesQueryOptions(resolvedCapacityScenarioId, businessUnitCode),
	);

	const monthlyIndirectWorkLoadsQuery = useQuery(
		monthlyIndirectWorkLoadsQueryOptions(
			resolvedIndirectWorkCaseId,
			businessUnitCode,
		),
	);

	const ratiosQuery = useQuery(
		indirectWorkTypeRatiosQueryOptions(resolvedIndirectWorkCaseId),
	);

	// Mutation
	const bulkIndirectWorkLoadsMutation = useBulkSaveMonthlyIndirectWorkLoads();

	// 保存済みデータ
	const monthlyHeadcountPlans = useMemo(
		() => monthlyHeadcountQuery.data?.data ?? [],
		[monthlyHeadcountQuery.data],
	);
	const monthlyCapacities = useMemo(
		() => monthlyCapacitiesQuery.data?.data ?? [],
		[monthlyCapacitiesQuery.data],
	);
	const monthlyIndirectWorkLoads = useMemo(
		() => monthlyIndirectWorkLoadsQuery.data?.data ?? [],
		[monthlyIndirectWorkLoadsQuery.data],
	);
	const ratios = useMemo(
		() => ratiosQuery.data?.data ?? [],
		[ratiosQuery.data],
	);

	// ローディング状態
	const isLoadingData =
		headcountCasesQuery.isLoading ||
		capacityScenariosQuery.isLoading ||
		indirectWorkCasesQuery.isLoading ||
		monthlyHeadcountQuery.isLoading ||
		monthlyCapacitiesQuery.isLoading ||
		monthlyIndirectWorkLoadsQuery.isLoading ||
		ratiosQuery.isLoading;

	// 利用可能年度
	const availableFiscalYears = useMemo(
		() => getAvailableFiscalYears(monthlyIndirectWorkLoads, monthlyCapacities),
		[monthlyIndirectWorkLoads, monthlyCapacities],
	);

	// 最終計算日時
	const lastCalculatedAt = useMemo(
		() => getLastCalculatedAt(monthlyIndirectWorkLoads),
		[monthlyIndirectWorkLoads],
	);

	// 1ボタン再計算
	const recalculate = useCallback(async () => {
		if (
			!resolvedCapacityScenarioId ||
			!resolvedHeadcountCaseId ||
			!resolvedIndirectWorkCaseId
		)
			return;

		setIsRecalculating(true);
		try {
			// Step 1: キャパシティ計算
			const capResult = await capacityCalc.calculate({
				capacityScenarioId: resolvedCapacityScenarioId,
				headcountPlanCaseId: resolvedHeadcountCaseId,
				businessUnitCodes: [businessUnitCode],
			});

			// Step 2: クライアントサイド間接工数計算
			const iwResult = indirectCalc.calculate({
				capacities: capResult.items,
				ratios,
			});

			// Step 3: バルク保存
			await bulkIndirectWorkLoadsMutation.mutateAsync({
				caseId: resolvedIndirectWorkCaseId,
				input: { items: iwResult.monthlyLoads },
			});

			// Step 4: クエリ無効化
			await queryClient.invalidateQueries({
				queryKey: indirectCaseStudyKeys.all,
			});

			toast.success("間接工数を再計算しました");
		} catch {
			toast.error("再計算に失敗しました");
		} finally {
			setIsRecalculating(false);
		}
	}, [
		resolvedCapacityScenarioId,
		resolvedHeadcountCaseId,
		resolvedIndirectWorkCaseId,
		businessUnitCode,
		ratios,
		capacityCalc,
		indirectCalc,
		bulkIndirectWorkLoadsMutation,
		queryClient,
	]);

	return {
		// ケース一覧（セレクタ用）
		headcountCases,
		capacityScenarios,
		indirectWorkCases,

		// 解決済みケースID
		resolvedHeadcountCaseId,
		resolvedCapacityScenarioId,
		resolvedIndirectWorkCaseId,

		// 再計算可能判定
		canRecalculate,

		// 保存済みデータ
		monthlyHeadcountPlans,
		monthlyCapacities,
		monthlyIndirectWorkLoads,
		ratios,

		// ローディング状態
		isLoadingData,

		// 最終計算日時
		lastCalculatedAt,

		// 利用可能年度
		availableFiscalYears,

		// 再計算アクション
		recalculate,
		isRecalculating,
	};
}

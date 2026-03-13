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
	findPrimaryId,
	getAvailableFiscalYears,
	getLastCalculatedAt,
} from "./simulation-utils";
import { useCapacityCalculation } from "./useCapacityCalculation";
import { useIndirectWorkCalculation } from "./useIndirectWorkCalculation";

type UseIndirectSimulationParams = {
	businessUnitCode: string;
};

export function useIndirectSimulation({
	businessUnitCode,
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

	// primaryケースIDの自動検出
	const primaryHeadcountCaseId = useMemo(
		() => findPrimaryId(headcountCases, (c) => c.headcountPlanCaseId),
		[headcountCases],
	);
	const primaryCapacityScenarioId = useMemo(
		() => findPrimaryId(capacityScenarios, (s) => s.capacityScenarioId),
		[capacityScenarios],
	);
	const primaryIndirectWorkCaseId = useMemo(
		() => findPrimaryId(indirectWorkCases, (c) => c.indirectWorkCaseId),
		[indirectWorkCases],
	);

	// primaryケース名の派生
	const primaryHeadcountCaseName = useMemo(
		() =>
			headcountCases.find(
				(c) => c.headcountPlanCaseId === primaryHeadcountCaseId,
			)?.caseName ?? null,
		[headcountCases, primaryHeadcountCaseId],
	);
	const primaryCapacityScenarioName = useMemo(
		() =>
			capacityScenarios.find(
				(s) => s.capacityScenarioId === primaryCapacityScenarioId,
			)?.scenarioName ?? null,
		[capacityScenarios, primaryCapacityScenarioId],
	);
	const primaryIndirectWorkCaseName = useMemo(
		() =>
			indirectWorkCases.find(
				(c) => c.indirectWorkCaseId === primaryIndirectWorkCaseId,
			)?.caseName ?? null,
		[indirectWorkCases, primaryIndirectWorkCaseId],
	);

	// primaryケース有無フラグ
	const hasPrimaryHeadcountCase = primaryHeadcountCaseId !== null;
	const hasPrimaryCapacityScenario = primaryCapacityScenarioId !== null;
	const hasPrimaryIndirectWorkCase = primaryIndirectWorkCaseId !== null;

	// 再計算可能判定
	const canRecalculate =
		primaryHeadcountCaseId !== null &&
		primaryCapacityScenarioId !== null &&
		primaryIndirectWorkCaseId !== null;

	// 保存済みデータクエリ（primaryケースIDベース）
	const monthlyHeadcountQuery = useQuery(
		monthlyHeadcountPlansQueryOptions(
			primaryHeadcountCaseId ?? 0,
			businessUnitCode,
		),
	);

	const monthlyCapacitiesQuery = useQuery(
		monthlyCapacitiesQueryOptions(
			primaryCapacityScenarioId ?? 0,
			businessUnitCode,
		),
	);

	const monthlyIndirectWorkLoadsQuery = useQuery(
		monthlyIndirectWorkLoadsQueryOptions(
			primaryIndirectWorkCaseId ?? 0,
			businessUnitCode,
		),
	);

	const ratiosQuery = useQuery(
		indirectWorkTypeRatiosQueryOptions(primaryIndirectWorkCaseId ?? 0),
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
			!primaryCapacityScenarioId ||
			!primaryHeadcountCaseId ||
			!primaryIndirectWorkCaseId
		)
			return;

		setIsRecalculating(true);
		try {
			// Step 1: キャパシティ計算
			const capResult = await capacityCalc.calculate({
				capacityScenarioId: primaryCapacityScenarioId,
				headcountPlanCaseId: primaryHeadcountCaseId,
				businessUnitCodes: [businessUnitCode],
			});

			// Step 2: クライアントサイド間接工数計算
			const iwResult = indirectCalc.calculate({
				capacities: capResult.items,
				ratios,
			});

			// Step 3: バルク保存
			await bulkIndirectWorkLoadsMutation.mutateAsync({
				caseId: primaryIndirectWorkCaseId,
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
		primaryCapacityScenarioId,
		primaryHeadcountCaseId,
		primaryIndirectWorkCaseId,
		businessUnitCode,
		ratios,
		capacityCalc,
		indirectCalc,
		bulkIndirectWorkLoadsMutation,
		queryClient,
	]);

	return {
		// primaryケース情報
		primaryHeadcountCaseId,
		primaryCapacityScenarioId,
		primaryIndirectWorkCaseId,
		primaryHeadcountCaseName,
		primaryCapacityScenarioName,
		primaryIndirectWorkCaseName,
		hasPrimaryHeadcountCase,
		hasPrimaryCapacityScenario,
		hasPrimaryIndirectWorkCase,
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

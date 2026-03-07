import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
	capacityScenariosQueryOptions,
	monthlyCapacitiesQueryOptions,
} from "@/features/indirect-case-study/api/queries";

export function useCapacityScenariosPage() {
	// 選択状態
	const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(
		null,
	);

	// includeDisabled（削除済みを含む）トグル
	const [includeDisabled, setIncludeDisabled] = useState(false);

	// クエリ
	const scenariosQuery = useQuery(
		capacityScenariosQueryOptions({ includeDisabled }),
	);

	// 月別キャパシティ（シナリオ選択時のみ有効化）
	const capacitiesQuery = useQuery(
		monthlyCapacitiesQueryOptions(selectedScenarioId ?? 0),
	);

	return {
		// クエリ結果
		scenarios: scenariosQuery.data?.data ?? [],
		isLoadingScenarios: scenariosQuery.isLoading,

		// 選択状態
		selectedScenarioId,
		setSelectedScenarioId,

		// includeDisabled
		includeDisabled,
		setIncludeDisabled,

		// 月別キャパシティ
		monthlyCapacities: capacitiesQuery.data?.data ?? [],
		isLoadingCapacities: capacitiesQuery.isLoading,
	};
}

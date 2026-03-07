import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useBulkUpdateIndirectWorkTypeRatios } from "@/features/indirect-case-study/api/mutations";
import { indirectWorkCasesQueryOptions } from "@/features/indirect-case-study/api/queries";
import type { BulkIndirectWorkRatioInput } from "@/features/indirect-case-study/types";

type UseIndirectWorkCasesPageParams = {
	businessUnitCode: string;
};

export function useIndirectWorkCasesPage({
	businessUnitCode,
}: UseIndirectWorkCasesPageParams) {
	// 選択状態
	const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);

	// includeDisabled（削除済みを含む）トグル
	const [includeDisabled, setIncludeDisabled] = useState(false);

	// Dirty状態
	const [isDirty, setRatioDirty] = useState(false);

	// 保存用ローカルデータ
	const [ratioLocalData, setRatioLocalData] =
		useState<BulkIndirectWorkRatioInput | null>(null);

	// クエリ
	const casesQuery = useQuery(
		indirectWorkCasesQueryOptions({
			businessUnitCode,
			includeDisabled,
		}),
	);

	// Mutation
	const bulkRatioMutation = useBulkUpdateIndirectWorkTypeRatios();

	// BU変更時にリセット（レンダー中に派生stateとして更新）
	const [prevBusinessUnitCode, setPrevBusinessUnitCode] =
		useState(businessUnitCode);
	if (businessUnitCode !== prevBusinessUnitCode) {
		setPrevBusinessUnitCode(businessUnitCode);
		setSelectedCaseId(null);
		setRatioDirty(false);
		setRatioLocalData(null);
	}

	// 間接作業比率を保存
	const saveRatios = useCallback(async () => {
		if (!selectedCaseId || !ratioLocalData) return;
		await bulkRatioMutation.mutateAsync({
			caseId: selectedCaseId,
			input: ratioLocalData,
		});
		setRatioDirty(false);
	}, [selectedCaseId, ratioLocalData, bulkRatioMutation]);

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

		// Dirty管理
		isDirty,
		setRatioDirty,
		setRatioLocalData,

		// 保存
		saveRatios,
		isSaving: bulkRatioMutation.isPending,
	};
}

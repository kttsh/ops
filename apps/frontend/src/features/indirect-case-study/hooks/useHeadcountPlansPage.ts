import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
	useBulkUpdateMonthlyHeadcountPlans,
} from "@/features/indirect-case-study/api/mutations";
import {
	headcountPlanCasesQueryOptions,
} from "@/features/indirect-case-study/api/queries";
import type {
	BulkMonthlyHeadcountInput,
} from "@/features/indirect-case-study/types";

type UseHeadcountPlansPageParams = {
	businessUnitCode: string;
};

function getCurrentFiscalYear(): number {
	const now = new Date();
	return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

export function useHeadcountPlansPage({
	businessUnitCode,
}: UseHeadcountPlansPageParams) {
	// 選択状態
	const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);

	// 年度管理
	const [fiscalYear, setFiscalYear] = useState(getCurrentFiscalYear());

	// includeDisabled（削除済みを含む）トグル
	const [includeDisabled, setIncludeDisabled] = useState(false);

	// Dirty状態
	const [isDirty, setHeadcountDirty] = useState(false);

	// 保存用ローカルデータ
	const [headcountLocalData, setHeadcountLocalData] =
		useState<BulkMonthlyHeadcountInput | null>(null);

	// クエリ
	const casesQuery = useQuery(
		headcountPlanCasesQueryOptions({
			businessUnitCode,
			includeDisabled,
		}),
	);

	// Mutation
	const bulkHeadcountMutation = useBulkUpdateMonthlyHeadcountPlans();

	// BU変更時にリセット（レンダー中に派生stateとして更新）
	const [prevBusinessUnitCode, setPrevBusinessUnitCode] =
		useState(businessUnitCode);
	if (businessUnitCode !== prevBusinessUnitCode) {
		setPrevBusinessUnitCode(businessUnitCode);
		setSelectedCaseId(null);
		setHeadcountDirty(false);
		setHeadcountLocalData(null);
	}

	// 人員計画を保存
	const saveHeadcountPlans = useCallback(async () => {
		if (!selectedCaseId || !headcountLocalData) return;
		await bulkHeadcountMutation.mutateAsync({
			caseId: selectedCaseId,
			input: headcountLocalData,
		});
		setHeadcountDirty(false);
	}, [selectedCaseId, headcountLocalData, bulkHeadcountMutation]);

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
		fiscalYear,
		setFiscalYear,

		// Dirty管理
		isDirty,
		setHeadcountDirty,
		setHeadcountLocalData,

		// 保存
		saveHeadcountPlans,
		isSaving: bulkHeadcountMutation.isPending,
	};
}

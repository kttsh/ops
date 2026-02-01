import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
	BulkIndirectWorkRatioInput,
	BulkMonthlyHeadcountInput,
	BulkMonthlyIndirectWorkLoadInput,
	CreateCapacityScenarioInput,
	CreateHeadcountPlanCaseInput,
	CreateIndirectWorkCaseInput,
	UpdateCapacityScenarioInput,
	UpdateHeadcountPlanCaseInput,
	UpdateIndirectWorkCaseInput,
} from "@/features/indirect-case-study/types";
import {
	createCapacityScenario,
	deleteCapacityScenario,
	restoreCapacityScenario,
	updateCapacityScenario,
} from "./capacity-scenario-client";
import {
	bulkUpdateMonthlyHeadcountPlans,
	createHeadcountPlanCase,
	deleteHeadcountPlanCase,
	restoreHeadcountPlanCase,
	updateHeadcountPlanCase,
} from "./headcount-plan-client";
import {
	bulkSaveMonthlyIndirectWorkLoads,
	bulkUpdateIndirectWorkTypeRatios,
	createIndirectWorkCase,
	deleteIndirectWorkCase,
	restoreIndirectWorkCase,
	updateIndirectWorkCase,
} from "./indirect-work-client";
import { indirectCaseStudyKeys } from "./queries";

// ============================================================
// Headcount Plan Cases
// ============================================================

export function useCreateHeadcountPlanCase() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateHeadcountPlanCaseInput) =>
			createHeadcountPlanCase(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: indirectCaseStudyKeys.headcountPlanCases(),
			});
			toast.success("保存しました");
		},
		onError: () => {
			toast.error("保存に失敗しました");
		},
	});
}

export function useUpdateHeadcountPlanCase() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			input,
		}: {
			id: number;
			input: UpdateHeadcountPlanCaseInput;
		}) => updateHeadcountPlanCase(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: indirectCaseStudyKeys.headcountPlanCases(),
			});
			toast.success("保存しました");
		},
		onError: () => {
			toast.error("保存に失敗しました");
		},
	});
}

export function useDeleteHeadcountPlanCase() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => deleteHeadcountPlanCase(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: indirectCaseStudyKeys.headcountPlanCases(),
			});
			toast.success("削除しました");
		},
		onError: () => {
			toast.error("削除に失敗しました");
		},
	});
}

export function useRestoreHeadcountPlanCase() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => restoreHeadcountPlanCase(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: indirectCaseStudyKeys.headcountPlanCases(),
			});
			toast.success("復元しました");
		},
		onError: () => {
			toast.error("復元に失敗しました");
		},
	});
}

export function useBulkUpdateMonthlyHeadcountPlans() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			caseId,
			input,
		}: {
			caseId: number;
			input: BulkMonthlyHeadcountInput;
		}) => bulkUpdateMonthlyHeadcountPlans(caseId, input),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: [
					...indirectCaseStudyKeys.headcountPlanCases(),
					variables.caseId,
					"monthly",
				],
			});
			toast.success("保存しました");
		},
		onError: () => {
			toast.error("保存に失敗しました");
		},
	});
}

// ============================================================
// Capacity Scenarios
// ============================================================

export function useCreateCapacityScenario() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateCapacityScenarioInput) =>
			createCapacityScenario(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: indirectCaseStudyKeys.capacityScenarios(),
			});
			toast.success("保存しました");
		},
		onError: () => {
			toast.error("保存に失敗しました");
		},
	});
}

export function useUpdateCapacityScenario() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			input,
		}: {
			id: number;
			input: UpdateCapacityScenarioInput;
		}) => updateCapacityScenario(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: indirectCaseStudyKeys.capacityScenarios(),
			});
			toast.success("保存しました");
		},
		onError: () => {
			toast.error("保存に失敗しました");
		},
	});
}

export function useDeleteCapacityScenario() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => deleteCapacityScenario(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: indirectCaseStudyKeys.capacityScenarios(),
			});
			toast.success("削除しました");
		},
		onError: () => {
			toast.error("削除に失敗しました");
		},
	});
}

export function useRestoreCapacityScenario() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => restoreCapacityScenario(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: indirectCaseStudyKeys.capacityScenarios(),
			});
			toast.success("復元しました");
		},
		onError: () => {
			toast.error("復元に失敗しました");
		},
	});
}

// ============================================================
// Indirect Work Cases
// ============================================================

export function useCreateIndirectWorkCase() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateIndirectWorkCaseInput) =>
			createIndirectWorkCase(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: indirectCaseStudyKeys.indirectWorkCases(),
			});
			toast.success("保存しました");
		},
		onError: () => {
			toast.error("保存に失敗しました");
		},
	});
}

export function useUpdateIndirectWorkCase() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			input,
		}: {
			id: number;
			input: UpdateIndirectWorkCaseInput;
		}) => updateIndirectWorkCase(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: indirectCaseStudyKeys.indirectWorkCases(),
			});
			toast.success("保存しました");
		},
		onError: () => {
			toast.error("保存に失敗しました");
		},
	});
}

export function useDeleteIndirectWorkCase() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => deleteIndirectWorkCase(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: indirectCaseStudyKeys.indirectWorkCases(),
			});
			toast.success("削除しました");
		},
		onError: () => {
			toast.error("削除に失敗しました");
		},
	});
}

export function useRestoreIndirectWorkCase() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => restoreIndirectWorkCase(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: indirectCaseStudyKeys.indirectWorkCases(),
			});
			toast.success("復元しました");
		},
		onError: () => {
			toast.error("復元に失敗しました");
		},
	});
}

// ============================================================
// Indirect Work Type Ratios
// ============================================================

export function useBulkUpdateIndirectWorkTypeRatios() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			caseId,
			input,
		}: {
			caseId: number;
			input: BulkIndirectWorkRatioInput;
		}) => bulkUpdateIndirectWorkTypeRatios(caseId, input),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: indirectCaseStudyKeys.indirectWorkTypeRatios(
					variables.caseId,
				),
			});
			toast.success("保存しました");
		},
		onError: () => {
			toast.error("保存に失敗しました");
		},
	});
}

// ============================================================
// Monthly Indirect Work Loads
// ============================================================

export function useBulkSaveMonthlyIndirectWorkLoads() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			caseId,
			input,
		}: {
			caseId: number;
			input: BulkMonthlyIndirectWorkLoadInput;
		}) => bulkSaveMonthlyIndirectWorkLoads(caseId, input),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: [
					...indirectCaseStudyKeys.indirectWorkCases(),
					variables.caseId,
					"monthly-loads",
				],
			});
			toast.success("保存しました");
		},
		onError: () => {
			toast.error("保存に失敗しました");
		},
	});
}

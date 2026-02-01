import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
	BulkUpsertProjectItemInput,
	ChartColorSettingInput,
	ChartStackOrderSettingInput,
	CreateChartViewInput,
	UpdateChartViewInput,
} from "@/features/workload/types";
import {
	bulkUpsertChartColorSettings,
	bulkUpsertChartStackOrderSettings,
	bulkUpsertChartViewProjectItems,
	createChartView,
	deleteChartView,
	updateChartView,
} from "./api-client";
import { workloadKeys } from "./queries";

export function useBulkUpsertColorSettings() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (items: ChartColorSettingInput[]) =>
			bulkUpsertChartColorSettings(items),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: workloadKeys.colorSettings() });
		},
	});
}

export function useBulkUpsertStackOrderSettings() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (items: ChartStackOrderSettingInput[]) =>
			bulkUpsertChartStackOrderSettings(items),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: workloadKeys.stackOrderSettings(),
			});
		},
	});
}

export function useCreateChartView() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateChartViewInput) => createChartView(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: workloadKeys.chartViews() });
			toast.success("保存しました");
		},
		onError: () => {
			toast.error("保存に失敗しました");
		},
	});
}

export function useUpdateChartView() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, input }: { id: number; input: UpdateChartViewInput }) =>
			updateChartView(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: workloadKeys.chartViews() });
		},
	});
}

export function useBulkUpsertChartViewProjectItems() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			chartViewId,
			items,
		}: {
			chartViewId: number;
			items: BulkUpsertProjectItemInput[];
		}) => bulkUpsertChartViewProjectItems(chartViewId, items),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: workloadKeys.chartViewProjectItems(variables.chartViewId),
			});
		},
	});
}

export function useDeleteChartView() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => deleteChartView(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: workloadKeys.chartViews() });
			toast.success("削除しました");
		},
		onError: () => {
			toast.error("削除に失敗しました");
		},
	});
}

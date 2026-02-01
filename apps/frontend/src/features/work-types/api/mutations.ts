import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
	CreateWorkTypeInput,
	UpdateWorkTypeInput,
} from "@/features/work-types/types";
import {
	createWorkType,
	deleteWorkType,
	restoreWorkType,
	updateWorkType,
} from "./api-client";
import { workTypeKeys } from "./queries";

export function useCreateWorkType() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateWorkTypeInput) => createWorkType(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: workTypeKeys.lists() });
		},
	});
}

export function useUpdateWorkType(code: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: UpdateWorkTypeInput) => updateWorkType(code, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: workTypeKeys.lists() });
			queryClient.invalidateQueries({ queryKey: workTypeKeys.detail(code) });
		},
	});
}

export function useDeleteWorkType() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (code: string) => deleteWorkType(code),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: workTypeKeys.lists() });
		},
	});
}

export function useRestoreWorkType() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (code: string) => restoreWorkType(code),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: workTypeKeys.lists() });
		},
	});
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
	CreateBusinessUnitInput,
	UpdateBusinessUnitInput,
} from "@/features/business-units/types";
import {
	createBusinessUnit,
	deleteBusinessUnit,
	restoreBusinessUnit,
	updateBusinessUnit,
} from "./api-client";
import { businessUnitKeys } from "./queries";

export function useCreateBusinessUnit() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateBusinessUnitInput) => createBusinessUnit(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: businessUnitKeys.lists() });
		},
	});
}

export function useUpdateBusinessUnit(code: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: UpdateBusinessUnitInput) =>
			updateBusinessUnit(code, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: businessUnitKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: businessUnitKeys.detail(code),
			});
		},
	});
}

export function useDeleteBusinessUnit() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (code: string) => deleteBusinessUnit(code),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: businessUnitKeys.lists() });
		},
	});
}

export function useRestoreBusinessUnit() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (code: string) => restoreBusinessUnit(code),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: businessUnitKeys.lists() });
		},
	});
}

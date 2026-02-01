import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
	CreateProjectTypeInput,
	UpdateProjectTypeInput,
} from "@/features/project-types/types";
import {
	createProjectType,
	deleteProjectType,
	restoreProjectType,
	updateProjectType,
} from "./api-client";
import { projectTypeKeys } from "./queries";

export function useCreateProjectType() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateProjectTypeInput) => createProjectType(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectTypeKeys.lists() });
		},
	});
}

export function useUpdateProjectType(code: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: UpdateProjectTypeInput) =>
			updateProjectType(code, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectTypeKeys.lists() });
			queryClient.invalidateQueries({ queryKey: projectTypeKeys.detail(code) });
		},
	});
}

export function useDeleteProjectType() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (code: string) => deleteProjectType(code),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectTypeKeys.lists() });
		},
	});
}

export function useRestoreProjectType() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (code: string) => restoreProjectType(code),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectTypeKeys.lists() });
		},
	});
}

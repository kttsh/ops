import type { Project, ProjectCaseSummary } from "@/features/workload/types";

/**
 * 案件のデフォルトケースを返す（isPrimary 優先、なければ最初のケース）
 */
export function getDefaultCase(
	cases: ProjectCaseSummary[],
): ProjectCaseSummary | undefined {
	if (cases.length === 0) return undefined;
	return cases.find((c) => c.isPrimary) ?? cases[0];
}

/**
 * 各案件のデフォルトケース（isPrimary、なければ最初のケース）を選択した Map を生成する
 */
export function initializeCaseSelection(
	projects: Project[],
	selectedProjectIds: Set<number>,
): Map<number, number> {
	const map = new Map<number, number>();
	for (const project of projects) {
		if (!selectedProjectIds.has(project.projectId)) continue;
		const defaultCase = getDefaultCase(project.cases);
		if (defaultCase) {
			map.set(project.projectId, defaultCase.projectCaseId);
		}
	}
	return map;
}

/**
 * 全案件がデフォルト（isPrimary）ケースを選択しているかを判定する
 * 1件でも非デフォルトケースが選択されていれば true を返す
 */
export function hasNonDefaultCaseSelection(
	selectedCaseIds: Map<number, number>,
	projects: Project[],
): boolean {
	for (const [projectId, caseId] of selectedCaseIds) {
		const project = projects.find((p) => p.projectId === projectId);
		if (!project) continue;
		const defaultCase = getDefaultCase(project.cases);
		if (defaultCase && defaultCase.projectCaseId !== caseId) {
			return true;
		}
	}
	return false;
}

/**
 * 案件選択変更時にケース選択状態を同期する
 * - 新規チェック案件: isPrimary ケースを自動選択
 * - チェック解除案件: ケース状態をクリア
 * - 既存の選択状態は維持
 */
export function syncCaseSelectionWithProjects(
	prevCaseIds: Map<number, number>,
	newSelectedProjectIds: Set<number>,
	projects: Project[],
): Map<number, number> {
	const newMap = new Map<number, number>();

	for (const projectId of newSelectedProjectIds) {
		if (prevCaseIds.has(projectId)) {
			newMap.set(projectId, prevCaseIds.get(projectId)!);
		} else {
			const project = projects.find((p) => p.projectId === projectId);
			if (project) {
				const defaultCase = getDefaultCase(project.cases);
				if (defaultCase) {
					newMap.set(projectId, defaultCase.projectCaseId);
				}
			}
		}
	}

	return newMap;
}

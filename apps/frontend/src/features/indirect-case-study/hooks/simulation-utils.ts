import type {
	CapacityScenario,
	HeadcountPlanCase,
	IndirectWorkCase,
} from "@/features/indirect-case-study/types";
import { getFiscalYear } from "./useIndirectWorkCalculation";

/**
 * isPrimary === true のアイテムからIDを取得する。
 * 複数存在する場合は配列先頭を採用。存在しない場合はnullを返す。
 */
export function findPrimaryId<T extends { isPrimary: boolean }>(
	items: T[],
	getId: (item: T) => number,
): number | null {
	const primary = items.find((item) => item.isPrimary);
	return primary ? getId(primary) : null;
}

/**
 * 3つのケースすべてが選択済みの場合にtrueを返す。
 */
export function canRecalculate(
	headcountCaseId: number | null,
	capacityScenarioId: number | null,
	indirectWorkCaseId: number | null,
): boolean {
	return (
		headcountCaseId !== null &&
		capacityScenarioId !== null &&
		indirectWorkCaseId !== null
	);
}

/**
 * 各エンティティのprimary有無と、現在の選択がprimaryかどうかを導出する。
 */
export function derivePrimaryState(
	headcountCases: Pick<
		HeadcountPlanCase,
		"headcountPlanCaseId" | "isPrimary"
	>[],
	capacityScenarios: Pick<
		CapacityScenario,
		"capacityScenarioId" | "isPrimary"
	>[],
	indirectWorkCases: Pick<
		IndirectWorkCase,
		"indirectWorkCaseId" | "isPrimary"
	>[],
	selectedHeadcountCaseId: number | null,
	selectedCapacityScenarioId: number | null,
	selectedIndirectWorkCaseId: number | null,
) {
	const primaryHeadcountId = findPrimaryId(
		headcountCases,
		(c) => c.headcountPlanCaseId,
	);
	const primaryCapacityId = findPrimaryId(
		capacityScenarios,
		(s) => s.capacityScenarioId,
	);
	const primaryIndirectId = findPrimaryId(
		indirectWorkCases,
		(c) => c.indirectWorkCaseId,
	);

	return {
		hasPrimaryHeadcountCase: primaryHeadcountId !== null,
		hasPrimaryCapacityScenario: primaryCapacityId !== null,
		hasPrimaryIndirectWorkCase: primaryIndirectId !== null,
		isHeadcountCasePrimary:
			selectedHeadcountCaseId !== null &&
			selectedHeadcountCaseId === primaryHeadcountId,
		isCapacityScenarioPrimary:
			selectedCapacityScenarioId !== null &&
			selectedCapacityScenarioId === primaryCapacityId,
		isIndirectWorkCasePrimary:
			selectedIndirectWorkCaseId !== null &&
			selectedIndirectWorkCaseId === primaryIndirectId,
		primaryHeadcountId,
		primaryCapacityId,
		primaryIndirectId,
	};
}

/**
 * 選択中のIDが現在のケース一覧に存在するかを検証する。
 * 存在しない場合はprimaryIdにフォールバック。選択がnullの場合はnullを維持。
 */
export function validateSelection(
	selectedId: number | null,
	validIds: number[],
	primaryId: number | null,
): number | null {
	if (selectedId === null) return null;
	if (validIds.length === 0) return null;
	if (validIds.includes(selectedId)) return selectedId;
	return primaryId;
}

/**
 * 間接工数データとキャパシティデータの yearMonth から利用可能な年度をソート済みで返す。
 */
export function getAvailableFiscalYears(
	loads: Pick<{ yearMonth: string }, "yearMonth">[],
	capacities: Pick<{ yearMonth: string }, "yearMonth">[],
): number[] {
	const allYearMonths = [
		...loads.map((l) => l.yearMonth),
		...capacities.map((c) => c.yearMonth),
	];
	const fiscalYears = new Set(allYearMonths.map((ym) => getFiscalYear(ym)));
	return [...fiscalYears].sort((a, b) => a - b);
}

/**
 * source === "calculated" のレコードのうち updatedAt の最大値を返す。
 * 該当レコードがない場合は null を返す。
 */
export function getLastCalculatedAt(
	loads: Pick<{ source: string; updatedAt: string }, "source" | "updatedAt">[],
): string | null {
	const calculatedLoads = loads.filter((l) => l.source === "calculated");
	if (calculatedLoads.length === 0) return null;
	return calculatedLoads.reduce((max, l) =>
		l.updatedAt > max.updatedAt ? l : max,
	).updatedAt;
}

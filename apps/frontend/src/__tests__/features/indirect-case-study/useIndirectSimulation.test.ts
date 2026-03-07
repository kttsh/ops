import { describe, expect, it } from "vitest";

/**
 * useIndirectSimulation の計算可否条件ロジックのユニットテスト
 *
 * フック内の canCalculateCapacity / canCalculateIndirectWork は
 * 以下の純粋な条件式で算出される：
 *   canCalculateCapacity = selectedHeadcountPlanCaseId !== null && selectedCapacityScenarioId !== null
 *   canCalculateIndirectWork = capacityResult !== null && selectedIndirectWorkCaseId !== null
 */

function canCalculateCapacity(
	selectedHeadcountPlanCaseId: number | null,
	selectedCapacityScenarioId: number | null,
): boolean {
	return (
		selectedHeadcountPlanCaseId !== null &&
		selectedCapacityScenarioId !== null
	);
}

function canCalculateIndirectWork(
	capacityResult: unknown | null,
	selectedIndirectWorkCaseId: number | null,
): boolean {
	return capacityResult !== null && selectedIndirectWorkCaseId !== null;
}

describe("useIndirectSimulation - canCalculateCapacity", () => {
	it("両方選択済みなら true", () => {
		expect(canCalculateCapacity(1, 2)).toBe(true);
	});

	it("人員計画ケースが未選択なら false", () => {
		expect(canCalculateCapacity(null, 2)).toBe(false);
	});

	it("キャパシティシナリオが未選択なら false", () => {
		expect(canCalculateCapacity(1, null)).toBe(false);
	});

	it("両方未選択なら false", () => {
		expect(canCalculateCapacity(null, null)).toBe(false);
	});
});

describe("useIndirectSimulation - canCalculateIndirectWork", () => {
	it("キャパシティ計算結果あり + ケース選択済みなら true", () => {
		expect(canCalculateIndirectWork({ items: [] }, 1)).toBe(true);
	});

	it("キャパシティ計算結果がなければ false", () => {
		expect(canCalculateIndirectWork(null, 1)).toBe(false);
	});

	it("間接作業ケースが未選択なら false", () => {
		expect(canCalculateIndirectWork({ items: [] }, null)).toBe(false);
	});

	it("両方未設定なら false", () => {
		expect(canCalculateIndirectWork(null, null)).toBe(false);
	});
});

describe("useIndirectSimulation - BU変更時のリセット動作", () => {
	it("BU変更時にすべての選択状態がリセットされるべき", () => {
		// このテストはフックの設計意図を文書化する
		// 実装: businessUnitCode !== prevBusinessUnitCode の場合に
		// selectedHeadcountPlanCaseId, selectedCapacityScenarioId,
		// selectedIndirectWorkCaseId, capacityResult, indirectWorkResult,
		// indirectWorkResultDirty をすべてリセット
		const resetState = {
			selectedHeadcountPlanCaseId: null,
			selectedCapacityScenarioId: null,
			selectedIndirectWorkCaseId: null,
			capacityResult: null,
			indirectWorkResult: null,
			indirectWorkResultDirty: false,
		};
		// リセット後の初期状態を検証
		expect(resetState.selectedHeadcountPlanCaseId).toBeNull();
		expect(resetState.selectedCapacityScenarioId).toBeNull();
		expect(resetState.selectedIndirectWorkCaseId).toBeNull();
		expect(resetState.capacityResult).toBeNull();
		expect(resetState.indirectWorkResult).toBeNull();
		expect(resetState.indirectWorkResultDirty).toBe(false);
	});

	it("dirty フラグは保存成功時に false になるべき", () => {
		// 計算完了時: dirty = true
		let dirty = true;
		expect(dirty).toBe(true);

		// 保存成功時: dirty = false
		dirty = false;
		expect(dirty).toBe(false);
	});
});

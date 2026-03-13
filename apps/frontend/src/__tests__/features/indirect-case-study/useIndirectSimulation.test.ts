import { describe, expect, it } from "vitest";
import {
	canRecalculate,
	derivePrimaryState,
	findPrimaryId,
	getAvailableFiscalYears,
	getLastCalculatedAt,
	validateSelection,
} from "@/features/indirect-case-study/hooks/simulation-utils";

/**
 * useIndirectSimulation の純粋関数ユニットテスト
 *
 * 新フック設計ではprimaryケースを自動検出し、ケース選択ステートを廃止。
 * canRecalculate は3つのprimaryケースIDがすべて非nullかで判定する。
 */

// --- findPrimaryId ---

describe("findPrimaryId", () => {
	it("isPrimary === true のアイテムのIDを返す", () => {
		const items = [
			{ id: 1, isPrimary: false },
			{ id: 2, isPrimary: true },
			{ id: 3, isPrimary: false },
		];
		expect(findPrimaryId(items, (item) => item.id)).toBe(2);
	});

	it("primaryが存在しない場合はnullを返す", () => {
		const items = [
			{ id: 1, isPrimary: false },
			{ id: 3, isPrimary: false },
		];
		expect(findPrimaryId(items, (item) => item.id)).toBeNull();
	});

	it("空配列の場合はnullを返す", () => {
		expect(findPrimaryId([], (item: { id: number }) => item.id)).toBeNull();
	});

	it("複数primaryが存在する場合は先頭を採用する", () => {
		const items = [
			{ id: 1, isPrimary: true },
			{ id: 2, isPrimary: true },
		];
		expect(findPrimaryId(items, (item) => item.id)).toBe(1);
	});
});

// --- canRecalculate ---

describe("canRecalculate", () => {
	it("3つのケースすべてが選択済みならtrue", () => {
		expect(canRecalculate(1, 2, 3)).toBe(true);
	});

	it("人員計画ケースが未選択ならfalse", () => {
		expect(canRecalculate(null, 2, 3)).toBe(false);
	});

	it("キャパシティシナリオが未選択ならfalse", () => {
		expect(canRecalculate(1, null, 3)).toBe(false);
	});

	it("間接作業ケースが未選択ならfalse", () => {
		expect(canRecalculate(1, 2, null)).toBe(false);
	});

	it("すべて未選択ならfalse", () => {
		expect(canRecalculate(null, null, null)).toBe(false);
	});
});

// --- derivePrimaryState ---

describe("derivePrimaryState", () => {
	const headcountCases = [
		{ headcountPlanCaseId: 1, isPrimary: false },
		{ headcountPlanCaseId: 2, isPrimary: true },
	];
	const capacityScenarios = [
		{ capacityScenarioId: 10, isPrimary: true },
		{ capacityScenarioId: 11, isPrimary: false },
	];
	const indirectWorkCases = [
		{ indirectWorkCaseId: 20, isPrimary: false },
		{ indirectWorkCaseId: 21, isPrimary: false },
	];

	it("各エンティティのprimary有無を正しく返す", () => {
		const state = derivePrimaryState(
			headcountCases,
			capacityScenarios,
			indirectWorkCases,
			2,
			10,
			21,
		);
		expect(state.hasPrimaryHeadcountCase).toBe(true);
		expect(state.hasPrimaryCapacityScenario).toBe(true);
		expect(state.hasPrimaryIndirectWorkCase).toBe(false);
	});

	it("現在の選択がprimaryかどうかを正しく返す", () => {
		const state = derivePrimaryState(
			headcountCases,
			capacityScenarios,
			indirectWorkCases,
			2,
			10,
			21,
		);
		expect(state.isHeadcountCasePrimary).toBe(true);
		expect(state.isCapacityScenarioPrimary).toBe(true);
		expect(state.isIndirectWorkCasePrimary).toBe(false);
	});

	it("選択がnullの場合はisPrimaryをfalseで返す", () => {
		const state = derivePrimaryState(
			headcountCases,
			capacityScenarios,
			indirectWorkCases,
			null,
			null,
			null,
		);
		expect(state.isHeadcountCasePrimary).toBe(false);
		expect(state.isCapacityScenarioPrimary).toBe(false);
		expect(state.isIndirectWorkCasePrimary).toBe(false);
	});
});

// --- validateSelection ---

describe("validateSelection", () => {
	it("選択中のIDが一覧に存在する場合はそのIDを返す", () => {
		const validIds = [1, 2, 3];
		expect(validateSelection(2, validIds, 1)).toBe(2);
	});

	it("選択中のIDが一覧に存在しない場合はprimaryIdにフォールバック", () => {
		const validIds = [1, 2, 3];
		expect(validateSelection(99, validIds, 2)).toBe(2);
	});

	it("選択中のIDが存在せずprimaryIdもnullの場合はnullを返す", () => {
		const validIds = [1, 2, 3];
		expect(validateSelection(99, validIds, null)).toBeNull();
	});

	it("選択がnullの場合はnullを返す（自動選択のトリガーに任せる）", () => {
		const validIds = [1, 2, 3];
		expect(validateSelection(null, validIds, 1)).toBeNull();
	});

	it("一覧が空の場合はnullを返す", () => {
		expect(validateSelection(1, [], null)).toBeNull();
	});
});

// --- getAvailableFiscalYears ---

describe("getAvailableFiscalYears", () => {
	it("間接工数データとキャパシティデータからユニークな年度を抽出しソートして返す", () => {
		const loads = [
			{ yearMonth: "202404" },
			{ yearMonth: "202501" },
			{ yearMonth: "202504" },
		];
		const capacities = [{ yearMonth: "202404" }, { yearMonth: "202604" }];

		const result = getAvailableFiscalYears(loads, capacities);
		expect(result).toEqual([2024, 2025, 2026]);
	});

	it("データが空の場合は空配列を返す", () => {
		const result = getAvailableFiscalYears([], []);
		expect(result).toEqual([]);
	});

	it("重複する年度は除去される", () => {
		const loads = [
			{ yearMonth: "202404" },
			{ yearMonth: "202405" },
			{ yearMonth: "202406" },
		];
		const result = getAvailableFiscalYears(loads, []);
		expect(result).toEqual([2024]);
	});

	it("1月〜3月は前年度として扱われる", () => {
		const loads = [
			{ yearMonth: "202501" },
			{ yearMonth: "202502" },
			{ yearMonth: "202503" },
		];
		const result = getAvailableFiscalYears(loads, []);
		expect(result).toEqual([2024]);
	});

	it("4月以降は当年度として扱われる", () => {
		const loads = [{ yearMonth: "202504" }, { yearMonth: "202512" }];
		const result = getAvailableFiscalYears(loads, []);
		expect(result).toEqual([2025]);
	});
});

// --- getLastCalculatedAt ---

describe("getLastCalculatedAt", () => {
	it("source=calculatedのレコードからupdatedAtの最大値を返す", () => {
		const loads = [
			{ source: "calculated", updatedAt: "2026-03-10T10:00:00Z" },
			{ source: "calculated", updatedAt: "2026-03-14T15:30:00Z" },
			{ source: "manual", updatedAt: "2026-03-15T12:00:00Z" },
		];
		expect(getLastCalculatedAt(loads)).toBe("2026-03-14T15:30:00Z");
	});

	it("source=calculatedのレコードがない場合はnullを返す", () => {
		const loads = [{ source: "manual", updatedAt: "2026-03-15T12:00:00Z" }];
		expect(getLastCalculatedAt(loads)).toBeNull();
	});

	it("空配列の場合はnullを返す", () => {
		expect(getLastCalculatedAt([])).toBeNull();
	});

	it("source=calculatedが1件のみの場合はそのupdatedAtを返す", () => {
		const loads = [{ source: "calculated", updatedAt: "2026-01-01T00:00:00Z" }];
		expect(getLastCalculatedAt(loads)).toBe("2026-01-01T00:00:00Z");
	});
});

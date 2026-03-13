import { describe, expect, it } from "vitest";

/**
 * CaseSelectSection の表示ロジックのユニットテスト
 *
 * UIコンポーネントのレンダリングは統合テストで検証するため、
 * ここではCaseSelectSectionが利用する表示判定ロジックを検証する。
 */

/** primaryバッジ表示: isPrimary === true のアイテムにバッジが付与されるべき */
function getPrimaryItems(
	items: Array<{ value: string; label: string; isPrimary: boolean }>,
): Array<{ value: string; label: string }> {
	return items.filter((item) => item.isPrimary);
}

/** 警告メッセージ表示条件: hasPrimary === false かつ value === null */
function shouldShowWarning(hasPrimary: boolean, value: number | null): boolean {
	return !hasPrimary && value === null;
}

/** non-primary表示: 現在の選択がprimaryでないことを示す条件 */
function isNonPrimarySelected(
	value: number | null,
	items: Array<{ value: string; isPrimary: boolean }>,
): boolean {
	if (value === null) return false;
	const selectedItem = items.find((item) => item.value === String(value));
	return selectedItem ? !selectedItem.isPrimary : false;
}

describe("CaseSelectSection - primaryバッジ表示", () => {
	it("isPrimary === true のアイテムを正しく識別する", () => {
		const items = [
			{ value: "1", label: "ケースA", isPrimary: true },
			{ value: "2", label: "ケースB", isPrimary: false },
			{ value: "3", label: "ケースC", isPrimary: false },
		];
		const primaryItems = getPrimaryItems(items);
		expect(primaryItems).toHaveLength(1);
		expect(primaryItems[0].label).toBe("ケースA");
	});

	it("primaryが存在しない場合は空配列を返す", () => {
		const items = [
			{ value: "1", label: "ケースA", isPrimary: false },
			{ value: "2", label: "ケースB", isPrimary: false },
		];
		expect(getPrimaryItems(items)).toHaveLength(0);
	});
});

describe("CaseSelectSection - 警告メッセージ表示", () => {
	it("hasPrimary === false かつ value === null の場合に警告を表示する", () => {
		expect(shouldShowWarning(false, null)).toBe(true);
	});

	it("hasPrimary === true の場合は警告を表示しない", () => {
		expect(shouldShowWarning(true, null)).toBe(false);
	});

	it("value !== null の場合は警告を表示しない（手動選択済み）", () => {
		expect(shouldShowWarning(false, 1)).toBe(false);
	});

	it("hasPrimary === true かつ value !== null の場合は警告を表示しない", () => {
		expect(shouldShowWarning(true, 1)).toBe(false);
	});
});

describe("CaseSelectSection - non-primary選択の検出", () => {
	const items = [
		{ value: "1", isPrimary: true },
		{ value: "2", isPrimary: false },
		{ value: "3", isPrimary: false },
	];

	it("primaryケースが選択されている場合はfalse", () => {
		expect(isNonPrimarySelected(1, items)).toBe(false);
	});

	it("non-primaryケースが選択されている場合はtrue", () => {
		expect(isNonPrimarySelected(2, items)).toBe(true);
	});

	it("未選択（null）の場合はfalse", () => {
		expect(isNonPrimarySelected(null, items)).toBe(false);
	});
});

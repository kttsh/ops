import { describe, expect, it } from "vitest";
import { resolveSelectedCaseId } from "@/features/indirect-case-study/hooks/simulation-utils";

describe("resolveSelectedCaseId", () => {
	it("指定IDがリスト内に存在する場合はそのまま返す", () => {
		const items = [
			{ id: 1, isPrimary: false },
			{ id: 2, isPrimary: true },
			{ id: 3, isPrimary: false },
		];
		expect(
			resolveSelectedCaseId(
				items,
				2,
				(item) => item.id,
				(item) => item.isPrimary,
			),
		).toBe(2);
	});

	it("指定IDがリスト内に存在する場合はプライマリでなくてもそのまま返す", () => {
		const items = [
			{ id: 1, isPrimary: false },
			{ id: 2, isPrimary: true },
			{ id: 3, isPrimary: false },
		];
		expect(
			resolveSelectedCaseId(
				items,
				3,
				(item) => item.id,
				(item) => item.isPrimary,
			),
		).toBe(3);
	});

	it("指定IDがリスト内に存在しない場合はプライマリケースにフォールバック", () => {
		const items = [
			{ id: 1, isPrimary: false },
			{ id: 2, isPrimary: true },
			{ id: 3, isPrimary: false },
		];
		expect(
			resolveSelectedCaseId(
				items,
				99,
				(item) => item.id,
				(item) => item.isPrimary,
			),
		).toBe(2);
	});

	it("指定IDが0（未指定）の場合はプライマリケースにフォールバック", () => {
		const items = [
			{ id: 1, isPrimary: false },
			{ id: 2, isPrimary: true },
		];
		expect(
			resolveSelectedCaseId(
				items,
				0,
				(item) => item.id,
				(item) => item.isPrimary,
			),
		).toBe(2);
	});

	it("プライマリケースも存在しない場合は0を返す", () => {
		const items = [
			{ id: 1, isPrimary: false },
			{ id: 3, isPrimary: false },
		];
		expect(
			resolveSelectedCaseId(
				items,
				99,
				(item) => item.id,
				(item) => item.isPrimary,
			),
		).toBe(0);
	});

	it("ケースリストが空の場合は0を返す", () => {
		expect(
			resolveSelectedCaseId(
				[] as Array<{ id: number; isPrimary: boolean }>,
				1,
				(item) => item.id,
				(item) => item.isPrimary,
			),
		).toBe(0);
	});

	it("ケースリストが空で指定IDも0の場合は0を返す", () => {
		expect(
			resolveSelectedCaseId(
				[] as Array<{ id: number; isPrimary: boolean }>,
				0,
				(item) => item.id,
				(item) => item.isPrimary,
			),
		).toBe(0);
	});
});

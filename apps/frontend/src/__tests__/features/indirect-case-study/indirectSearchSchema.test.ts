import { describe, expect, it } from "vitest";
import { z } from "zod";

/**
 * 間接工数画面のURL検索パラメータスキーマのバリデーションテスト
 *
 * スキーマはルートファイルで定義されるが、ここではスキーマ定義を
 * 再現してバリデーションロジック自体を検証する。
 */
const indirectSearchSchema = z.object({
	bu: z.string().catch("").default(""),
	headcountCaseId: z.number().catch(0).default(0),
	capacityScenarioId: z.number().catch(0).default(0),
	indirectWorkCaseId: z.number().catch(0).default(0),
});

describe("indirectSearchSchema", () => {
	it("正常な数値が正しくパースされる", () => {
		const result = indirectSearchSchema.parse({
			bu: "BU001",
			headcountCaseId: 5,
			capacityScenarioId: 3,
			indirectWorkCaseId: 7,
		});
		expect(result).toEqual({
			bu: "BU001",
			headcountCaseId: 5,
			capacityScenarioId: 3,
			indirectWorkCaseId: 7,
		});
	});

	it("パラメータ未指定時にデフォルト値（0）が適用される", () => {
		const result = indirectSearchSchema.parse({});
		expect(result).toEqual({
			bu: "",
			headcountCaseId: 0,
			capacityScenarioId: 0,
			indirectWorkCaseId: 0,
		});
	});

	it("不正な文字列値がデフォルト値（0）にフォールバックされる", () => {
		const result = indirectSearchSchema.parse({
			bu: "BU001",
			headcountCaseId: "abc",
			capacityScenarioId: "xyz",
			indirectWorkCaseId: "???",
		});
		expect(result.headcountCaseId).toBe(0);
		expect(result.capacityScenarioId).toBe(0);
		expect(result.indirectWorkCaseId).toBe(0);
	});

	it("nullがデフォルト値（0）にフォールバックされる", () => {
		const result = indirectSearchSchema.parse({
			headcountCaseId: null,
			capacityScenarioId: null,
			indirectWorkCaseId: null,
		});
		expect(result.headcountCaseId).toBe(0);
		expect(result.capacityScenarioId).toBe(0);
		expect(result.indirectWorkCaseId).toBe(0);
	});

	it("undefinedがデフォルト値（0）にフォールバックされる", () => {
		const result = indirectSearchSchema.parse({
			headcountCaseId: undefined,
			capacityScenarioId: undefined,
			indirectWorkCaseId: undefined,
		});
		expect(result.headcountCaseId).toBe(0);
		expect(result.capacityScenarioId).toBe(0);
		expect(result.indirectWorkCaseId).toBe(0);
	});

	it("負数は有効な数値として受け入れられる", () => {
		const result = indirectSearchSchema.parse({
			headcountCaseId: -1,
		});
		expect(result.headcountCaseId).toBe(-1);
	});

	it("小数は有効な数値として受け入れられる", () => {
		const result = indirectSearchSchema.parse({
			headcountCaseId: 1.5,
		});
		expect(result.headcountCaseId).toBe(1.5);
	});

	it("buパラメータの不正値はデフォルト空文字にフォールバック", () => {
		const result = indirectSearchSchema.parse({
			bu: 123,
		});
		expect(result.bu).toBe("");
	});
});

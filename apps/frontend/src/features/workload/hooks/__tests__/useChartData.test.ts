import { describe, expect, it } from "vitest";
import type { AreaSeriesConfig } from "../../types";
import {
	sortAreasByIndirectOrder,
	sortAreasByProjectOrder,
	sortLegendIndirectByOrder,
	sortLegendProjectsByOrder,
} from "../useChartData";

describe("sortAreasByProjectOrder", () => {
	const indirectArea: AreaSeriesConfig = {
		dataKey: "indirect_wt_001",
		stackId: "workload",
		fill: "#ccc",
		stroke: "#ccc",
		fillOpacity: 0.7,
		name: "間接作業",
		type: "indirect",
	};

	const makeProjectArea = (id: number, name: string): AreaSeriesConfig => ({
		dataKey: `project_${id}`,
		stackId: "workload",
		fill: "#aaa",
		stroke: "#aaa",
		fillOpacity: 0.8,
		name,
		type: "project",
	});

	const projA = makeProjectArea(1, "案件A");
	const projB = makeProjectArea(2, "案件B");
	const projC = makeProjectArea(3, "案件C");

	it("projectOrder が undefined の場合、元の順序を維持する", () => {
		const areas = [indirectArea, projA, projB, projC];
		const result = sortAreasByProjectOrder(areas, undefined);
		expect(result).toEqual(areas);
	});

	it("projectOrder に基づいて案件シリーズのみをソートする", () => {
		const areas = [indirectArea, projA, projB, projC];
		const result = sortAreasByProjectOrder(areas, [3, 1, 2]);
		expect(result.map((a) => a.dataKey)).toEqual([
			"indirect_wt_001",
			"project_3",
			"project_1",
			"project_2",
		]);
	});

	it("間接作業シリーズの位置は維持される", () => {
		const areas = [indirectArea, projA, projB];
		const result = sortAreasByProjectOrder(areas, [2, 1]);
		expect(result[0].type).toBe("indirect");
		expect(result[1].dataKey).toBe("project_2");
		expect(result[2].dataKey).toBe("project_1");
	});

	it("projectOrder に含まれない案件は末尾に配置される", () => {
		const areas = [indirectArea, projA, projB, projC];
		// projC (id=3) は projectOrder に含まれない
		const result = sortAreasByProjectOrder(areas, [2, 1]);
		expect(result.map((a) => a.dataKey)).toEqual([
			"indirect_wt_001",
			"project_2",
			"project_1",
			"project_3",
		]);
	});

	it("空の projectOrder の場合、元の順序を維持する", () => {
		const areas = [indirectArea, projA, projB];
		const result = sortAreasByProjectOrder(areas, []);
		// 全案件が projectOrder に含まれないので末尾に（元の相対順序を維持）
		expect(result.map((a) => a.dataKey)).toEqual([
			"indirect_wt_001",
			"project_1",
			"project_2",
		]);
	});
});

describe("sortLegendProjectsByOrder", () => {
	const projects = [
		{ projectId: 1, name: "案件A", manhour: 100 },
		{ projectId: 2, name: "案件B", manhour: 200 },
		{ projectId: 3, name: "案件C", manhour: 300 },
	];

	it("projectOrder が undefined の場合、元の順序を維持する", () => {
		const result = sortLegendProjectsByOrder(projects, undefined);
		expect(result).toEqual(projects);
	});

	it("projectOrder に基づいてソートする", () => {
		const result = sortLegendProjectsByOrder(projects, [3, 1, 2]);
		expect(result.map((p) => p.projectId)).toEqual([3, 1, 2]);
	});

	it("projectOrder に含まれない案件は末尾に配置される", () => {
		const result = sortLegendProjectsByOrder(projects, [2]);
		expect(result.map((p) => p.projectId)).toEqual([2, 1, 3]);
	});
});

describe("sortAreasByIndirectOrder", () => {
	const makeIndirectArea = (code: string, name: string): AreaSeriesConfig => ({
		dataKey: `indirect_wt_${code}`,
		stackId: "workload",
		fill: "#ccc",
		stroke: "#ccc",
		fillOpacity: 0.7,
		name,
		type: "indirect",
	});

	const makeProjectArea = (id: number, name: string): AreaSeriesConfig => ({
		dataKey: `project_${id}`,
		stackId: "workload",
		fill: "#aaa",
		stroke: "#aaa",
		fillOpacity: 0.8,
		name,
		type: "project",
	});

	const indA = makeIndirectArea("A01", "間接A");
	const indB = makeIndirectArea("B02", "間接B");
	const indC = makeIndirectArea("C03", "間接C");
	const unclassified = makeIndirectArea("unclassified", "未分類");
	const projX = makeProjectArea(1, "案件X");
	const projY = makeProjectArea(2, "案件Y");

	it("indirectWorkTypeOrder が undefined の場合、元の順序を維持する", () => {
		const areas = [indA, indB, indC, projX, projY];
		const result = sortAreasByIndirectOrder(areas, undefined);
		expect(result).toEqual(areas);
	});

	it("indirectWorkTypeOrder に基づいて間接シリーズのみをソートする", () => {
		const areas = [indA, indB, indC, projX, projY];
		const result = sortAreasByIndirectOrder(areas, ["C03", "A01", "B02"]);
		expect(result.map((a) => a.dataKey)).toEqual([
			"indirect_wt_C03",
			"indirect_wt_A01",
			"indirect_wt_B02",
			"project_1",
			"project_2",
		]);
	});

	it("案件シリーズの位置は変更されない", () => {
		const areas = [indA, indB, projX, projY];
		const result = sortAreasByIndirectOrder(areas, ["B02", "A01"]);
		expect(result[0].type).toBe("indirect");
		expect(result[1].type).toBe("indirect");
		expect(result[2].type).toBe("project");
		expect(result[3].type).toBe("project");
	});

	it("未分類シリーズは常に間接シリーズの末尾に配置される", () => {
		const areas = [indA, unclassified, indB, projX];
		const result = sortAreasByIndirectOrder(areas, ["B02", "A01"]);
		expect(result.map((a) => a.dataKey)).toEqual([
			"indirect_wt_B02",
			"indirect_wt_A01",
			"indirect_wt_unclassified",
			"project_1",
		]);
	});

	it("部分的な順序指定に対応する（未指定は末尾）", () => {
		const areas = [indA, indB, indC, projX];
		const result = sortAreasByIndirectOrder(areas, ["C03"]);
		expect(result.map((a) => a.dataKey)).toEqual([
			"indirect_wt_C03",
			"indirect_wt_A01",
			"indirect_wt_B02",
			"project_1",
		]);
	});
});

describe("sortLegendIndirectByOrder", () => {
	const items = [
		{ workTypeCode: "A01", workTypeName: "間接A", manhour: 100 },
		{ workTypeCode: "B02", workTypeName: "間接B", manhour: 200 },
		{ workTypeCode: "C03", workTypeName: "間接C", manhour: 300 },
	];

	it("indirectWorkTypeOrder が undefined の場合、元の順序を維持する", () => {
		const result = sortLegendIndirectByOrder(items, undefined);
		expect(result).toEqual(items);
	});

	it("indirectWorkTypeOrder に基づいてソートする", () => {
		const result = sortLegendIndirectByOrder(items, ["C03", "A01", "B02"]);
		expect(result.map((i) => i.workTypeCode)).toEqual(["C03", "A01", "B02"]);
	});

	it("未分類は常に末尾に来る", () => {
		const withUnclassified = [
			...items,
			{ workTypeCode: "unclassified", workTypeName: "未分類", manhour: 50 },
		];
		const result = sortLegendIndirectByOrder(withUnclassified, [
			"C03",
			"unclassified",
			"A01",
			"B02",
		]);
		expect(result.map((i) => i.workTypeCode)).toEqual([
			"C03",
			"A01",
			"B02",
			"unclassified",
		]);
	});

	it("順序に含まれない項目は末尾に配置される", () => {
		const result = sortLegendIndirectByOrder(items, ["B02"]);
		expect(result.map((i) => i.workTypeCode)).toEqual(["B02", "A01", "C03"]);
	});
});

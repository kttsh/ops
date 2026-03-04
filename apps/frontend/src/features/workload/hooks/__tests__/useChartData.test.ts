import { describe, expect, it } from "vitest";
import {
	sortAreasByProjectOrder,
	sortLegendProjectsByOrder,
} from "../useChartData";
import type { AreaSeriesConfig, LegendMonthData } from "../../types";

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

	const makeProjectArea = (
		id: number,
		name: string,
	): AreaSeriesConfig => ({
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

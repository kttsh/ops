import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/data/chartDataData", () => ({
	chartDataData: {
		getProjectDetailsByDefault: vi.fn(),
		getProjectDetailsByChartView: vi.fn(),
		getProjectDetailsWithCaseOverrides: vi.fn(),
		getIndirectWorkLoadsByDefault: vi.fn(),
		getIndirectWorkLoadsByChartView: vi.fn(),
		getCapacities: vi.fn(),
	},
}));

import { chartDataData } from "@/data/chartDataData";
import { chartDataService } from "@/services/chartDataService";
import type {
	CapacityRow,
	IndirectWorkLoadRow,
	ProjectDetailRow,
} from "@/types/chartData";

const mockedData = vi.mocked(chartDataData);

describe("chartDataService.getChartData", () => {
	const baseParams = {
		businessUnitCodes: ["BU001"],
		startYearMonth: "202504",
		endYearMonth: "202603",
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockedData.getProjectDetailsByDefault.mockResolvedValue([]);
		mockedData.getProjectDetailsByChartView.mockResolvedValue([]);
		mockedData.getProjectDetailsWithCaseOverrides.mockResolvedValue([]);
		mockedData.getIndirectWorkLoadsByDefault.mockResolvedValue([]);
		mockedData.getIndirectWorkLoadsByChartView.mockResolvedValue([]);
		mockedData.getCapacities.mockResolvedValue([]);
	});

	describe("chartViewId未指定時の分岐動作", () => {
		it("getProjectDetailsByDefault を呼び出す", async () => {
			await chartDataService.getChartData(baseParams);
			expect(mockedData.getProjectDetailsByDefault).toHaveBeenCalledWith({
				businessUnitCodes: ["BU001"],
				startYearMonth: "202504",
				endYearMonth: "202603",
			});
			expect(mockedData.getProjectDetailsByChartView).not.toHaveBeenCalled();
		});

		it("getIndirectWorkLoadsByDefault を呼び出す", async () => {
			await chartDataService.getChartData(baseParams);
			expect(mockedData.getIndirectWorkLoadsByDefault).toHaveBeenCalledWith({
				businessUnitCodes: ["BU001"],
				startYearMonth: "202504",
				endYearMonth: "202603",
				indirectWorkCaseIds: undefined,
			});
			expect(mockedData.getIndirectWorkLoadsByChartView).not.toHaveBeenCalled();
		});

		it("indirectWorkCaseIds指定時にそのまま渡す", async () => {
			await chartDataService.getChartData({
				...baseParams,
				indirectWorkCaseIds: [10, 20],
			});
			expect(mockedData.getIndirectWorkLoadsByDefault).toHaveBeenCalledWith({
				businessUnitCodes: ["BU001"],
				startYearMonth: "202504",
				endYearMonth: "202603",
				indirectWorkCaseIds: [10, 20],
			});
		});
	});

	describe("projectCaseIds指定時の分岐動作（chartViewId未指定）", () => {
		it("getProjectDetailsWithCaseOverrides を呼び出す", async () => {
			await chartDataService.getChartData({
				...baseParams,
				projectCaseIds: [101, 102],
			});
			expect(
				mockedData.getProjectDetailsWithCaseOverrides,
			).toHaveBeenCalledWith({
				businessUnitCodes: ["BU001"],
				startYearMonth: "202504",
				endYearMonth: "202603",
				projectCaseIds: [101, 102],
			});
			expect(mockedData.getProjectDetailsByDefault).not.toHaveBeenCalled();
			expect(mockedData.getProjectDetailsByChartView).not.toHaveBeenCalled();
		});

		it("projectIds も指定されている場合に両方渡す", async () => {
			await chartDataService.getChartData({
				...baseParams,
				projectIds: [1, 2],
				projectCaseIds: [101, 102],
			});
			expect(
				mockedData.getProjectDetailsWithCaseOverrides,
			).toHaveBeenCalledWith({
				businessUnitCodes: ["BU001"],
				startYearMonth: "202504",
				endYearMonth: "202603",
				projectIds: [1, 2],
				projectCaseIds: [101, 102],
			});
		});
	});

	describe("projectCaseIds指定時のデータ返却", () => {
		it("getProjectDetailsWithCaseOverrides のデータが変換されて返却される", async () => {
			const rows: ProjectDetailRow[] = [
				{
					projectId: 1,
					projectName: "案件A",
					projectTypeCode: "PT001",
					yearMonth: "202504",
					manhour: 150,
				},
				{
					projectId: 2,
					projectName: "案件B",
					projectTypeCode: null,
					yearMonth: "202504",
					manhour: 80,
				},
			];
			mockedData.getProjectDetailsWithCaseOverrides.mockResolvedValue(rows);

			const result = await chartDataService.getChartData({
				...baseParams,
				projectCaseIds: [101, 201],
			});

			expect(result.projectLoads).toHaveLength(2);
			expect(result.projectLoads[0]).toEqual({
				projectId: 1,
				projectName: "案件A",
				projectTypeCode: "PT001",
				monthly: [{ yearMonth: "202504", manhour: 150 }],
			});
			expect(result.projectLoads[1]).toEqual({
				projectId: 2,
				projectName: "案件B",
				projectTypeCode: null,
				monthly: [{ yearMonth: "202504", manhour: 80 }],
			});
		});

		it("不正なprojectCaseIds指定時もSQL層がisPrimaryフォールバックしたデータを返却する", async () => {
			// SQL層が不正なケースIDを無視しisPrimaryフォールバックした結果を返す想定
			const rows: ProjectDetailRow[] = [
				{
					projectId: 1,
					projectName: "案件A",
					projectTypeCode: "PT001",
					yearMonth: "202504",
					manhour: 100,
				},
			];
			mockedData.getProjectDetailsWithCaseOverrides.mockResolvedValue(rows);

			const result = await chartDataService.getChartData({
				...baseParams,
				projectCaseIds: [99999], // 存在しないケースID
			});

			expect(
				mockedData.getProjectDetailsWithCaseOverrides,
			).toHaveBeenCalledWith({
				businessUnitCodes: ["BU001"],
				startYearMonth: "202504",
				endYearMonth: "202603",
				projectCaseIds: [99999],
			});
			// SQL層がフォールバックしたデータがそのまま変換される
			expect(result.projectLoads).toHaveLength(1);
			expect(result.projectLoads[0].projectId).toBe(1);
		});
	});

	describe("chartViewId指定時はprojectCaseIdsより優先する", () => {
		it("chartViewId と projectCaseIds が両方指定された場合、chartViewId を優先する", async () => {
			await chartDataService.getChartData({
				...baseParams,
				chartViewId: 1,
				projectCaseIds: [101, 102],
			});
			expect(mockedData.getProjectDetailsByChartView).toHaveBeenCalledWith({
				chartViewId: 1,
				businessUnitCodes: ["BU001"],
				startYearMonth: "202504",
				endYearMonth: "202603",
			});
			expect(
				mockedData.getProjectDetailsWithCaseOverrides,
			).not.toHaveBeenCalled();
			expect(mockedData.getProjectDetailsByDefault).not.toHaveBeenCalled();
		});
	});

	describe("chartViewId指定時の分岐動作", () => {
		it("getProjectDetailsByChartView を呼び出す", async () => {
			await chartDataService.getChartData({ ...baseParams, chartViewId: 1 });
			expect(mockedData.getProjectDetailsByChartView).toHaveBeenCalledWith({
				chartViewId: 1,
				businessUnitCodes: ["BU001"],
				startYearMonth: "202504",
				endYearMonth: "202603",
			});
			expect(mockedData.getProjectDetailsByDefault).not.toHaveBeenCalled();
		});

		it("getIndirectWorkLoadsByChartView を呼び出す", async () => {
			await chartDataService.getChartData({ ...baseParams, chartViewId: 1 });
			expect(mockedData.getIndirectWorkLoadsByChartView).toHaveBeenCalledWith({
				chartViewId: 1,
				businessUnitCodes: ["BU001"],
				startYearMonth: "202504",
				endYearMonth: "202603",
			});
			expect(mockedData.getIndirectWorkLoadsByDefault).not.toHaveBeenCalled();
		});
	});

	describe("capacityScenarioIds の処理", () => {
		it("未指定時にキャパシティを空配列で返却する", async () => {
			const result = await chartDataService.getChartData(baseParams);
			expect(result.capacities).toEqual([]);
			expect(mockedData.getCapacities).not.toHaveBeenCalled();
		});

		it("指定時に getCapacities を呼び出す", async () => {
			await chartDataService.getChartData({
				...baseParams,
				capacityScenarioIds: [1, 2],
			});
			expect(mockedData.getCapacities).toHaveBeenCalledWith({
				capacityScenarioIds: [1, 2],
				businessUnitCodes: ["BU001"],
				startYearMonth: "202504",
				endYearMonth: "202603",
			});
		});

		it("chartViewId指定 + capacityScenarioIds未指定時も空配列", async () => {
			const result = await chartDataService.getChartData({
				...baseParams,
				chartViewId: 1,
			});
			expect(result.capacities).toEqual([]);
			expect(mockedData.getCapacities).not.toHaveBeenCalled();
		});
	});

	describe("メタ情報の付与", () => {
		it("period と businessUnitCodes が返却される", async () => {
			const result = await chartDataService.getChartData(baseParams);
			expect(result.period).toEqual({
				startYearMonth: "202504",
				endYearMonth: "202603",
			});
			expect(result.businessUnitCodes).toEqual(["BU001"]);
		});
	});

	describe("案件工数のネスト構造変換", () => {
		it("フラットデータを案件別にグループ化し月別配列にする", async () => {
			const rows: ProjectDetailRow[] = [
				{
					projectId: 1,
					projectName: "案件A",
					projectTypeCode: "PT001",
					yearMonth: "202504",
					manhour: 100,
				},
				{
					projectId: 1,
					projectName: "案件A",
					projectTypeCode: "PT001",
					yearMonth: "202505",
					manhour: 200,
				},
				{
					projectId: 2,
					projectName: "案件B",
					projectTypeCode: "PT002",
					yearMonth: "202504",
					manhour: 50,
				},
			];
			mockedData.getProjectDetailsByDefault.mockResolvedValue(rows);

			const result = await chartDataService.getChartData(baseParams);

			expect(result.projectLoads).toHaveLength(2);
			expect(result.projectLoads[0]).toEqual({
				projectId: 1,
				projectName: "案件A",
				projectTypeCode: "PT001",
				monthly: [
					{ yearMonth: "202504", manhour: 100 },
					{ yearMonth: "202505", manhour: 200 },
				],
			});
			expect(result.projectLoads[1]).toEqual({
				projectId: 2,
				projectName: "案件B",
				projectTypeCode: "PT002",
				monthly: [{ yearMonth: "202504", manhour: 50 }],
			});
		});

		it("projectTypeCode が null の場合も集約する", async () => {
			const rows: ProjectDetailRow[] = [
				{
					projectId: 3,
					projectName: "案件C",
					projectTypeCode: null,
					yearMonth: "202504",
					manhour: 30,
				},
			];
			mockedData.getProjectDetailsByDefault.mockResolvedValue(rows);

			const result = await chartDataService.getChartData(baseParams);

			expect(result.projectLoads).toHaveLength(1);
			expect(result.projectLoads[0].projectTypeCode).toBeNull();
			expect(result.projectLoads[0].projectId).toBe(3);
		});
	});

	describe("間接工数のネスト構造変換", () => {
		it("ケース×BU単位でグループ化し月別配列 + breakdown を構築する", async () => {
			const rows: IndirectWorkLoadRow[] = [
				{
					indirectWorkCaseId: 1,
					caseName: "共通業務",
					businessUnitCode: "BU001",
					yearMonth: "202504",
					manhour: 100,
					source: "calculated",
					workTypeCode: "WT01",
					workTypeName: "設計管理",
					workTypeDisplayOrder: 1,
					ratio: 0.3,
					typeManhour: 30,
				},
				{
					indirectWorkCaseId: 1,
					caseName: "共通業務",
					businessUnitCode: "BU001",
					yearMonth: "202504",
					manhour: 100,
					source: "calculated",
					workTypeCode: "WT02",
					workTypeName: "品質管理",
					workTypeDisplayOrder: 2,
					ratio: 0.5,
					typeManhour: 50,
				},
				{
					indirectWorkCaseId: 1,
					caseName: "共通業務",
					businessUnitCode: "BU001",
					yearMonth: "202505",
					manhour: 200,
					source: "manual",
					workTypeCode: "WT01",
					workTypeName: "設計管理",
					workTypeDisplayOrder: 1,
					ratio: 0.3,
					typeManhour: 60,
				},
			];
			mockedData.getIndirectWorkLoadsByDefault.mockResolvedValue(rows);

			const result = await chartDataService.getChartData(baseParams);

			expect(result.indirectWorkLoads).toHaveLength(1);
			const entry = result.indirectWorkLoads[0];
			expect(entry.indirectWorkCaseId).toBe(1);
			expect(entry.caseName).toBe("共通業務");
			expect(entry.businessUnitCode).toBe("BU001");
			expect(entry.monthly).toHaveLength(2);

			// 202504: breakdown = [WT01, WT02], coverage = 0.8
			expect(entry.monthly[0].yearMonth).toBe("202504");
			expect(entry.monthly[0].manhour).toBe(100);
			expect(entry.monthly[0].source).toBe("calculated");
			expect(entry.monthly[0].breakdown).toHaveLength(2);
			expect(entry.monthly[0].breakdown[0]).toEqual({
				workTypeCode: "WT01",
				workTypeName: "設計管理",
				manhour: 30,
			});
			expect(entry.monthly[0].breakdown[1]).toEqual({
				workTypeCode: "WT02",
				workTypeName: "品質管理",
				manhour: 50,
			});
			expect(entry.monthly[0].breakdownCoverage).toBe(0.8);

			// 202505: breakdown = [WT01], coverage = 0.3
			expect(entry.monthly[1].yearMonth).toBe("202505");
			expect(entry.monthly[1].breakdown).toHaveLength(1);
			expect(entry.monthly[1].breakdownCoverage).toBe(0.3);
		});

		it("比率未設定時はbreakdown空配列・breakdownCoverage 0", async () => {
			const rows: IndirectWorkLoadRow[] = [
				{
					indirectWorkCaseId: 1,
					caseName: "共通業務",
					businessUnitCode: "BU001",
					yearMonth: "202504",
					manhour: 100,
					source: "calculated",
					workTypeCode: null,
					workTypeName: null,
					workTypeDisplayOrder: null,
					ratio: null,
					typeManhour: null,
				},
			];
			mockedData.getIndirectWorkLoadsByDefault.mockResolvedValue(rows);

			const result = await chartDataService.getChartData(baseParams);

			expect(result.indirectWorkLoads[0].monthly[0].breakdown).toEqual([]);
			expect(result.indirectWorkLoads[0].monthly[0].breakdownCoverage).toBe(0);
		});

		it("比率合計が1.0を超えてもエラーとせずそのまま返却する", async () => {
			const rows: IndirectWorkLoadRow[] = [
				{
					indirectWorkCaseId: 1,
					caseName: "業務",
					businessUnitCode: "BU001",
					yearMonth: "202504",
					manhour: 100,
					source: "calculated",
					workTypeCode: "WT01",
					workTypeName: "設計管理",
					workTypeDisplayOrder: 1,
					ratio: 0.7,
					typeManhour: 70,
				},
				{
					indirectWorkCaseId: 1,
					caseName: "業務",
					businessUnitCode: "BU001",
					yearMonth: "202504",
					manhour: 100,
					source: "calculated",
					workTypeCode: "WT02",
					workTypeName: "品質管理",
					workTypeDisplayOrder: 2,
					ratio: 0.5,
					typeManhour: 50,
				},
			];
			mockedData.getIndirectWorkLoadsByDefault.mockResolvedValue(rows);

			const result = await chartDataService.getChartData(baseParams);

			const monthly = result.indirectWorkLoads[0].monthly[0];
			expect(monthly.breakdownCoverage).toBe(1.2);
			expect(monthly.breakdown).toHaveLength(2);
		});
	});

	describe("キャパシティのネスト構造変換", () => {
		it("シナリオID単位でグループ化しBU横断で月別にSUM集約する", async () => {
			const rows: CapacityRow[] = [
				{
					capacityScenarioId: 1,
					scenarioName: "標準",
					businessUnitCode: "BU001",
					yearMonth: "202504",
					capacity: 500,
				},
				{
					capacityScenarioId: 1,
					scenarioName: "標準",
					businessUnitCode: "BU002",
					yearMonth: "202504",
					capacity: 300,
				},
				{
					capacityScenarioId: 1,
					scenarioName: "標準",
					businessUnitCode: "BU001",
					yearMonth: "202505",
					capacity: 600,
				},
				{
					capacityScenarioId: 2,
					scenarioName: "楽観",
					businessUnitCode: "BU001",
					yearMonth: "202504",
					capacity: 700,
				},
			];
			mockedData.getCapacities.mockResolvedValue(rows);

			const result = await chartDataService.getChartData({
				...baseParams,
				capacityScenarioIds: [1, 2],
			});

			expect(result.capacities).toHaveLength(2);
			expect(result.capacities[0]).toEqual({
				capacityScenarioId: 1,
				scenarioName: "標準",
				monthly: [
					{ yearMonth: "202504", capacity: 800 },
					{ yearMonth: "202505", capacity: 600 },
				],
			});
			expect(result.capacities[1]).toEqual({
				capacityScenarioId: 2,
				scenarioName: "楽観",
				monthly: [{ yearMonth: "202504", capacity: 700 }],
			});
		});
	});
});

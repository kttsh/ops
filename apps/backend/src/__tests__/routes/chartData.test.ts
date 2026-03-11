import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/chartDataService", () => ({
	chartDataService: {
		getChartData: vi.fn(),
	},
}));

import app from "@/index";
import { chartDataService } from "@/services/chartDataService";

const mockedService = vi.mocked(chartDataService);

describe("GET /chart-data", () => {
	const mockResponse = {
		projectLoads: [],
		indirectWorkLoads: [],
		capacityLines: [],
		period: { startYearMonth: "202504", endYearMonth: "202603" },
		businessUnitCodes: ["BU001"],
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockedService.getChartData.mockResolvedValue(mockResponse);
	});

	it("全必須パラメータ指定時に200レスポンスで3セクション + メタ情報を返却する", async () => {
		const res = await app.request(
			"/api/ops/chart-data?businessUnitCodes=BU001&startYearMonth=202504&endYearMonth=202603",
		);

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.data).toHaveProperty("projectLoads");
		expect(json.data).toHaveProperty("indirectWorkLoads");
		expect(json.data).toHaveProperty("capacityLines");
		expect(json.data).toHaveProperty("period");
		expect(json.data).toHaveProperty("businessUnitCodes");
	});

	it("サービス関数に正しいパラメータを渡す", async () => {
		await app.request(
			"/api/ops/chart-data?businessUnitCodes=BU001,BU002&startYearMonth=202504&endYearMonth=202603&chartViewId=1&capacityScenarioIds=1,2&indirectWorkCaseIds=10,20&projectCaseIds=101,102",
		);

		expect(mockedService.getChartData).toHaveBeenCalledWith({
			businessUnitCodes: ["BU001", "BU002"],
			startYearMonth: "202504",
			endYearMonth: "202603",
			chartViewId: 1,
			capacityScenarioIds: [1, 2],
			indirectWorkCaseIds: [10, 20],
			projectCaseIds: [101, 102],
		});
	});

	it("レスポンスが { data: {...} } 構造で返却される", async () => {
		const res = await app.request(
			"/api/ops/chart-data?businessUnitCodes=BU001&startYearMonth=202504&endYearMonth=202603",
		);

		const json = await res.json();
		expect(json).toHaveProperty("data");
		expect(json.data.period).toEqual({
			startYearMonth: "202504",
			endYearMonth: "202603",
		});
		expect(json.data.businessUnitCodes).toEqual(["BU001"]);
	});

	describe("バリデーションエラー", () => {
		it("businessUnitCodes 未指定時に422エラーを返却する", async () => {
			const res = await app.request(
				"/api/ops/chart-data?startYearMonth=202504&endYearMonth=202603",
			);

			expect(res.status).toBe(422);
			const json = await res.json();
			expect(json).toHaveProperty("type");
			expect(json).toHaveProperty("status", 422);
			expect(json).toHaveProperty("title");
		});

		it("startYearMonth が不正形式の場合に422エラーを返却する", async () => {
			const res = await app.request(
				"/api/ops/chart-data?businessUnitCodes=BU001&startYearMonth=20250&endYearMonth=202603",
			);

			expect(res.status).toBe(422);
		});

		it("月が範囲外の場合に422エラーを返却する", async () => {
			const res = await app.request(
				"/api/ops/chart-data?businessUnitCodes=BU001&startYearMonth=202513&endYearMonth=202603",
			);

			expect(res.status).toBe(422);
		});

		it("startYearMonth > endYearMonth の場合に422エラーを返却する", async () => {
			const res = await app.request(
				"/api/ops/chart-data?businessUnitCodes=BU001&startYearMonth=202604&endYearMonth=202603",
			);

			expect(res.status).toBe(422);
		});

		it("期間が60ヶ月を超える場合に422エラーを返却する", async () => {
			const res = await app.request(
				"/api/ops/chart-data?businessUnitCodes=BU001&startYearMonth=202001&endYearMonth=202501",
			);

			expect(res.status).toBe(422);
		});
	});

	describe("キャパシティラインのレスポンス検証", () => {
		it("n×m本のキャパシティラインがcapacityLinesフィールドに含まれる", async () => {
			mockedService.getChartData.mockResolvedValue({
				...mockResponse,
				capacityLines: [
					{
						headcountPlanCaseId: 1,
						caseName: "標準",
						capacityScenarioId: 1,
						scenarioName: "定時160h",
						lineName: "標準(定時160h)",
						monthly: [{ yearMonth: "202504", capacity: 800 }],
					},
					{
						headcountPlanCaseId: 1,
						caseName: "標準",
						capacityScenarioId: 2,
						scenarioName: "残業180h",
						lineName: "標準(残業180h)",
						monthly: [{ yearMonth: "202504", capacity: 900 }],
					},
					{
						headcountPlanCaseId: 2,
						caseName: "増員",
						capacityScenarioId: 1,
						scenarioName: "定時160h",
						lineName: "増員(定時160h)",
						monthly: [{ yearMonth: "202504", capacity: 1200 }],
					},
					{
						headcountPlanCaseId: 2,
						caseName: "増員",
						capacityScenarioId: 2,
						scenarioName: "残業180h",
						lineName: "増員(残業180h)",
						monthly: [{ yearMonth: "202504", capacity: 1350 }],
					},
				],
			});

			const res = await app.request(
				"/api/ops/chart-data?businessUnitCodes=BU001&startYearMonth=202504&endYearMonth=202603",
			);

			expect(res.status).toBe(200);
			const json = await res.json();
			expect(json.data.capacityLines).toHaveLength(4);
			expect(json.data.capacityLines[0].lineName).toBe("標準(定時160h)");
			expect(json.data.capacityLines[3].lineName).toBe("増員(残業180h)");
		});

		it("ケースまたはシナリオが0件の場合に空のcapacityLinesが返却される", async () => {
			mockedService.getChartData.mockResolvedValue({
				...mockResponse,
				capacityLines: [],
			});

			const res = await app.request(
				"/api/ops/chart-data?businessUnitCodes=BU001&startYearMonth=202504&endYearMonth=202603",
			);

			expect(res.status).toBe(200);
			const json = await res.json();
			expect(json.data.capacityLines).toEqual([]);
		});

		it("キャパシティ値が既知の入力値で正しく返却される", async () => {
			mockedService.getChartData.mockResolvedValue({
				...mockResponse,
				capacityLines: [
					{
						headcountPlanCaseId: 1,
						caseName: "標準",
						capacityScenarioId: 1,
						scenarioName: "定時160h",
						lineName: "標準(定時160h)",
						monthly: [
							{ yearMonth: "202504", capacity: 480 },
							{ yearMonth: "202505", capacity: 640 },
						],
					},
				],
			});

			const res = await app.request(
				"/api/ops/chart-data?businessUnitCodes=BU001&startYearMonth=202504&endYearMonth=202603",
			);

			expect(res.status).toBe(200);
			const json = await res.json();
			const line = json.data.capacityLines[0];
			expect(line.headcountPlanCaseId).toBe(1);
			expect(line.capacityScenarioId).toBe(1);
			expect(line.lineName).toBe("標準(定時160h)");
			expect(line.monthly).toEqual([
				{ yearMonth: "202504", capacity: 480 },
				{ yearMonth: "202505", capacity: 640 },
			]);
		});

		it("削除済みケース・シナリオがキャパシティラインに含まれない（サービス層が除外済み）", async () => {
			// サービス層が deleted_at IS NOT NULL のケース・シナリオを除外した結果を返す
			mockedService.getChartData.mockResolvedValue({
				...mockResponse,
				capacityLines: [
					{
						headcountPlanCaseId: 1,
						caseName: "標準",
						capacityScenarioId: 1,
						scenarioName: "定時160h",
						lineName: "標準(定時160h)",
						monthly: [{ yearMonth: "202504", capacity: 480 }],
					},
				],
			});

			const res = await app.request(
				"/api/ops/chart-data?businessUnitCodes=BU001&startYearMonth=202504&endYearMonth=202603",
			);

			expect(res.status).toBe(200);
			const json = await res.json();
			// 削除済みケースID=2、削除済みシナリオID=2 は結果に含まれない
			expect(json.data.capacityLines).toHaveLength(1);
			expect(
				json.data.capacityLines.every(
					(line: { headcountPlanCaseId: number }) =>
						line.headcountPlanCaseId !== 2,
				),
			).toBe(true);
		});
	});

	it("オプショナルパラメータ未指定時も正常に動作する", async () => {
		const res = await app.request(
			"/api/ops/chart-data?businessUnitCodes=BU001&startYearMonth=202504&endYearMonth=202603",
		);

		expect(res.status).toBe(200);
		expect(mockedService.getChartData).toHaveBeenCalledWith({
			businessUnitCodes: ["BU001"],
			startYearMonth: "202504",
			endYearMonth: "202603",
			chartViewId: undefined,
			capacityScenarioIds: undefined,
			indirectWorkCaseIds: undefined,
			projectCaseIds: undefined,
		});
	});
});

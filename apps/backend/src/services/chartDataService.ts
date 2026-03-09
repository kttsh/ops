import { chartDataData } from "@/data/chartDataData";
import type {
	CapacityAggregation,
	CapacityRow,
	ChartDataResponse,
	ChartDataServiceParams,
	IndirectWorkLoadAggregation,
	IndirectWorkLoadRow,
	ProjectDetailRow,
	ProjectLoadAggregation,
} from "@/types/chartData";

function transformProjectLoads(
	detailRows: ProjectDetailRow[],
): ProjectLoadAggregation[] {
	const groups = new Map<number, ProjectLoadAggregation>();

	for (const row of detailRows) {
		if (!groups.has(row.projectId)) {
			groups.set(row.projectId, {
				projectId: row.projectId,
				projectName: row.projectName,
				projectTypeCode: row.projectTypeCode,
				monthly: [],
			});
		}

		groups.get(row.projectId)!.monthly.push({
			yearMonth: row.yearMonth,
			manhour: row.manhour,
		});
	}

	return Array.from(groups.values());
}

function transformIndirectWorkLoads(
	rows: IndirectWorkLoadRow[],
): IndirectWorkLoadAggregation[] {
	const groups = new Map<string, IndirectWorkLoadAggregation>();

	for (const row of rows) {
		const groupKey = `${row.indirectWorkCaseId}:${row.businessUnitCode}`;
		const _monthKey = `${groupKey}:${row.yearMonth}`;

		if (!groups.has(groupKey)) {
			groups.set(groupKey, {
				indirectWorkCaseId: row.indirectWorkCaseId,
				caseName: row.caseName,
				businessUnitCode: row.businessUnitCode,
				monthly: [],
			});
		}

		const group = groups.get(groupKey)!;
		let monthEntry = group.monthly.find((m) => m.yearMonth === row.yearMonth);

		if (!monthEntry) {
			monthEntry = {
				yearMonth: row.yearMonth,
				manhour: row.manhour,
				source: row.source as "calculated" | "manual",
				breakdown: [],
				breakdownCoverage: 0,
			};
			group.monthly.push(monthEntry);
		}

		if (
			row.workTypeCode !== null &&
			row.ratio !== null &&
			row.typeManhour !== null
		) {
			monthEntry.breakdown.push({
				workTypeCode: row.workTypeCode,
				workTypeName: row.workTypeName!,
				manhour: row.typeManhour,
			});
			monthEntry.breakdownCoverage =
				Math.round((monthEntry.breakdownCoverage + row.ratio) * 100) / 100;
		}
	}

	return Array.from(groups.values());
}

function transformCapacities(rows: CapacityRow[]): CapacityAggregation[] {
	const groups = new Map<
		number,
		{ scenarioName: string; monthlyMap: Map<string, number> }
	>();

	for (const row of rows) {
		if (!groups.has(row.capacityScenarioId)) {
			groups.set(row.capacityScenarioId, {
				scenarioName: row.scenarioName,
				monthlyMap: new Map(),
			});
		}

		const group = groups.get(row.capacityScenarioId)!;
		const current = group.monthlyMap.get(row.yearMonth) ?? 0;
		group.monthlyMap.set(row.yearMonth, current + row.capacity);
	}

	return Array.from(groups.entries()).map(([id, group]) => ({
		capacityScenarioId: id,
		scenarioName: group.scenarioName,
		monthly: Array.from(group.monthlyMap.entries()).map(
			([yearMonth, capacity]) => ({
				yearMonth,
				capacity,
			}),
		),
	}));
}

export const chartDataService = {
	async getChartData(
		params: ChartDataServiceParams,
	): Promise<ChartDataResponse> {
		// 案件工数（案件単位）
		// 分岐: chartViewId → projectCaseIds → デフォルト(isPrimary)
		let projectDetailRows: ProjectDetailRow[];
		if (params.chartViewId) {
			projectDetailRows =
				await chartDataData.getProjectDetailsByChartView({
					chartViewId: params.chartViewId,
					businessUnitCodes: params.businessUnitCodes,
					startYearMonth: params.startYearMonth,
					endYearMonth: params.endYearMonth,
					projectIds: params.projectIds,
				});
		} else if (
			params.projectCaseIds &&
			params.projectCaseIds.length > 0
		) {
			projectDetailRows =
				await chartDataData.getProjectDetailsWithCaseOverrides({
					businessUnitCodes: params.businessUnitCodes,
					startYearMonth: params.startYearMonth,
					endYearMonth: params.endYearMonth,
					projectIds: params.projectIds,
					projectCaseIds: params.projectCaseIds,
				});
		} else {
			projectDetailRows =
				await chartDataData.getProjectDetailsByDefault({
					businessUnitCodes: params.businessUnitCodes,
					startYearMonth: params.startYearMonth,
					endYearMonth: params.endYearMonth,
					projectIds: params.projectIds,
				});
		}

		// 間接工数
		const indirectWorkLoadRows = params.chartViewId
			? await chartDataData.getIndirectWorkLoadsByChartView({
					chartViewId: params.chartViewId,
					businessUnitCodes: params.businessUnitCodes,
					startYearMonth: params.startYearMonth,
					endYearMonth: params.endYearMonth,
				})
			: await chartDataData.getIndirectWorkLoadsByDefault({
					businessUnitCodes: params.businessUnitCodes,
					startYearMonth: params.startYearMonth,
					endYearMonth: params.endYearMonth,
					indirectWorkCaseIds: params.indirectWorkCaseIds,
				});

		// キャパシティ
		const capacities =
			params.capacityScenarioIds && params.capacityScenarioIds.length > 0
				? transformCapacities(
						await chartDataData.getCapacities({
							capacityScenarioIds: params.capacityScenarioIds,
							businessUnitCodes: params.businessUnitCodes,
							startYearMonth: params.startYearMonth,
							endYearMonth: params.endYearMonth,
						}),
					)
				: [];

		return {
			projectLoads: transformProjectLoads(projectDetailRows),
			indirectWorkLoads: transformIndirectWorkLoads(indirectWorkLoadRows),
			capacities,
			period: {
				startYearMonth: params.startYearMonth,
				endYearMonth: params.endYearMonth,
			},
			businessUnitCodes: params.businessUnitCodes,
		};
	},
};

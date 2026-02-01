import { Hono } from "hono";
import { chartDataService } from "@/services/chartDataService";
import { chartDataQuerySchema } from "@/types/chartData";
import { validate } from "@/utils/validate";

const app = new Hono().get(
	"/",
	validate("query", chartDataQuerySchema),
	async (c) => {
		const query = c.req.valid("query");

		const result = await chartDataService.getChartData({
			businessUnitCodes: query.businessUnitCodes,
			startYearMonth: query.startYearMonth,
			endYearMonth: query.endYearMonth,
			projectIds: query.projectIds,
			chartViewId: query.chartViewId,
			capacityScenarioIds: query.capacityScenarioIds,
			indirectWorkCaseIds: query.indirectWorkCaseIds,
		});

		return c.json({ data: result }, 200);
	},
);

export default app;

export type ChartDataRoute = typeof app;

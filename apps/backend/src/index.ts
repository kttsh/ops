import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import bulk from "@/routes/bulk";
import businessUnits from "@/routes/businessUnits";
import capacityScenarios from "@/routes/capacityScenarios";
import chartColorPalettes from "@/routes/chartColorPalettes";
import chartColorSettings from "@/routes/chartColorSettings";
import chartData from "@/routes/chartData";
import chartStackOrderSettings from "@/routes/chartStackOrderSettings";
import chartViewCapacityItems from "@/routes/chartViewCapacityItems";
import chartViewIndirectWorkItems from "@/routes/chartViewIndirectWorkItems";
import chartViewProjectItems from "@/routes/chartViewProjectItems";
import chartViews from "@/routes/chartViews";
import headcountPlanCases from "@/routes/headcountPlanCases";
import health from "@/routes/health";
import indirectWorkCases from "@/routes/indirectWorkCases";
import indirectWorkTypeRatios from "@/routes/indirectWorkTypeRatios";
import monthlyCapacities from "@/routes/monthlyCapacities";
import monthlyHeadcountPlans from "@/routes/monthlyHeadcountPlans";
import monthlyIndirectWorkLoads from "@/routes/monthlyIndirectWorkLoads";
import projectCases from "@/routes/projectCases";
import projectChangeHistory from "@/routes/projectChangeHistory";
import projectLoads from "@/routes/projectLoads";
import projects from "@/routes/projects";
import projectTypes from "@/routes/projectTypes";
import standardEffortMasters from "@/routes/standardEffortMasters";
import workTypes from "@/routes/workTypes";
import {
	getProblemType,
	getStatusTitle,
	problemResponse,
} from "@/utils/errorHelper";

const app = new Hono().basePath("/api/ops");

// 共通ミドルウェア
app.use("*", logger());
app.use("*", cors());
app.use("*", prettyJSON());

// グローバルエラーハンドラ
app.onError((err, c) => {
	if (err instanceof HTTPException) {
		const status = err.status as ContentfulStatusCode;

		return problemResponse(
			c,
			{
				type: `https://example.com/problems/${getProblemType(status)}`,
				status,
				title: getStatusTitle(status),
				detail: err.message,
				instance: c.req.path,
				timestamp: new Date().toISOString(),
			},
			status,
		);
	}

	console.error("Unexpected error:", err);

	return problemResponse(
		c,
		{
			type: "https://example.com/problems/internal-error",
			status: 500,
			title: "Internal Server Error",
			detail: "An unexpected error occurred",
			instance: c.req.path,
			timestamp: new Date().toISOString(),
		},
		500,
	);
});

// ルートのマウント
app.route("/bulk", bulk);
app.route("/business-units", businessUnits);
app.route("/project-types", projectTypes);
app.route("/work-types", workTypes);
app.route("/projects", projects);
app.route("/projects/:projectId/project-cases", projectCases);
app.route("/headcount-plan-cases", headcountPlanCases);
app.route("/indirect-work-cases", indirectWorkCases);
app.route("/chart-views", chartViews);
app.route("/capacity-scenarios", capacityScenarios);
app.route("/project-cases/:projectCaseId/project-loads", projectLoads);
app.route("/standard-effort-masters", standardEffortMasters);
app.route(
	"/headcount-plan-cases/:headcountPlanCaseId/monthly-headcount-plans",
	monthlyHeadcountPlans,
);
app.route(
	"/capacity-scenarios/:capacityScenarioId/monthly-capacities",
	monthlyCapacities,
);
app.route(
	"/indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads",
	monthlyIndirectWorkLoads,
);
app.route(
	"/indirect-work-cases/:indirectWorkCaseId/indirect-work-type-ratios",
	indirectWorkTypeRatios,
);
app.route(
	"/chart-views/:chartViewId/indirect-work-items",
	chartViewIndirectWorkItems,
);
app.route("/chart-views/:chartViewId/project-items", chartViewProjectItems);
app.route(
	"/chart-views/:chartViewId/capacity-items",
	chartViewCapacityItems,
);
app.route("/chart-color-palettes", chartColorPalettes);
app.route("/chart-color-settings", chartColorSettings);
app.route("/chart-stack-order-settings", chartStackOrderSettings);
app.route("/projects/:projectId/change-history", projectChangeHistory);

app.route("/chart-data", chartData);

app.route("/health", health);

// Not Found ハンドラ
app.notFound((c) => {
	return problemResponse(
		c,
		{
			type: "https://example.com/problems/resource-not-found",
			status: 404,
			title: "Resource Not Found",
			detail: `The requested resource '${c.req.path}' was not found`,
			instance: c.req.path,
			timestamp: new Date().toISOString(),
		},
		404,
	);
});

// サーバー起動（テスト時はインポートのみ使用）
if (process.env.NODE_ENV !== "test") {
	const port = Number(process.env.PORT) || 3000;
	console.log(`Server is running on http://localhost:${port}`);
	serve({ fetch: app.fetch, port });
}

export default app;

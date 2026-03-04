import { HttpResponse, http } from "msw";
import {
	mockProjectCases,
	mockProjectLoads,
	mockStandardEffortDetail,
	mockStandardEffortMasters,
} from "./data";

export const caseStudyHandlers = [
	http.get("/api/projects/:projectId/cases", () => {
		return HttpResponse.json({
			data: mockProjectCases,
			meta: { total: mockProjectCases.length },
		});
	}),
	http.get("/api/projects/:projectId/cases/:caseId/loads", () => {
		return HttpResponse.json({
			data: mockProjectLoads,
		});
	}),
	http.get("/api/standard-efforts", () => {
		return HttpResponse.json({
			data: mockStandardEffortMasters,
			meta: { total: mockStandardEffortMasters.length },
		});
	}),
	http.get("/api/standard-efforts/:id", () => {
		return HttpResponse.json({
			data: mockStandardEffortDetail,
		});
	}),
];

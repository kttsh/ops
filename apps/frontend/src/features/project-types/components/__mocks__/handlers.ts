import { HttpResponse, http } from "msw";
import { mockProjectTypes } from "./data";

export const projectTypesHandlers = [
	http.get("/api/project-types", () => {
		return HttpResponse.json({
			data: mockProjectTypes,
		});
	}),
	http.get("/api/project-types/select", () => {
		return HttpResponse.json({
			data: mockProjectTypes.map((pt) => ({
				value: pt.projectTypeCode,
				label: pt.name,
			})),
		});
	}),
];

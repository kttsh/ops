import { HttpResponse, http } from "msw";
import { mockProjects } from "./data";

export const projectsHandlers = [
	http.get("/api/projects", () => {
		return HttpResponse.json({
			data: mockProjects,
			meta: { total: mockProjects.length, page: 1, pageSize: 20 },
		});
	}),
	http.get("/api/projects/:id", ({ params }) => {
		const project = mockProjects.find((p) => p.projectId === Number(params.id));
		return project
			? HttpResponse.json({ data: project })
			: new HttpResponse(null, { status: 404 });
	}),
];

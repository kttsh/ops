import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
	bu: z.string().catch("").default(""),
	headcountCaseId: z.number().catch(0).default(0),
	capacityScenarioId: z.number().catch(0).default(0),
	indirectWorkCaseId: z.number().catch(0).default(0),
});

export const Route = createFileRoute("/indirect/")({
	validateSearch: searchSchema,
});

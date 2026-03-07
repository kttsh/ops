import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
	bu: z.string().catch("").default(""),
});

export const Route = createFileRoute("/indirect/simulation/")({
	validateSearch: searchSchema,
});

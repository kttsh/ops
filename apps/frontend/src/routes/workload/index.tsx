import { createFileRoute } from "@tanstack/react-router";
import { workloadSearchSchema } from "@/features/workload";

export const Route = createFileRoute("/workload/")({
	validateSearch: workloadSearchSchema,
});

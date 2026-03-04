import type {
	ProjectChangeHistory,
	ProjectChangeHistoryRow,
} from "@/types/projectChangeHistory";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toProjectChangeHistoryResponse = createFieldMapper<
	ProjectChangeHistoryRow,
	ProjectChangeHistory
>({
	projectChangeHistoryId: "project_change_history_id",
	projectId: "project_id",
	changeType: "change_type",
	fieldName: "field_name",
	oldValue: "old_value",
	newValue: "new_value",
	changedBy: "changed_by",
	changedAt: "changed_at",
});

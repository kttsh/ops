import type {
	ProjectChangeHistory,
	ProjectChangeHistoryRow,
} from "@/types/projectChangeHistory";

export function toProjectChangeHistoryResponse(
	row: ProjectChangeHistoryRow,
): ProjectChangeHistory {
	return {
		projectChangeHistoryId: row.project_change_history_id,
		projectId: row.project_id,
		changeType: row.change_type,
		fieldName: row.field_name,
		oldValue: row.old_value,
		newValue: row.new_value,
		changedBy: row.changed_by,
		changedAt: row.changed_at.toISOString(),
	};
}

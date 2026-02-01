import sql from "mssql";
import { getPool } from "@/database/client";
import type { ProjectChangeHistoryRow } from "@/types/projectChangeHistory";

export const projectChangeHistoryData = {
	async findAll(projectId: number): Promise<ProjectChangeHistoryRow[]> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("projectId", sql.Int, projectId)
			.query<ProjectChangeHistoryRow>(
				`SELECT project_change_history_id, project_id, change_type,
                field_name, old_value, new_value, changed_by, changed_at
         FROM project_change_history
         WHERE project_id = @projectId
         ORDER BY changed_at DESC`,
			);
		return result.recordset;
	},

	async findById(
		projectChangeHistoryId: number,
	): Promise<ProjectChangeHistoryRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("projectChangeHistoryId", sql.Int, projectChangeHistoryId)
			.query<ProjectChangeHistoryRow>(
				`SELECT project_change_history_id, project_id, change_type,
                field_name, old_value, new_value, changed_by, changed_at
         FROM project_change_history
         WHERE project_change_history_id = @projectChangeHistoryId`,
			);
		return result.recordset[0];
	},

	async create(data: {
		projectId: number;
		changeType: string;
		fieldName?: string;
		oldValue?: string;
		newValue?: string;
		changedBy: string;
	}): Promise<ProjectChangeHistoryRow> {
		const pool = await getPool();
		const insertResult = await pool
			.request()
			.input("projectId", sql.Int, data.projectId)
			.input("changeType", sql.VarChar, data.changeType)
			.input("fieldName", sql.VarChar, data.fieldName ?? null)
			.input("oldValue", sql.NVarChar, data.oldValue ?? null)
			.input("newValue", sql.NVarChar, data.newValue ?? null)
			.input("changedBy", sql.NVarChar, data.changedBy)
			.query<{ project_change_history_id: number }>(
				`INSERT INTO project_change_history (project_id, change_type, field_name, old_value, new_value, changed_by)
         OUTPUT INSERTED.project_change_history_id
         VALUES (@projectId, @changeType, @fieldName, @oldValue, @newValue, @changedBy)`,
			);

		const newId = insertResult.recordset[0].project_change_history_id;
		const row = await this.findById(newId);
		return row!;
	},

	async deleteById(projectChangeHistoryId: number): Promise<boolean> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("projectChangeHistoryId", sql.Int, projectChangeHistoryId)
			.query(
				`DELETE FROM project_change_history
         WHERE project_change_history_id = @projectChangeHistoryId`,
			);
		return result.rowsAffected[0] > 0;
	},

	async projectExists(projectId: number): Promise<boolean> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("projectId", sql.Int, projectId)
			.query<{ exists: boolean }>(
				`SELECT CASE
           WHEN EXISTS (SELECT 1 FROM projects WHERE project_id = @projectId AND deleted_at IS NULL)
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS [exists]`,
			);
		return result.recordset[0].exists;
	},
};

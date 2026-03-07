import sql from "mssql";
import { getPool } from "@/database/client";
import type {
	StandardEffortMasterRow,
	StandardEffortWeightRow,
	WeightItem,
} from "@/types/standardEffortMaster";

export const standardEffortMasterData = {
	async findAll(params: {
		page: number;
		pageSize: number;
		includeDisabled: boolean;
		businessUnitCode?: string;
		projectTypeCode?: string;
	}): Promise<{ items: StandardEffortMasterRow[]; totalCount: number }> {
		const pool = await getPool();
		const offset = (params.page - 1) * params.pageSize;

		const whereClauses: string[] = [];
		if (!params.includeDisabled) {
			whereClauses.push("deleted_at IS NULL");
		}
		if (params.businessUnitCode) {
			whereClauses.push("business_unit_code = @businessUnitCode");
		}
		if (params.projectTypeCode) {
			whereClauses.push("project_type_code = @projectTypeCode");
		}

		const whereClause =
			whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

		const itemsRequest = pool
			.request()
			.input("offset", sql.Int, offset)
			.input("pageSize", sql.Int, params.pageSize);

		const countRequest = pool.request();

		if (params.businessUnitCode) {
			itemsRequest.input(
				"businessUnitCode",
				sql.VarChar,
				params.businessUnitCode,
			);
			countRequest.input(
				"businessUnitCode",
				sql.VarChar,
				params.businessUnitCode,
			);
		}
		if (params.projectTypeCode) {
			itemsRequest.input(
				"projectTypeCode",
				sql.VarChar,
				params.projectTypeCode,
			);
			countRequest.input(
				"projectTypeCode",
				sql.VarChar,
				params.projectTypeCode,
			);
		}

		const itemsResult = await itemsRequest.query<StandardEffortMasterRow>(
			`SELECT standard_effort_id, business_unit_code, project_type_code, name, created_at, updated_at, deleted_at
       FROM standard_effort_masters
       ${whereClause}
       ORDER BY standard_effort_id ASC
       OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
		);

		const countResult = await countRequest.query<{ totalCount: number }>(
			`SELECT COUNT(*) AS totalCount FROM standard_effort_masters ${whereClause}`,
		);

		return {
			items: itemsResult.recordset,
			totalCount: countResult.recordset[0].totalCount,
		};
	},

	async findById(id: number): Promise<StandardEffortMasterRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.query<StandardEffortMasterRow>(
				`SELECT standard_effort_id, business_unit_code, project_type_code, name, created_at, updated_at, deleted_at
         FROM standard_effort_masters
         WHERE standard_effort_id = @id AND deleted_at IS NULL`,
			);

		return result.recordset[0];
	},

	async findByIdIncludingDeleted(
		id: number,
	): Promise<StandardEffortMasterRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.query<StandardEffortMasterRow>(
				`SELECT standard_effort_id, business_unit_code, project_type_code, name, created_at, updated_at, deleted_at
         FROM standard_effort_masters
         WHERE standard_effort_id = @id`,
			);

		return result.recordset[0];
	},

	async findByCompositeKey(
		businessUnitCode: string,
		projectTypeCode: string,
		name: string,
	): Promise<StandardEffortMasterRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("businessUnitCode", sql.VarChar, businessUnitCode)
			.input("projectTypeCode", sql.VarChar, projectTypeCode)
			.input("name", sql.NVarChar, name)
			.query<StandardEffortMasterRow>(
				`SELECT standard_effort_id, business_unit_code, project_type_code, name, created_at, updated_at, deleted_at
         FROM standard_effort_masters
         WHERE business_unit_code = @businessUnitCode
           AND project_type_code = @projectTypeCode
           AND name = @name
           AND deleted_at IS NULL`,
			);

		return result.recordset[0];
	},

	async findWeightsByMasterId(
		masterId: number,
	): Promise<StandardEffortWeightRow[]> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("masterId", sql.Int, masterId)
			.query<StandardEffortWeightRow>(
				`SELECT standard_effort_weight_id, standard_effort_id, progress_rate, weight, created_at, updated_at
         FROM standard_effort_weights
         WHERE standard_effort_id = @masterId
         ORDER BY progress_rate ASC`,
			);

		return result.recordset;
	},

	async create(data: {
		businessUnitCode: string;
		projectTypeCode: string;
		name: string;
		weights?: WeightItem[];
	}): Promise<StandardEffortMasterRow> {
		const pool = await getPool();
		const transaction = new sql.Transaction(pool);

		try {
			await transaction.begin();

			const masterResult = await transaction
				.request()
				.input("businessUnitCode", sql.VarChar, data.businessUnitCode)
				.input("projectTypeCode", sql.VarChar, data.projectTypeCode)
				.input("name", sql.NVarChar, data.name)
				.query<{ standard_effort_id: number }>(
					`INSERT INTO standard_effort_masters (business_unit_code, project_type_code, name)
           OUTPUT INSERTED.standard_effort_id
           VALUES (@businessUnitCode, @projectTypeCode, @name)`,
				);

			const masterId = masterResult.recordset[0].standard_effort_id;

			if (data.weights && data.weights.length > 0) {
				for (const w of data.weights) {
					await transaction
						.request()
						.input("masterId", sql.Int, masterId)
						.input("progressRate", sql.Int, w.progressRate)
						.input("weight", sql.Int, w.weight)
						.query(
							`INSERT INTO standard_effort_weights (standard_effort_id, progress_rate, weight)
               VALUES (@masterId, @progressRate, @weight)`,
						);
				}
			}

			await transaction.commit();

			const row = await this.findById(masterId);
			return row!;
		} catch (err) {
			await transaction.rollback();
			throw err;
		}
	},

	async update(
		id: number,
		data: {
			name?: string;
			weights?: WeightItem[];
		},
	): Promise<StandardEffortMasterRow | undefined> {
		const pool = await getPool();
		const hasWeights = data.weights !== undefined;
		const hasName = data.name !== undefined;

		if (!hasName && !hasWeights) {
			return this.findById(id);
		}

		if (hasWeights) {
			const transaction = new sql.Transaction(pool);

			try {
				await transaction.begin();

				if (hasName) {
					await transaction
						.request()
						.input("id", sql.Int, id)
						.input("name", sql.NVarChar, data.name)
						.query(
							`UPDATE standard_effort_masters
               SET name = @name, updated_at = GETDATE()
               WHERE standard_effort_id = @id AND deleted_at IS NULL`,
						);
				} else {
					await transaction
						.request()
						.input("id", sql.Int, id)
						.query(
							`UPDATE standard_effort_masters
               SET updated_at = GETDATE()
               WHERE standard_effort_id = @id AND deleted_at IS NULL`,
						);
				}

				await transaction
					.request()
					.input("masterId", sql.Int, id)
					.query(
						`DELETE FROM standard_effort_weights WHERE standard_effort_id = @masterId`,
					);

				for (const w of data.weights!) {
					await transaction
						.request()
						.input("masterId", sql.Int, id)
						.input("progressRate", sql.Int, w.progressRate)
						.input("weight", sql.Int, w.weight)
						.query(
							`INSERT INTO standard_effort_weights (standard_effort_id, progress_rate, weight)
               VALUES (@masterId, @progressRate, @weight)`,
						);
				}

				await transaction.commit();
			} catch (err) {
				await transaction.rollback();
				throw err;
			}
		} else {
			await pool
				.request()
				.input("id", sql.Int, id)
				.input("name", sql.NVarChar, data.name)
				.query(
					`UPDATE standard_effort_masters
           SET name = @name, updated_at = GETDATE()
           WHERE standard_effort_id = @id AND deleted_at IS NULL`,
				);
		}

		return this.findById(id);
	},

	async softDelete(id: number): Promise<StandardEffortMasterRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.query<StandardEffortMasterRow>(
				`UPDATE standard_effort_masters
         SET deleted_at = GETDATE(), updated_at = GETDATE()
         OUTPUT INSERTED.standard_effort_id, INSERTED.business_unit_code, INSERTED.project_type_code, INSERTED.name, INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
         WHERE standard_effort_id = @id AND deleted_at IS NULL`,
			);

		return result.recordset[0];
	},

	async restore(id: number): Promise<StandardEffortMasterRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.query<StandardEffortMasterRow>(
				`UPDATE standard_effort_masters
         SET deleted_at = NULL, updated_at = GETDATE()
         OUTPUT INSERTED.standard_effort_id, INSERTED.business_unit_code, INSERTED.project_type_code, INSERTED.name, INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
         WHERE standard_effort_id = @id AND deleted_at IS NOT NULL`,
			);

		return result.recordset[0];
	},

	async findAllForExport(businessUnitCode?: string): Promise<{
		masters: StandardEffortMasterRow[];
		weights: StandardEffortWeightRow[];
	}> {
		const pool = await getPool();

		const whereClauses = ["m.deleted_at IS NULL"];
		if (businessUnitCode) {
			whereClauses.push("m.business_unit_code = @businessUnitCode");
		}
		const whereClause = `WHERE ${whereClauses.join(" AND ")}`;

		const request = pool.request();
		if (businessUnitCode) {
			request.input("businessUnitCode", sql.VarChar, businessUnitCode);
		}

		const mastersResult = await request.query<StandardEffortMasterRow>(
			`SELECT standard_effort_id, business_unit_code, project_type_code, name, created_at, updated_at, deleted_at
       FROM standard_effort_masters m
       ${whereClause}
       ORDER BY standard_effort_id ASC`,
		);

		if (mastersResult.recordset.length === 0) {
			return { masters: [], weights: [] };
		}

		const masterIds = mastersResult.recordset.map((m) => m.standard_effort_id);
		const idList = masterIds.join(",");

		const weightsResult = await pool.request().query<StandardEffortWeightRow>(
			`SELECT standard_effort_weight_id, standard_effort_id, progress_rate, weight, created_at, updated_at
       FROM standard_effort_weights
       WHERE standard_effort_id IN (${idList})
       ORDER BY standard_effort_id ASC, progress_rate ASC`,
		);

		return {
			masters: mastersResult.recordset,
			weights: weightsResult.recordset,
		};
	},

	async bulkUpdateWeights(
		items: Array<{
			standardEffortId: number;
			weights: Array<{ progressRate: number; weight: number }>;
		}>,
	): Promise<{ updatedMasters: number; updatedWeights: number }> {
		const pool = await getPool();
		const transaction = new sql.Transaction(pool);

		try {
			await transaction.begin();

			let updatedMasters = 0;
			let updatedWeights = 0;

			for (const item of items) {
				// Verify master exists
				const checkResult = await transaction
					.request()
					.input("id", sql.Int, item.standardEffortId)
					.query<{ cnt: number }>(
						`SELECT COUNT(*) as cnt FROM standard_effort_masters WHERE standard_effort_id = @id AND deleted_at IS NULL`,
					);

				if (checkResult.recordset[0].cnt === 0) {
					await transaction.rollback();
					return { updatedMasters: -1, updatedWeights: item.standardEffortId };
				}

				// Delete existing weights
				await transaction
					.request()
					.input("masterId", sql.Int, item.standardEffortId)
					.query(
						`DELETE FROM standard_effort_weights WHERE standard_effort_id = @masterId`,
					);

				// Insert new weights
				for (const w of item.weights) {
					await transaction
						.request()
						.input("masterId", sql.Int, item.standardEffortId)
						.input("progressRate", sql.Int, w.progressRate)
						.input("weight", sql.Int, w.weight)
						.query(
							`INSERT INTO standard_effort_weights (standard_effort_id, progress_rate, weight)
               VALUES (@masterId, @progressRate, @weight)`,
						);
					updatedWeights++;
				}

				// Update timestamp
				await transaction
					.request()
					.input("id", sql.Int, item.standardEffortId)
					.query(
						`UPDATE standard_effort_masters SET updated_at = GETDATE() WHERE standard_effort_id = @id`,
					);

				updatedMasters++;
			}

			await transaction.commit();
			return { updatedMasters, updatedWeights };
		} catch (err) {
			await transaction.rollback();
			throw err;
		}
	},

	async hasReferences(id: number): Promise<boolean> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.query<{ hasRef: boolean }>(
				`SELECT CASE
           WHEN EXISTS (SELECT 1 FROM project_cases WHERE standard_effort_id = @id AND deleted_at IS NULL)
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS hasRef`,
			);

		return result.recordset[0].hasRef;
	},
};

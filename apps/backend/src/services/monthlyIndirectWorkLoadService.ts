import { HTTPException } from "hono/http-exception";
import { monthlyIndirectWorkLoadData } from "@/data/monthlyIndirectWorkLoadData";
import { toMonthlyIndirectWorkLoadResponse } from "@/transform/monthlyIndirectWorkLoadTransform";
import type {
	BulkUpsertMonthlyIndirectWorkLoad,
	CreateMonthlyIndirectWorkLoad,
	MonthlyIndirectWorkLoad,
	UpdateMonthlyIndirectWorkLoad,
} from "@/types/monthlyIndirectWorkLoad";

export const monthlyIndirectWorkLoadService = {
	async findAll(
		indirectWorkCaseId: number,
	): Promise<MonthlyIndirectWorkLoad[]> {
		const exists =
			await monthlyIndirectWorkLoadData.indirectWorkCaseExists(
				indirectWorkCaseId,
			);
		if (!exists) {
			throw new HTTPException(404, {
				message: `Indirect work case with ID '${indirectWorkCaseId}' not found`,
			});
		}

		const rows = await monthlyIndirectWorkLoadData.findAll(indirectWorkCaseId);
		return rows.map(toMonthlyIndirectWorkLoadResponse);
	},

	async findById(
		indirectWorkCaseId: number,
		monthlyIndirectWorkLoadId: number,
	): Promise<MonthlyIndirectWorkLoad> {
		const row = await monthlyIndirectWorkLoadData.findById(
			monthlyIndirectWorkLoadId,
		);
		if (!row) {
			throw new HTTPException(404, {
				message: `Monthly indirect work load with ID '${monthlyIndirectWorkLoadId}' not found`,
			});
		}
		if (row.indirect_work_case_id !== indirectWorkCaseId) {
			throw new HTTPException(404, {
				message: `Monthly indirect work load with ID '${monthlyIndirectWorkLoadId}' not found`,
			});
		}
		return toMonthlyIndirectWorkLoadResponse(row);
	},

	async create(
		indirectWorkCaseId: number,
		data: CreateMonthlyIndirectWorkLoad,
	): Promise<MonthlyIndirectWorkLoad> {
		const caseExists =
			await monthlyIndirectWorkLoadData.indirectWorkCaseExists(
				indirectWorkCaseId,
			);
		if (!caseExists) {
			throw new HTTPException(404, {
				message: `Indirect work case with ID '${indirectWorkCaseId}' not found`,
			});
		}

		const buExists = await monthlyIndirectWorkLoadData.businessUnitExists(
			data.businessUnitCode,
		);
		if (!buExists) {
			throw new HTTPException(422, {
				message: `Business unit with code '${data.businessUnitCode}' not found`,
			});
		}

		const duplicate = await monthlyIndirectWorkLoadData.uniqueKeyExists(
			indirectWorkCaseId,
			data.businessUnitCode,
			data.yearMonth,
		);
		if (duplicate) {
			throw new HTTPException(409, {
				message: `Monthly indirect work load for business unit '${data.businessUnitCode}' and year-month '${data.yearMonth}' already exists in indirect work case '${indirectWorkCaseId}'`,
			});
		}

		const created = await monthlyIndirectWorkLoadData.create({
			indirectWorkCaseId,
			businessUnitCode: data.businessUnitCode,
			yearMonth: data.yearMonth,
			manhour: data.manhour,
			source: data.source,
		});
		return toMonthlyIndirectWorkLoadResponse(created);
	},

	async update(
		indirectWorkCaseId: number,
		monthlyIndirectWorkLoadId: number,
		data: UpdateMonthlyIndirectWorkLoad,
	): Promise<MonthlyIndirectWorkLoad> {
		const existing = await monthlyIndirectWorkLoadData.findById(
			monthlyIndirectWorkLoadId,
		);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Monthly indirect work load with ID '${monthlyIndirectWorkLoadId}' not found`,
			});
		}
		if (existing.indirect_work_case_id !== indirectWorkCaseId) {
			throw new HTTPException(404, {
				message: `Monthly indirect work load with ID '${monthlyIndirectWorkLoadId}' not found`,
			});
		}

		if (data.businessUnitCode !== undefined) {
			const buExists = await monthlyIndirectWorkLoadData.businessUnitExists(
				data.businessUnitCode,
			);
			if (!buExists) {
				throw new HTTPException(422, {
					message: `Business unit with code '${data.businessUnitCode}' not found`,
				});
			}
		}

		const checkBusinessUnitCode =
			data.businessUnitCode ?? existing.business_unit_code;
		const checkYearMonth = data.yearMonth ?? existing.year_month;
		if (data.businessUnitCode !== undefined || data.yearMonth !== undefined) {
			const duplicate = await monthlyIndirectWorkLoadData.uniqueKeyExists(
				indirectWorkCaseId,
				checkBusinessUnitCode,
				checkYearMonth,
				monthlyIndirectWorkLoadId,
			);
			if (duplicate) {
				throw new HTTPException(409, {
					message: `Monthly indirect work load for business unit '${checkBusinessUnitCode}' and year-month '${checkYearMonth}' already exists in indirect work case '${indirectWorkCaseId}'`,
				});
			}
		}

		const updated = await monthlyIndirectWorkLoadData.update(
			monthlyIndirectWorkLoadId,
			data,
		);
		if (!updated) {
			throw new HTTPException(404, {
				message: `Monthly indirect work load with ID '${monthlyIndirectWorkLoadId}' not found`,
			});
		}
		return toMonthlyIndirectWorkLoadResponse(updated);
	},

	async delete(
		indirectWorkCaseId: number,
		monthlyIndirectWorkLoadId: number,
	): Promise<void> {
		const existing = await monthlyIndirectWorkLoadData.findById(
			monthlyIndirectWorkLoadId,
		);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Monthly indirect work load with ID '${monthlyIndirectWorkLoadId}' not found`,
			});
		}
		if (existing.indirect_work_case_id !== indirectWorkCaseId) {
			throw new HTTPException(404, {
				message: `Monthly indirect work load with ID '${monthlyIndirectWorkLoadId}' not found`,
			});
		}

		await monthlyIndirectWorkLoadData.deleteById(monthlyIndirectWorkLoadId);
	},

	async bulkUpsert(
		indirectWorkCaseId: number,
		data: BulkUpsertMonthlyIndirectWorkLoad,
	): Promise<MonthlyIndirectWorkLoad[]> {
		const caseExists =
			await monthlyIndirectWorkLoadData.indirectWorkCaseExists(
				indirectWorkCaseId,
			);
		if (!caseExists) {
			throw new HTTPException(404, {
				message: `Indirect work case with ID '${indirectWorkCaseId}' not found`,
			});
		}

		const keys = data.items.map(
			(item) => `${item.businessUnitCode}:${item.yearMonth}`,
		);
		const uniqueKeys = new Set(keys);
		if (uniqueKeys.size !== keys.length) {
			throw new HTTPException(422, {
				message:
					"Duplicate businessUnitCode + yearMonth combinations found in items array",
			});
		}

		const businessUnitCodes = data.items.map((item) => item.businessUnitCode);
		const allBuExist =
			await monthlyIndirectWorkLoadData.businessUnitsExist(businessUnitCodes);
		if (!allBuExist) {
			throw new HTTPException(422, {
				message: "One or more business unit codes not found",
			});
		}

		const rows = await monthlyIndirectWorkLoadData.bulkUpsert(
			indirectWorkCaseId,
			data.items,
		);
		return rows.map(toMonthlyIndirectWorkLoadResponse);
	},
};

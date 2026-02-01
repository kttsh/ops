import { HTTPException } from "hono/http-exception";
import { monthlyHeadcountPlanData } from "@/data/monthlyHeadcountPlanData";
import { toMonthlyHeadcountPlanResponse } from "@/transform/monthlyHeadcountPlanTransform";
import type {
	BulkUpsertMonthlyHeadcountPlan,
	CreateMonthlyHeadcountPlan,
	MonthlyHeadcountPlan,
	UpdateMonthlyHeadcountPlan,
} from "@/types/monthlyHeadcountPlan";

export const monthlyHeadcountPlanService = {
	async findAll(
		headcountPlanCaseId: number,
		businessUnitCode?: string,
	): Promise<MonthlyHeadcountPlan[]> {
		const exists =
			await monthlyHeadcountPlanData.headcountPlanCaseExists(
				headcountPlanCaseId,
			);
		if (!exists) {
			throw new HTTPException(404, {
				message: `Headcount plan case with ID '${headcountPlanCaseId}' not found`,
			});
		}

		const rows = await monthlyHeadcountPlanData.findAll(
			headcountPlanCaseId,
			businessUnitCode,
		);
		return rows.map(toMonthlyHeadcountPlanResponse);
	},

	async findById(
		headcountPlanCaseId: number,
		monthlyHeadcountPlanId: number,
	): Promise<MonthlyHeadcountPlan> {
		const row = await monthlyHeadcountPlanData.findById(monthlyHeadcountPlanId);
		if (!row) {
			throw new HTTPException(404, {
				message: `Monthly headcount plan with ID '${monthlyHeadcountPlanId}' not found`,
			});
		}
		if (row.headcount_plan_case_id !== headcountPlanCaseId) {
			throw new HTTPException(404, {
				message: `Monthly headcount plan with ID '${monthlyHeadcountPlanId}' not found`,
			});
		}
		return toMonthlyHeadcountPlanResponse(row);
	},

	async create(
		headcountPlanCaseId: number,
		data: CreateMonthlyHeadcountPlan,
	): Promise<MonthlyHeadcountPlan> {
		const caseExists =
			await monthlyHeadcountPlanData.headcountPlanCaseExists(
				headcountPlanCaseId,
			);
		if (!caseExists) {
			throw new HTTPException(404, {
				message: `Headcount plan case with ID '${headcountPlanCaseId}' not found`,
			});
		}

		const buExists = await monthlyHeadcountPlanData.businessUnitExists(
			data.businessUnitCode,
		);
		if (!buExists) {
			throw new HTTPException(404, {
				message: `Business unit with code '${data.businessUnitCode}' not found`,
			});
		}

		const duplicate = await monthlyHeadcountPlanData.uniqueConstraintExists(
			headcountPlanCaseId,
			data.businessUnitCode,
			data.yearMonth,
		);
		if (duplicate) {
			throw new HTTPException(409, {
				message: `Monthly headcount plan for business unit '${data.businessUnitCode}' and year-month '${data.yearMonth}' already exists in headcount plan case '${headcountPlanCaseId}'`,
			});
		}

		const created = await monthlyHeadcountPlanData.create({
			headcountPlanCaseId,
			businessUnitCode: data.businessUnitCode,
			yearMonth: data.yearMonth,
			headcount: data.headcount,
		});
		return toMonthlyHeadcountPlanResponse(created);
	},

	async update(
		headcountPlanCaseId: number,
		monthlyHeadcountPlanId: number,
		data: UpdateMonthlyHeadcountPlan,
	): Promise<MonthlyHeadcountPlan> {
		const existing = await monthlyHeadcountPlanData.findById(
			monthlyHeadcountPlanId,
		);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Monthly headcount plan with ID '${monthlyHeadcountPlanId}' not found`,
			});
		}
		if (existing.headcount_plan_case_id !== headcountPlanCaseId) {
			throw new HTTPException(404, {
				message: `Monthly headcount plan with ID '${monthlyHeadcountPlanId}' not found`,
			});
		}

		if (data.businessUnitCode !== undefined) {
			const buExists = await monthlyHeadcountPlanData.businessUnitExists(
				data.businessUnitCode,
			);
			if (!buExists) {
				throw new HTTPException(404, {
					message: `Business unit with code '${data.businessUnitCode}' not found`,
				});
			}
		}

		if (data.businessUnitCode !== undefined || data.yearMonth !== undefined) {
			const checkBu = data.businessUnitCode ?? existing.business_unit_code;
			const checkYm = data.yearMonth ?? existing.year_month;
			const duplicate = await monthlyHeadcountPlanData.uniqueConstraintExists(
				headcountPlanCaseId,
				checkBu,
				checkYm,
				monthlyHeadcountPlanId,
			);
			if (duplicate) {
				throw new HTTPException(409, {
					message: `Monthly headcount plan for business unit '${checkBu}' and year-month '${checkYm}' already exists in headcount plan case '${headcountPlanCaseId}'`,
				});
			}
		}

		const updated = await monthlyHeadcountPlanData.update(
			monthlyHeadcountPlanId,
			data,
		);
		if (!updated) {
			throw new HTTPException(404, {
				message: `Monthly headcount plan with ID '${monthlyHeadcountPlanId}' not found`,
			});
		}
		return toMonthlyHeadcountPlanResponse(updated);
	},

	async delete(
		headcountPlanCaseId: number,
		monthlyHeadcountPlanId: number,
	): Promise<void> {
		const existing = await monthlyHeadcountPlanData.findById(
			monthlyHeadcountPlanId,
		);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Monthly headcount plan with ID '${monthlyHeadcountPlanId}' not found`,
			});
		}
		if (existing.headcount_plan_case_id !== headcountPlanCaseId) {
			throw new HTTPException(404, {
				message: `Monthly headcount plan with ID '${monthlyHeadcountPlanId}' not found`,
			});
		}

		await monthlyHeadcountPlanData.deleteById(monthlyHeadcountPlanId);
	},

	async bulkUpsert(
		headcountPlanCaseId: number,
		data: BulkUpsertMonthlyHeadcountPlan,
	): Promise<MonthlyHeadcountPlan[]> {
		const caseExists =
			await monthlyHeadcountPlanData.headcountPlanCaseExists(
				headcountPlanCaseId,
			);
		if (!caseExists) {
			throw new HTTPException(404, {
				message: `Headcount plan case with ID '${headcountPlanCaseId}' not found`,
			});
		}

		const keys = data.items.map(
			(item) => `${item.businessUnitCode}:${item.yearMonth}`,
		);
		const uniqueKeys = new Set(keys);
		if (uniqueKeys.size !== keys.length) {
			throw new HTTPException(422, {
				message:
					"Duplicate businessUnitCode and yearMonth combination found in items array",
			});
		}

		const businessUnitCodes = [
			...new Set(data.items.map((item) => item.businessUnitCode)),
		];
		const busExist =
			await monthlyHeadcountPlanData.businessUnitsExist(businessUnitCodes);
		if (!busExist) {
			throw new HTTPException(404, {
				message: "One or more business units not found",
			});
		}

		const rows = await monthlyHeadcountPlanData.bulkUpsert(
			headcountPlanCaseId,
			data.items,
		);
		return rows.map(toMonthlyHeadcountPlanResponse);
	},
};

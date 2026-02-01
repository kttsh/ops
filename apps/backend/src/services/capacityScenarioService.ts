import { HTTPException } from "hono/http-exception";
import { capacityScenarioData } from "@/data/capacityScenarioData";
import { monthlyCapacityData } from "@/data/monthlyCapacityData";
import { monthlyHeadcountPlanData } from "@/data/monthlyHeadcountPlanData";
import { toCapacityScenarioResponse } from "@/transform/capacityScenarioTransform";
import { toMonthlyCapacityResponse } from "@/transform/monthlyCapacityTransform";
import type {
	CalculateCapacity,
	CalculateCapacityResult,
	CapacityScenario,
	CreateCapacityScenario,
	UpdateCapacityScenario,
} from "@/types/capacityScenario";

export const capacityScenarioService = {
	async findAll(params: {
		page: number;
		pageSize: number;
		includeDisabled: boolean;
	}): Promise<{ items: CapacityScenario[]; totalCount: number }> {
		const result = await capacityScenarioData.findAll(params);
		return {
			items: result.items.map(toCapacityScenarioResponse),
			totalCount: result.totalCount,
		};
	},

	async findById(id: number): Promise<CapacityScenario> {
		const row = await capacityScenarioData.findById(id);
		if (!row) {
			throw new HTTPException(404, {
				message: `Capacity scenario with ID '${id}' not found`,
			});
		}
		return toCapacityScenarioResponse(row);
	},

	async create(data: CreateCapacityScenario): Promise<CapacityScenario> {
		const created = await capacityScenarioData.create({
			scenarioName: data.scenarioName,
			isPrimary: data.isPrimary ?? false,
			description: data.description ?? null,
			hoursPerPerson: data.hoursPerPerson,
		});
		return toCapacityScenarioResponse(created);
	},

	async update(
		id: number,
		data: UpdateCapacityScenario,
	): Promise<CapacityScenario> {
		const updated = await capacityScenarioData.update(id, data);
		if (!updated) {
			throw new HTTPException(404, {
				message: `Capacity scenario with ID '${id}' not found`,
			});
		}
		return toCapacityScenarioResponse(updated);
	},

	async delete(id: number): Promise<void> {
		const hasRefs = await capacityScenarioData.hasReferences(id);
		if (hasRefs) {
			throw new HTTPException(409, {
				message: `Capacity scenario with ID '${id}' is referenced by other resources and cannot be deleted`,
			});
		}
		const deleted = await capacityScenarioData.softDelete(id);
		if (!deleted) {
			throw new HTTPException(404, {
				message: `Capacity scenario with ID '${id}' not found`,
			});
		}
	},

	async restore(id: number): Promise<CapacityScenario> {
		const existing = await capacityScenarioData.findByIdIncludingDeleted(id);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Capacity scenario with ID '${id}' not found`,
			});
		}
		if (!existing.deleted_at) {
			throw new HTTPException(409, {
				message: `Capacity scenario with ID '${id}' is not soft-deleted`,
			});
		}
		const restored = await capacityScenarioData.restore(id);
		return toCapacityScenarioResponse(restored!);
	},

	async calculate(
		capacityScenarioId: number,
		data: CalculateCapacity,
	): Promise<CalculateCapacityResult> {
		// 1. シナリオ存在確認
		const scenario = await capacityScenarioData.findById(capacityScenarioId);
		if (!scenario) {
			throw new HTTPException(404, {
				message: `Capacity scenario with ID '${capacityScenarioId}' not found`,
			});
		}

		// 2. 人員計画ケース存在確認
		const caseExists = await monthlyHeadcountPlanData.headcountPlanCaseExists(
			data.headcountPlanCaseId,
		);
		if (!caseExists) {
			throw new HTTPException(404, {
				message: `Headcount plan case with ID '${data.headcountPlanCaseId}' not found`,
			});
		}

		// 3. 人員計画データ取得
		const headcountRows = await monthlyHeadcountPlanData.findForCalculation({
			headcountPlanCaseId: data.headcountPlanCaseId,
			businessUnitCodes: data.businessUnitCodes,
			yearMonthFrom: data.yearMonthFrom,
			yearMonthTo: data.yearMonthTo,
		});

		// 4. データ不在時 422
		if (headcountRows.length === 0) {
			throw new HTTPException(422, {
				message: "No headcount plan data found for the specified conditions",
			});
		}

		// 5. capacity = headcount × hoursPerPerson
		const hoursPerPerson = scenario.hours_per_person;
		const capacityItems = headcountRows.map((row) => ({
			businessUnitCode: row.business_unit_code,
			yearMonth: row.year_month,
			capacity: row.headcount * hoursPerPerson,
		}));

		// 6. bulkUpsert で格納
		const upsertedRows = await monthlyCapacityData.bulkUpsert(
			capacityScenarioId,
			capacityItems,
		);

		// 7. 結果返却
		return {
			calculated: capacityItems.length,
			hoursPerPerson,
			items: upsertedRows.map(toMonthlyCapacityResponse),
		};
	},
};

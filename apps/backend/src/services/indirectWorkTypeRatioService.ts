import { HTTPException } from "hono/http-exception";
import { indirectWorkTypeRatioData } from "@/data/indirectWorkTypeRatioData";
import { toIndirectWorkTypeRatioResponse } from "@/transform/indirectWorkTypeRatioTransform";
import type {
	BulkUpsertIndirectWorkTypeRatio,
	CreateIndirectWorkTypeRatio,
	IndirectWorkTypeRatio,
	UpdateIndirectWorkTypeRatio,
} from "@/types/indirectWorkTypeRatio";

export const indirectWorkTypeRatioService = {
	async findAll(indirectWorkCaseId: number): Promise<IndirectWorkTypeRatio[]> {
		const exists =
			await indirectWorkTypeRatioData.indirectWorkCaseExists(
				indirectWorkCaseId,
			);
		if (!exists) {
			throw new HTTPException(404, {
				message: `Indirect work case with ID '${indirectWorkCaseId}' not found`,
			});
		}

		const rows = await indirectWorkTypeRatioData.findAll(indirectWorkCaseId);
		return rows.map(toIndirectWorkTypeRatioResponse);
	},

	async findById(
		indirectWorkCaseId: number,
		indirectWorkTypeRatioId: number,
	): Promise<IndirectWorkTypeRatio> {
		const row = await indirectWorkTypeRatioData.findById(
			indirectWorkTypeRatioId,
		);
		if (!row) {
			throw new HTTPException(404, {
				message: `Indirect work type ratio with ID '${indirectWorkTypeRatioId}' not found`,
			});
		}
		if (row.indirect_work_case_id !== indirectWorkCaseId) {
			throw new HTTPException(404, {
				message: `Indirect work type ratio with ID '${indirectWorkTypeRatioId}' not found`,
			});
		}
		return toIndirectWorkTypeRatioResponse(row);
	},

	async create(
		indirectWorkCaseId: number,
		data: CreateIndirectWorkTypeRatio,
	): Promise<IndirectWorkTypeRatio> {
		const exists =
			await indirectWorkTypeRatioData.indirectWorkCaseExists(
				indirectWorkCaseId,
			);
		if (!exists) {
			throw new HTTPException(404, {
				message: `Indirect work case with ID '${indirectWorkCaseId}' not found`,
			});
		}

		const workTypeExists = await indirectWorkTypeRatioData.workTypeExists(
			data.workTypeCode,
		);
		if (!workTypeExists) {
			throw new HTTPException(422, {
				message: `Work type with code '${data.workTypeCode}' not found`,
			});
		}

		const duplicate = await indirectWorkTypeRatioData.compositeKeyExists(
			indirectWorkCaseId,
			data.workTypeCode,
			data.fiscalYear,
		);
		if (duplicate) {
			throw new HTTPException(409, {
				message: `Indirect work type ratio for work type '${data.workTypeCode}' and fiscal year '${data.fiscalYear}' already exists`,
			});
		}

		const created = await indirectWorkTypeRatioData.create({
			indirectWorkCaseId,
			workTypeCode: data.workTypeCode,
			fiscalYear: data.fiscalYear,
			ratio: data.ratio,
		});
		return toIndirectWorkTypeRatioResponse(created);
	},

	async update(
		indirectWorkCaseId: number,
		indirectWorkTypeRatioId: number,
		data: UpdateIndirectWorkTypeRatio,
	): Promise<IndirectWorkTypeRatio> {
		const existing = await indirectWorkTypeRatioData.findById(
			indirectWorkTypeRatioId,
		);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Indirect work type ratio with ID '${indirectWorkTypeRatioId}' not found`,
			});
		}
		if (existing.indirect_work_case_id !== indirectWorkCaseId) {
			throw new HTTPException(404, {
				message: `Indirect work type ratio with ID '${indirectWorkTypeRatioId}' not found`,
			});
		}

		const effectiveWorkTypeCode = data.workTypeCode ?? existing.work_type_code;
		const effectiveFiscalYear = data.fiscalYear ?? existing.fiscal_year;

		if (data.workTypeCode !== undefined || data.fiscalYear !== undefined) {
			const duplicate = await indirectWorkTypeRatioData.compositeKeyExists(
				indirectWorkCaseId,
				effectiveWorkTypeCode,
				effectiveFiscalYear,
				indirectWorkTypeRatioId,
			);
			if (duplicate) {
				throw new HTTPException(409, {
					message: `Indirect work type ratio for work type '${effectiveWorkTypeCode}' and fiscal year '${effectiveFiscalYear}' already exists`,
				});
			}
		}

		const updated = await indirectWorkTypeRatioData.update(
			indirectWorkTypeRatioId,
			data,
		);
		if (!updated) {
			throw new HTTPException(404, {
				message: `Indirect work type ratio with ID '${indirectWorkTypeRatioId}' not found`,
			});
		}
		return toIndirectWorkTypeRatioResponse(updated);
	},

	async delete(
		indirectWorkCaseId: number,
		indirectWorkTypeRatioId: number,
	): Promise<void> {
		const existing = await indirectWorkTypeRatioData.findById(
			indirectWorkTypeRatioId,
		);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Indirect work type ratio with ID '${indirectWorkTypeRatioId}' not found`,
			});
		}
		if (existing.indirect_work_case_id !== indirectWorkCaseId) {
			throw new HTTPException(404, {
				message: `Indirect work type ratio with ID '${indirectWorkTypeRatioId}' not found`,
			});
		}

		await indirectWorkTypeRatioData.deleteById(indirectWorkTypeRatioId);
	},

	async bulkUpsert(
		indirectWorkCaseId: number,
		data: BulkUpsertIndirectWorkTypeRatio,
	): Promise<IndirectWorkTypeRatio[]> {
		const exists =
			await indirectWorkTypeRatioData.indirectWorkCaseExists(
				indirectWorkCaseId,
			);
		if (!exists) {
			throw new HTTPException(404, {
				message: `Indirect work case with ID '${indirectWorkCaseId}' not found`,
			});
		}

		const keys = data.items.map(
			(item) => `${item.workTypeCode}:${item.fiscalYear}`,
		);
		const uniqueKeys = new Set(keys);
		if (uniqueKeys.size !== keys.length) {
			throw new HTTPException(422, {
				message:
					"Duplicate workTypeCode + fiscalYear combinations found in items array",
			});
		}

		const rows = await indirectWorkTypeRatioData.bulkUpsert(
			indirectWorkCaseId,
			data.items,
		);
		return rows.map(toIndirectWorkTypeRatioResponse);
	},
};

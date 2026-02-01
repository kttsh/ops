import { HTTPException } from "hono/http-exception";
import { businessUnitData } from "@/data/businessUnitData";
import { projectTypeData } from "@/data/projectTypeData";
import { standardEffortMasterData } from "@/data/standardEffortMasterData";
import {
	toDetailResponse,
	toSummaryResponse,
} from "@/transform/standardEffortMasterTransform";
import type {
	CreateStandardEffortMaster,
	StandardEffortMasterDetail,
	StandardEffortMasterSummary,
	UpdateStandardEffortMaster,
} from "@/types/standardEffortMaster";

export const standardEffortMasterService = {
	async findAll(params: {
		page: number;
		pageSize: number;
		includeDisabled: boolean;
		businessUnitCode?: string;
		projectTypeCode?: string;
	}): Promise<{ items: StandardEffortMasterSummary[]; totalCount: number }> {
		const result = await standardEffortMasterData.findAll(params);
		return {
			items: result.items.map(toSummaryResponse),
			totalCount: result.totalCount,
		};
	},

	async findById(id: number): Promise<StandardEffortMasterDetail> {
		const row = await standardEffortMasterData.findById(id);
		if (!row) {
			throw new HTTPException(404, {
				message: `Standard effort master with ID '${id}' not found`,
			});
		}

		const weights = await standardEffortMasterData.findWeightsByMasterId(id);
		return toDetailResponse(row, weights);
	},

	async create(
		data: CreateStandardEffortMaster,
	): Promise<StandardEffortMasterDetail> {
		const bu = await businessUnitData.findByCode(data.businessUnitCode);
		if (!bu) {
			throw new HTTPException(422, {
				message: `Business unit with code '${data.businessUnitCode}' not found`,
			});
		}

		const pt = await projectTypeData.findByCode(data.projectTypeCode);
		if (!pt) {
			throw new HTTPException(422, {
				message: `Project type with code '${data.projectTypeCode}' not found`,
			});
		}

		const existing = await standardEffortMasterData.findByCompositeKey(
			data.businessUnitCode,
			data.projectTypeCode,
			data.name,
		);
		if (existing) {
			throw new HTTPException(409, {
				message: `Standard effort master with name '${data.name}' already exists for business unit '${data.businessUnitCode}' and project type '${data.projectTypeCode}'`,
			});
		}

		const created = await standardEffortMasterData.create(data);
		const weights = await standardEffortMasterData.findWeightsByMasterId(
			created.standard_effort_id,
		);
		return toDetailResponse(created, weights);
	},

	async update(
		id: number,
		data: UpdateStandardEffortMaster,
	): Promise<StandardEffortMasterDetail> {
		const existing = await standardEffortMasterData.findById(id);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Standard effort master with ID '${id}' not found`,
			});
		}

		if (data.name !== undefined) {
			const duplicated = await standardEffortMasterData.findByCompositeKey(
				existing.business_unit_code,
				existing.project_type_code,
				data.name,
			);
			if (duplicated && duplicated.standard_effort_id !== id) {
				throw new HTTPException(409, {
					message: `Standard effort master with name '${data.name}' already exists for business unit '${existing.business_unit_code}' and project type '${existing.project_type_code}'`,
				});
			}
		}

		const updated = await standardEffortMasterData.update(id, data);
		if (!updated) {
			throw new HTTPException(404, {
				message: `Standard effort master with ID '${id}' not found`,
			});
		}

		const weights = await standardEffortMasterData.findWeightsByMasterId(id);
		return toDetailResponse(updated, weights);
	},

	async delete(id: number): Promise<void> {
		const existing = await standardEffortMasterData.findById(id);
		if (!existing) {
			throw new HTTPException(404, {
				message: `Standard effort master with ID '${id}' not found`,
			});
		}

		const hasRefs = await standardEffortMasterData.hasReferences(id);
		if (hasRefs) {
			throw new HTTPException(409, {
				message: `Standard effort master with ID '${id}' is referenced by other resources and cannot be deleted`,
			});
		}

		await standardEffortMasterData.softDelete(id);
	},

	async restore(id: number): Promise<StandardEffortMasterDetail> {
		const existing =
			await standardEffortMasterData.findByIdIncludingDeleted(id);
		if (!existing || !existing.deleted_at) {
			throw new HTTPException(404, {
				message: `Standard effort master with ID '${id}' not found`,
			});
		}

		const duplicated = await standardEffortMasterData.findByCompositeKey(
			existing.business_unit_code,
			existing.project_type_code,
			existing.name,
		);
		if (duplicated) {
			throw new HTTPException(409, {
				message: `Standard effort master with name '${existing.name}' already exists for business unit '${existing.business_unit_code}' and project type '${existing.project_type_code}'`,
			});
		}

		const restored = await standardEffortMasterData.restore(id);
		const weights = await standardEffortMasterData.findWeightsByMasterId(id);
		return toDetailResponse(restored!, weights);
	},
};

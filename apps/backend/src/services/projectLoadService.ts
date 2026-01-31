import { HTTPException } from 'hono/http-exception'
import { projectLoadData } from '@/data/projectLoadData'
import { toProjectLoadResponse } from '@/transform/projectLoadTransform'
import type { ProjectLoad, CreateProjectLoad, UpdateProjectLoad, BulkUpsertProjectLoad } from '@/types/projectLoad'

export const projectLoadService = {
  async findAll(projectCaseId: number): Promise<ProjectLoad[]> {
    const exists = await projectLoadData.projectCaseExists(projectCaseId)
    if (!exists) {
      throw new HTTPException(404, {
        message: `Project case with ID '${projectCaseId}' not found`,
      })
    }

    const rows = await projectLoadData.findAll(projectCaseId)
    return rows.map(toProjectLoadResponse)
  },

  async findById(projectCaseId: number, projectLoadId: number): Promise<ProjectLoad> {
    const row = await projectLoadData.findById(projectLoadId)
    if (!row) {
      throw new HTTPException(404, {
        message: `Project load with ID '${projectLoadId}' not found`,
      })
    }
    if (row.project_case_id !== projectCaseId) {
      throw new HTTPException(404, {
        message: `Project load with ID '${projectLoadId}' not found`,
      })
    }
    return toProjectLoadResponse(row)
  },

  async create(projectCaseId: number, data: CreateProjectLoad): Promise<ProjectLoad> {
    const exists = await projectLoadData.projectCaseExists(projectCaseId)
    if (!exists) {
      throw new HTTPException(404, {
        message: `Project case with ID '${projectCaseId}' not found`,
      })
    }

    const duplicate = await projectLoadData.yearMonthExists(projectCaseId, data.yearMonth)
    if (duplicate) {
      throw new HTTPException(409, {
        message: `Project load for year-month '${data.yearMonth}' already exists in project case '${projectCaseId}'`,
      })
    }

    const created = await projectLoadData.create({
      projectCaseId,
      yearMonth: data.yearMonth,
      manhour: data.manhour,
    })
    return toProjectLoadResponse(created)
  },

  async update(
    projectCaseId: number,
    projectLoadId: number,
    data: UpdateProjectLoad,
  ): Promise<ProjectLoad> {
    const existing = await projectLoadData.findById(projectLoadId)
    if (!existing) {
      throw new HTTPException(404, {
        message: `Project load with ID '${projectLoadId}' not found`,
      })
    }
    if (existing.project_case_id !== projectCaseId) {
      throw new HTTPException(404, {
        message: `Project load with ID '${projectLoadId}' not found`,
      })
    }

    if (data.yearMonth !== undefined) {
      const duplicate = await projectLoadData.yearMonthExists(
        projectCaseId,
        data.yearMonth,
        projectLoadId,
      )
      if (duplicate) {
        throw new HTTPException(409, {
          message: `Project load for year-month '${data.yearMonth}' already exists in project case '${projectCaseId}'`,
        })
      }
    }

    const updated = await projectLoadData.update(projectLoadId, data)
    if (!updated) {
      throw new HTTPException(404, {
        message: `Project load with ID '${projectLoadId}' not found`,
      })
    }
    return toProjectLoadResponse(updated)
  },

  async delete(projectCaseId: number, projectLoadId: number): Promise<void> {
    const existing = await projectLoadData.findById(projectLoadId)
    if (!existing) {
      throw new HTTPException(404, {
        message: `Project load with ID '${projectLoadId}' not found`,
      })
    }
    if (existing.project_case_id !== projectCaseId) {
      throw new HTTPException(404, {
        message: `Project load with ID '${projectLoadId}' not found`,
      })
    }

    await projectLoadData.deleteById(projectLoadId)
  },

  async bulkUpsert(projectCaseId: number, data: BulkUpsertProjectLoad): Promise<ProjectLoad[]> {
    const exists = await projectLoadData.projectCaseExists(projectCaseId)
    if (!exists) {
      throw new HTTPException(404, {
        message: `Project case with ID '${projectCaseId}' not found`,
      })
    }

    const yearMonths = data.items.map((item) => item.yearMonth)
    const uniqueYearMonths = new Set(yearMonths)
    if (uniqueYearMonths.size !== yearMonths.length) {
      throw new HTTPException(422, {
        message: 'Duplicate yearMonth values found in items array',
      })
    }

    const rows = await projectLoadData.bulkUpsert(projectCaseId, data.items)
    return rows.map(toProjectLoadResponse)
  },
}

import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  businessUnitsQueryOptions,
  businessUnitSearchSchema,
  useRestoreBusinessUnit,
  ApiError,
} from '@/features/business-units'
import type { BusinessUnit } from '@/features/business-units'
import { DataTable } from '@/features/business-units/components/DataTable'
import { DataTableToolbar } from '@/features/business-units/components/DataTableToolbar'
import { RestoreConfirmDialog } from '@/features/business-units/components/RestoreConfirmDialog'
import { createColumns } from '@/features/business-units/components/columns'
import { zodValidator } from '@tanstack/zod-adapter'

export const Route = createFileRoute('/master/business-units/')({
  validateSearch: zodValidator(businessUnitSearchSchema),
  component: BusinessUnitListPage,
})

function BusinessUnitListPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null)

  const { data, isLoading, isError, error } = useQuery(
    businessUnitsQueryOptions({
      page: search.page,
      pageSize: search.pageSize,
      includeDisabled: search.includeDisabled,
    }),
  )

  const restoreMutation = useRestoreBusinessUnit()

  const columns = useMemo(
    () =>
      createColumns({
        onRestore: search.includeDisabled ? (code) => setRestoreTarget(code) : undefined,
      }),
    [search.includeDisabled],
  )

  const handleSearchChange = (value: string) => {
    navigate({ search: (prev) => ({ ...prev, search: value, page: 1 }) })
  }

  const handleIncludeDisabledChange = (value: boolean) => {
    navigate({ search: (prev) => ({ ...prev, includeDisabled: value, page: 1 }) })
  }

  const handlePageChange = (page: number) => {
    navigate({ search: (prev) => ({ ...prev, page }) })
  }

  const handlePageSizeChange = (pageSize: number) => {
    navigate({ search: (prev) => ({ ...prev, pageSize, page: 1 }) })
  }

  const handleRestore = async () => {
    if (!restoreTarget) return
    try {
      await restoreMutation.mutateAsync(restoreTarget)
      toast.success('復元しました')
      setRestoreTarget(null)
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message, { duration: Infinity })
      }
      setRestoreTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">ビジネスユニット</h2>
        <p className="text-sm text-muted-foreground mt-1">
          ビジネスユニットの一覧を管理します
        </p>
      </div>

      <DataTableToolbar
        search={search.search}
        onSearchChange={handleSearchChange}
        includeDisabled={search.includeDisabled}
        onIncludeDisabledChange={handleIncludeDisabledChange}
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        globalFilter={search.search}
        pagination={{
          currentPage: search.page,
          pageSize: search.pageSize,
          totalItems: data?.meta.pagination.totalItems ?? 0,
          totalPages: data?.meta.pagination.totalPages ?? 0,
        }}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message}
        rowClassName={(row: BusinessUnit) => (row.deletedAt ? 'opacity-50' : '')}
      />

      <RestoreConfirmDialog
        open={!!restoreTarget}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
        onConfirm={handleRestore}
        isLoading={restoreMutation.isPending}
      />
    </div>
  )
}

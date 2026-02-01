import { useState, useCallback, useMemo } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronRight } from 'lucide-react'
import {
  projectCaseQueryOptions,
  projectLoadsQueryOptions,
  useDeleteProjectCase,
  ApiError,
} from '@/features/case-study'
import type { ProjectCase } from '@/features/case-study'
import { projectQueryOptions } from '@/features/projects'
import { CaseSidebar } from '@/features/case-study/components/CaseSidebar'
import { WorkloadCard } from '@/features/case-study/components/WorkloadCard'
import { WorkloadChart } from '@/features/case-study/components/WorkloadChart'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'

export const Route = createFileRoute(
  '/master/projects/$projectId/case-study/',
)({
  component: CaseStudyPage,
})

function CaseStudyPage() {
  const { projectId } = Route.useParams()
  const navigate = useNavigate()
  const id = Number(projectId)

  // 案件情報（パンくず用）
  const { data: projectData } = useQuery(projectQueryOptions(id))
  const project = projectData?.data

  // 選択中ケース
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null)

  // 削除ダイアログ
  const [caseToDelete, setCaseToDelete] = useState<ProjectCase | null>(null)
  const deleteMutation = useDeleteProjectCase()

  // チャートデータ（編集中のリアルタイム反映用）
  const [chartData, setChartData] = useState<
    Array<{ yearMonth: string; manhour: number }>
  >([])

  // 選択ケースの詳細
  const { data: caseData } = useQuery({
    ...projectCaseQueryOptions(id, selectedCaseId ?? 0),
    enabled: selectedCaseId != null && selectedCaseId > 0,
  })
  const selectedCase = caseData?.data ?? null

  // 月別工数
  const { data: loadsData } = useQuery({
    ...projectLoadsQueryOptions(selectedCaseId ?? 0),
    enabled: selectedCaseId != null && selectedCaseId > 0,
  })
  const projectLoads = loadsData?.data ?? []

  // チャート用データ（編集中はeditedを使い、それ以外はAPIデータ）
  const displayChartData = useMemo(() => {
    if (chartData.length > 0) return chartData
    return projectLoads.map((pl) => ({
      yearMonth: pl.yearMonth,
      manhour: pl.manhour,
    }))
  }, [chartData, projectLoads])

  const handleWorkloadsChange = useCallback(
    (workloads: Array<{ yearMonth: string; manhour: number }>) => {
      setChartData(workloads)
    },
    [],
  )

  const handleSelectCase = useCallback((caseId: number) => {
    setSelectedCaseId(caseId)
    setChartData([])
  }, [])

  const handleNewCase = useCallback(() => {
    navigate({
      to: '/master/projects/$projectId/case-study/new',
      params: { projectId },
    })
  }, [navigate, projectId])

  const handleEditCase = useCallback(
    (caseId: number) => {
      navigate({
        to: '/master/projects/$projectId/case-study/$caseId/edit',
        params: { projectId, caseId: String(caseId) },
      })
    },
    [navigate, projectId],
  )

  const handleDeleteCase = useCallback((pc: ProjectCase) => {
    setCaseToDelete(pc)
  }, [])

  const handleConfirmDelete = async () => {
    if (!caseToDelete) return
    try {
      await deleteMutation.mutateAsync({
        projectId: id,
        projectCaseId: caseToDelete.projectCaseId,
      })
      if (selectedCaseId === caseToDelete.projectCaseId) {
        setSelectedCaseId(null)
        setChartData([])
      }
      setCaseToDelete(null)
    } catch (err) {
      if (err instanceof ApiError && err.problemDetails.status === 409) {
        toast.error('他のデータから参照されているため削除できません', {
          duration: Infinity,
        })
      }
      setCaseToDelete(null)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* パンくず */}
      <nav className="flex items-center gap-1 border-b border-border px-4 py-2 text-sm text-muted-foreground">
        <Link
          to="/master/projects"
          className="hover:text-foreground transition-colors"
        >
          案件一覧
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          to="/master/projects/$projectId"
          params={{ projectId }}
          className="hover:text-foreground transition-colors"
        >
          {project?.name ?? '案件詳細'}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">ケーススタディ</span>
      </nav>

      {/* メインエリア */}
      <div className="flex flex-1 overflow-hidden">
        {/* サイドバー */}
        <div className="w-64 shrink-0 border-r border-border overflow-y-auto p-3">
          <CaseSidebar
            projectId={id}
            selectedCaseId={selectedCaseId}
            onSelectCase={handleSelectCase}
            onNewCase={handleNewCase}
            onEditCase={handleEditCase}
            onDeleteCase={handleDeleteCase}
          />
        </div>

        {/* 右側コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!selectedCase ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">
                ケースを選択してください
              </p>
            </div>
          ) : (
            <>
              <WorkloadCard
                projectCase={selectedCase}
                projectLoads={projectLoads}
                onWorkloadsChange={handleWorkloadsChange}
              />
              <WorkloadChart data={displayChartData} />
            </>
          )}
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      <DeleteConfirmDialog
        open={caseToDelete !== null}
        onOpenChange={(open) => !open && setCaseToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
        entityLabel="ケース"
        entityName={caseToDelete?.caseName ?? ''}
      />
    </div>
  )
}

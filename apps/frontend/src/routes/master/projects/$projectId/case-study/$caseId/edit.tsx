import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronRight } from 'lucide-react'
import {
  projectCaseQueryOptions,
  useUpdateProjectCase,
  ApiError,
} from '@/features/case-study'
import { projectQueryOptions } from '@/features/projects'
import { CaseForm } from '@/features/case-study/components/CaseForm'

export const Route = createFileRoute(
  '/master/projects/$projectId/case-study/$caseId/edit',
)({
  component: CaseStudyEditPage,
})

function CaseStudyEditPage() {
  const { projectId, caseId } = Route.useParams()
  const navigate = Route.useNavigate()
  const pId = Number(projectId)
  const cId = Number(caseId)

  const { data: projectData } = useQuery(projectQueryOptions(pId))
  const project = projectData?.data

  const { data: caseData, isLoading } = useQuery(
    projectCaseQueryOptions(pId, cId),
  )
  const updateMutation = useUpdateProjectCase()

  const handleSubmit = async (values: {
    caseName: string
    calculationType: 'STANDARD' | 'MANUAL'
    standardEffortId: number | null
    description: string | null
    isPrimary: boolean
    startYearMonth: string | null
    durationMonths: number | null
    totalManhour: number | null
  }) => {
    try {
      await updateMutation.mutateAsync({
        projectId: pId,
        projectCaseId: cId,
        input: values,
      })
      toast.success('ケースを更新しました')
      navigate({
        to: '/master/projects/$projectId/case-study',
        params: { projectId },
      })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.problemDetails.status === 404) {
          toast.error('ケースが見つかりません', { duration: Infinity })
        } else if (err.problemDetails.status === 422) {
          toast.error('入力内容にエラーがあります', { duration: Infinity })
        } else {
          toast.error('ケースの更新に失敗しました', { duration: Infinity })
        }
      }
    }
  }

  const handleCancel = () => {
    navigate({
      to: '/master/projects/$projectId/case-study',
      params: { projectId },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <p className="text-lg font-medium">ケースが見つかりません</p>
        <Link
          to="/master/projects/$projectId/case-study"
          params={{ projectId }}
          className="text-sm text-primary hover:underline"
        >
          ケーススタディに戻る
        </Link>
      </div>
    )
  }

  const pc = caseData.data

  return (
    <div className="space-y-6 p-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
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
        <Link
          to="/master/projects/$projectId/case-study"
          params={{ projectId }}
          className="hover:text-foreground transition-colors"
        >
          ケーススタディ
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">ケース編集</span>
      </nav>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">ケース編集</h2>
        <p className="text-sm text-muted-foreground mt-1">
          ケーススタディの内容を編集します
        </p>
      </div>

      <div className="rounded-2xl border shadow-sm p-6">
        <CaseForm
          mode="edit"
          defaultValues={{
            caseName: pc.caseName,
            calculationType: pc.calculationType,
            standardEffortId: pc.standardEffortId,
            description: pc.description,
            isPrimary: pc.isPrimary,
            startYearMonth: pc.startYearMonth,
            durationMonths: pc.durationMonths,
            totalManhour: pc.totalManhour,
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}

import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronRight } from 'lucide-react'
import { useCreateProjectCase, ApiError } from '@/features/case-study'
import { projectQueryOptions } from '@/features/projects'
import { CaseForm } from '@/features/case-study/components/CaseForm'

export const Route = createFileRoute(
  '/master/projects/$projectId/case-study/new',
)({
  component: CaseStudyNewPage,
})

function CaseStudyNewPage() {
  const { projectId } = Route.useParams()
  const navigate = Route.useNavigate()
  const id = Number(projectId)

  const { data: projectData } = useQuery(projectQueryOptions(id))
  const project = projectData?.data

  const createMutation = useCreateProjectCase()

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
      await createMutation.mutateAsync({
        projectId: id,
        input: values,
      })
      toast.success('ケースを作成しました')
      navigate({
        to: '/master/projects/$projectId/case-study',
        params: { projectId },
      })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.problemDetails.status === 409) {
          toast.error('同一名称のケースが既に存在します', { duration: Infinity })
        } else if (err.problemDetails.status === 422) {
          toast.error('入力内容にエラーがあります', { duration: Infinity })
        } else {
          toast.error('ケースの作成に失敗しました', { duration: Infinity })
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
        <span className="text-foreground font-medium">新規作成</span>
      </nav>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">新規ケース作成</h2>
        <p className="text-sm text-muted-foreground mt-1">
          新しいケーススタディを作成します
        </p>
      </div>

      <div className="rounded-2xl border shadow-sm p-6">
        <CaseForm
          mode="create"
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}

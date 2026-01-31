import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ChevronRight } from 'lucide-react'
import {
  useCreateProject,
  ApiError,
} from '@/features/projects'
import { ProjectForm } from '@/features/projects/components/ProjectForm'

export const Route = createFileRoute('/master/projects/new')({
  component: ProjectNewPage,
})

function ProjectNewPage() {
  const navigate = Route.useNavigate()
  const createMutation = useCreateProject()

  const handleSubmit = async (values: {
    projectCode: string
    name: string
    businessUnitCode: string
    projectTypeCode: string
    startYearMonth: string
    totalManhour: number
    status: string
    durationMonths: number | null
  }) => {
    try {
      await createMutation.mutateAsync({
        ...values,
        projectTypeCode: values.projectTypeCode || undefined,
        durationMonths: values.durationMonths ?? undefined,
      })
      toast.success('保存しました')
      navigate({ to: '/master/projects' })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.problemDetails.status === 409) {
          toast.error('この案件コードは既に使用されています', { duration: Infinity })
        } else if (err.problemDetails.status === 422) {
          toast.error('入力内容にエラーがあります', { duration: Infinity })
        } else {
          toast.error(err.message, { duration: Infinity })
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/master/projects" className="hover:text-foreground transition-colors">
          案件一覧
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">新規登録</span>
      </nav>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">案件 新規登録</h2>
        <p className="text-sm text-muted-foreground mt-1">
          新しい案件を登録します
        </p>
      </div>

      <div className="rounded-2xl border shadow-sm p-6">
        <ProjectForm
          mode="create"
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  )
}

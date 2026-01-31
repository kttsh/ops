import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronRight } from 'lucide-react'
import {
  projectTypeQueryOptions,
  useUpdateProjectType,
  ApiError,
} from '@/features/project-types'
import { ProjectTypeForm } from '@/features/project-types/components/ProjectTypeForm'

export const Route = createFileRoute('/master/project-types/$projectTypeCode/edit')({
  component: ProjectTypeEditPage,
})

function ProjectTypeEditPage() {
  const { projectTypeCode } = Route.useParams()
  const navigate = Route.useNavigate()

  const { data, isLoading } = useQuery(projectTypeQueryOptions(projectTypeCode))
  const updateMutation = useUpdateProjectType(projectTypeCode)

  const handleSubmit = async (values: {
    projectTypeCode: string
    name: string
    displayOrder: number
  }) => {
    try {
      await updateMutation.mutateAsync({
        name: values.name,
        displayOrder: values.displayOrder,
      })
      toast.success('保存しました')
      navigate({
        to: '/master/project-types/$projectTypeCode',
        params: { projectTypeCode },
      })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.problemDetails.status === 404) {
          toast.error('案件タイプが見つかりません', { duration: Infinity })
        } else if (err.problemDetails.status === 422) {
          toast.error('入力内容にエラーがあります', { duration: Infinity })
        } else {
          toast.error(err.message, { duration: Infinity })
        }
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <p className="text-lg font-medium">案件タイプが見つかりません</p>
        <Link to="/master/project-types" className="text-sm text-primary hover:underline">
          一覧に戻る
        </Link>
      </div>
    )
  }

  const pt = data.data

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/master/project-types" className="hover:text-foreground transition-colors">
          案件タイプ一覧
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          to="/master/project-types/$projectTypeCode"
          params={{ projectTypeCode }}
          className="hover:text-foreground transition-colors"
        >
          {pt.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">編集</span>
      </nav>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">案件タイプ 編集</h2>
        <p className="text-sm text-muted-foreground mt-1">
          案件タイプ情報を編集します
        </p>
      </div>

      <div className="rounded-2xl border shadow-sm p-6">
        <ProjectTypeForm
          mode="edit"
          defaultValues={{
            projectTypeCode: pt.projectTypeCode,
            name: pt.name,
            displayOrder: pt.displayOrder,
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
        />
      </div>
    </div>
  )
}

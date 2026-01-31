import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronRight } from 'lucide-react'
import {
  workTypeQueryOptions,
  useUpdateWorkType,
  ApiError,
} from '@/features/work-types'
import { WorkTypeForm } from '@/features/work-types/components/WorkTypeForm'

export const Route = createFileRoute('/master/work-types/$workTypeCode/edit')({
  component: WorkTypeEditPage,
})

function WorkTypeEditPage() {
  const { workTypeCode } = Route.useParams()
  const navigate = Route.useNavigate()

  const { data, isLoading } = useQuery(workTypeQueryOptions(workTypeCode))
  const updateMutation = useUpdateWorkType(workTypeCode)

  const handleSubmit = async (values: {
    workTypeCode: string
    name: string
    displayOrder: number
    color: string | null
  }) => {
    try {
      await updateMutation.mutateAsync({
        name: values.name,
        displayOrder: values.displayOrder,
        color: values.color,
      })
      toast.success('保存しました')
      navigate({
        to: '/master/work-types/$workTypeCode',
        params: { workTypeCode },
      })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.problemDetails.status === 404) {
          toast.error('作業種類が見つかりません', { duration: Infinity })
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
        <p className="text-lg font-medium">作業種類が見つかりません</p>
        <Link to="/master/work-types" className="text-sm text-primary hover:underline">
          一覧に戻る
        </Link>
      </div>
    )
  }

  const wt = data.data

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/master/work-types" className="hover:text-foreground transition-colors">
          作業種類一覧
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          to="/master/work-types/$workTypeCode"
          params={{ workTypeCode }}
          className="hover:text-foreground transition-colors"
        >
          {wt.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">編集</span>
      </nav>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">作業種類 編集</h2>
        <p className="text-sm text-muted-foreground mt-1">
          作業種類情報を編集します
        </p>
      </div>

      <div className="rounded-2xl border shadow-sm p-6">
        <WorkTypeForm
          mode="edit"
          defaultValues={{
            workTypeCode: wt.workTypeCode,
            name: wt.name,
            displayOrder: wt.displayOrder,
            color: wt.color,
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
        />
      </div>
    </div>
  )
}

import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ChevronRight } from 'lucide-react'
import {
  useCreateBusinessUnit,
  ApiError,
} from '@/features/business-units'
import { BusinessUnitForm } from '@/features/business-units/components/BusinessUnitForm'

export const Route = createFileRoute('/master/business-units/new')({
  component: BusinessUnitNewPage,
})

function BusinessUnitNewPage() {
  const navigate = Route.useNavigate()
  const createMutation = useCreateBusinessUnit()

  const handleSubmit = async (values: {
    businessUnitCode: string
    name: string
    displayOrder: number
  }) => {
    try {
      await createMutation.mutateAsync(values)
      toast.success('保存しました')
      navigate({ to: '/master/business-units' })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.problemDetails.status === 409) {
          toast.error('同一コードのビジネスユニットが既に存在します', { duration: Infinity })
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
        <Link to="/master/business-units" className="hover:text-foreground transition-colors">
          ビジネスユニット一覧
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">新規登録</span>
      </nav>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">ビジネスユニット 新規登録</h2>
        <p className="text-sm text-muted-foreground mt-1">
          新しいビジネスユニットを登録します
        </p>
      </div>

      <div className="rounded-2xl border shadow-sm p-6">
        <BusinessUnitForm
          mode="create"
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  )
}

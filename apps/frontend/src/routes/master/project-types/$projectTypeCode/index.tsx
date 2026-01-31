import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  projectTypeQueryOptions,
  useDeleteProjectType,
  ApiError,
} from '@/features/project-types'
import { DeleteConfirmDialog } from '@/features/project-types/components/DeleteConfirmDialog'

export const Route = createFileRoute('/master/project-types/$projectTypeCode/')({
  component: ProjectTypeDetailPage,
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <p className="text-lg font-medium">案件タイプが見つかりません</p>
      <Link to="/master/project-types" className="text-sm text-primary hover:underline">
        一覧に戻る
      </Link>
    </div>
  ),
})

function ProjectTypeDetailPage() {
  const { projectTypeCode } = Route.useParams()
  const navigate = Route.useNavigate()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { data, isLoading, isError } = useQuery(
    projectTypeQueryOptions(projectTypeCode),
  )

  const deleteMutation = useDeleteProjectType()

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(projectTypeCode)
      toast.success('削除しました')
      navigate({ to: '/master/project-types' })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.problemDetails.status === 409) {
          toast.error('この案件タイプは他のデータから参照されているため削除できません', {
            duration: Infinity,
          })
        } else if (err.problemDetails.status === 404) {
          toast.error('案件タイプが見つかりません', { duration: Infinity })
        } else {
          toast.error(err.message, { duration: Infinity })
        }
      }
      setDeleteDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  if (isError || !data) {
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
        <span className="text-foreground font-medium">{pt.name}</span>
      </nav>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{pt.name}</h2>
        <div className="flex items-center gap-2">
          <Link
            to="/master/project-types/$projectTypeCode/edit"
            params={{ projectTypeCode }}
          >
            <Button variant="outline">
              <Pencil className="h-4 w-4" />
              編集
            </Button>
          </Link>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4" />
            削除
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border shadow-sm p-6 space-y-4">
        <DetailRow label="案件タイプコード" value={pt.projectTypeCode} />
        <DetailRow label="名称" value={pt.name} />
        <DetailRow label="表示順" value={String(pt.displayOrder)} />
        <DetailRow label="作成日時" value={new Date(pt.createdAt).toLocaleString('ja-JP')} />
        <DetailRow label="更新日時" value={new Date(pt.updatedAt).toLocaleString('ja-JP')} />
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        projectTypeName={pt.name}
      />
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{value}</dd>
    </div>
  )
}

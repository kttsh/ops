import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  workTypeQueryOptions,
  useDeleteWorkType,
  ApiError,
} from '@/features/work-types'
import { DeleteConfirmDialog } from '@/features/work-types/components/DeleteConfirmDialog'

export const Route = createFileRoute('/master/work-types/$workTypeCode/')({
  component: WorkTypeDetailPage,
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <p className="text-lg font-medium">作業種類が見つかりません</p>
      <Link to="/master/work-types" className="text-sm text-primary hover:underline">
        一覧に戻る
      </Link>
    </div>
  ),
})

function WorkTypeDetailPage() {
  const { workTypeCode } = Route.useParams()
  const navigate = Route.useNavigate()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { data, isLoading, isError } = useQuery(
    workTypeQueryOptions(workTypeCode),
  )

  const deleteMutation = useDeleteWorkType()

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(workTypeCode)
      toast.success('削除しました')
      navigate({ to: '/master/work-types' })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.problemDetails.status === 409) {
          toast.error('この作業種類は他のデータから参照されているため削除できません', {
            duration: Infinity,
          })
        } else if (err.problemDetails.status === 404) {
          toast.error('作業種類が見つかりません', { duration: Infinity })
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
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/master/work-types" className="hover:text-foreground transition-colors">
          作業種類一覧
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{wt.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{wt.name}</h2>
        <div className="flex items-center gap-2">
          <Link
            to="/master/work-types/$workTypeCode/edit"
            params={{ workTypeCode }}
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

      {/* Detail card */}
      <div className="rounded-2xl border shadow-sm p-6 space-y-4">
        <DetailRow label="作業種類コード" value={wt.workTypeCode} />
        <DetailRow label="名称" value={wt.name} />
        <div className="grid grid-cols-3 gap-4">
          <dt className="text-sm font-medium text-muted-foreground">カラー</dt>
          <dd className="col-span-2 text-sm">
            {wt.color ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border border-border"
                  style={{ backgroundColor: wt.color }}
                />
                <span>{wt.color}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">未設定</span>
            )}
          </dd>
        </div>
        <DetailRow label="表示順" value={String(wt.displayOrder)} />
        <DetailRow label="更新日時" value={new Date(wt.updatedAt).toLocaleString('ja-JP')} />
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        workTypeName={wt.name}
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

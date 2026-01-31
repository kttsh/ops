import { useState } from 'react'
import { Plus, Pencil, Trash2, RotateCcw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CaseFormSheet } from './CaseFormSheet'
import type { HeadcountPlanCase } from '@/features/indirect-case-study/types'
import {
  useCreateHeadcountPlanCase,
  useUpdateHeadcountPlanCase,
  useDeleteHeadcountPlanCase,
  useRestoreHeadcountPlanCase,
} from '@/features/indirect-case-study/api/mutations'

interface HeadcountPlanCaseListProps {
  items: HeadcountPlanCase[]
  selectedId: number | null
  onSelect: (id: number) => void
  businessUnitCode: string
  isLoading: boolean
  includeDisabled: boolean
  onIncludeDisabledChange: (value: boolean) => void
}

export function HeadcountPlanCaseList({
  items,
  selectedId,
  onSelect,
  businessUnitCode,
  isLoading,
  includeDisabled,
  onIncludeDisabledChange,
}: HeadcountPlanCaseListProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editTarget, setEditTarget] = useState<HeadcountPlanCase | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

  const createMutation = useCreateHeadcountPlanCase()
  const updateMutation = useUpdateHeadcountPlanCase()
  const deleteMutation = useDeleteHeadcountPlanCase()
  const restoreMutation = useRestoreHeadcountPlanCase()

  const handleCreate = () => {
    setFormMode('create')
    setEditTarget(null)
    setFormOpen(true)
  }

  const handleEdit = (item: HeadcountPlanCase) => {
    setFormMode('edit')
    setEditTarget(item)
    setFormOpen(true)
  }

  const handleSubmit = async (values: { caseName: string; description: string; isPrimary: boolean }) => {
    if (formMode === 'create') {
      await createMutation.mutateAsync({ ...values, businessUnitCode })
    } else if (editTarget) {
      await updateMutation.mutateAsync({ id: editTarget.headcountPlanCaseId, input: values })
    }
  }

  const handleDelete = async () => {
    if (deleteTargetId !== null) {
      await deleteMutation.mutateAsync(deleteTargetId)
      setDeleteTargetId(null)
    }
  }

  const handleRestore = async (id: number) => {
    await restoreMutation.mutateAsync(id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">人員計画ケース</h3>
        <Button variant="outline" size="sm" onClick={handleCreate}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          新規作成
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="hpc-include-disabled"
          checked={includeDisabled}
          onCheckedChange={onIncludeDisabledChange}
        />
        <Label htmlFor="hpc-include-disabled" className="text-xs text-muted-foreground">
          削除済みを含む
        </Label>
      </div>

      <div className="space-y-1">
        {items.map((item) => {
          const isDeleted = item.deletedAt !== null
          const isSelected = selectedId === item.headcountPlanCaseId
          return (
            <div
              key={item.headcountPlanCaseId}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-muted/50 border border-transparent'
              } ${isDeleted ? 'opacity-60' : ''}`}
              onClick={() => !isDeleted && onSelect(item.headcountPlanCaseId)}
            >
              <input
                type="radio"
                name="headcount-plan-case"
                checked={isSelected}
                onChange={() => onSelect(item.headcountPlanCaseId)}
                disabled={isDeleted}
                className="shrink-0"
              />
              <span className="flex-1 truncate">{item.caseName}</span>
              {item.isPrimary && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  Primary
                </Badge>
              )}
              {isDeleted ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRestore(item.headcountPlanCaseId)
                  }}
                  title="復元"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <div className="flex gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(item)
                    }}
                    title="編集"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteTargetId(item.headcountPlanCaseId)
                    }}
                    title="削除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )
        })}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            ケースがありません
          </p>
        )}
      </div>

      <CaseFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        caseType="headcountPlan"
        defaultValues={
          editTarget
            ? {
                caseName: editTarget.caseName,
                description: editTarget.description ?? '',
                isPrimary: editTarget.isPrimary,
              }
            : undefined
        }
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ケースを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作はケースを論理削除します。後から復元できます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>削除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

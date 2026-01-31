import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface UnsavedChangesDialogProps {
  open: boolean
  onCancel: () => void
  onConfirmLeave: () => void
  onSaveAndLeave: () => Promise<void>
  isSaving?: boolean
}

export function UnsavedChangesDialog({
  open,
  onCancel,
  onConfirmLeave,
  onSaveAndLeave,
  isSaving,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>変更が保存されていません</AlertDialogTitle>
          <AlertDialogDescription>
            保存されていない変更があります。保存せずに移動すると、変更内容が失われます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
          <Button variant="ghost" onClick={onConfirmLeave}>
            保存せず移動
          </Button>
          <Button onClick={onSaveAndLeave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            保存
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

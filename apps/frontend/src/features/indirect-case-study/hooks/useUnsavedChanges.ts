import { useState, useCallback } from 'react'
import { useBlocker } from '@tanstack/react-router'

type UseUnsavedChangesParams = {
  isDirty: boolean
  onSave?: () => Promise<void>
}

export function useUnsavedChanges({ isDirty, onSave }: UseUnsavedChangesParams) {
  // guardAction用のダイアログ制御（ルートナビゲーション以外の保護対象アクション）
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const blocker = useBlocker({
    shouldBlockFn: () => isDirty,
    enableBeforeUnload: () => isDirty,
    withResolver: true,
  })

  // ルートナビゲーションブロック時はblocker.statusで判定
  const showDialog = blocker.status === 'blocked' || actionDialogOpen

  const handleCancelLeave = useCallback(() => {
    setActionDialogOpen(false)
    setPendingAction(null)
    if (blocker.status === 'blocked') {
      blocker.reset()
    }
  }, [blocker])

  const handleConfirmLeave = useCallback(() => {
    setActionDialogOpen(false)
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    } else if (blocker.status === 'blocked') {
      blocker.proceed()
    }
  }, [blocker, pendingAction])

  const handleSaveAndLeave = useCallback(async () => {
    if (onSave) {
      await onSave()
    }
    setActionDialogOpen(false)
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    } else if (blocker.status === 'blocked') {
      blocker.proceed()
    }
  }, [onSave, blocker, pendingAction])

  const guardAction = useCallback(
    (action: () => void) => {
      if (isDirty) {
        setActionDialogOpen(true)
        setPendingAction(() => action)
        return false
      }
      action()
      return true
    },
    [isDirty],
  )

  const handleConfirmAction = useCallback(() => {
    setActionDialogOpen(false)
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }, [pendingAction])

  const handleSaveAndAction = useCallback(async () => {
    if (onSave) {
      await onSave()
    }
    setActionDialogOpen(false)
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }, [onSave, pendingAction])

  return {
    showDialog,
    setShowDialog: setActionDialogOpen,
    handleCancelLeave,
    handleConfirmLeave,
    handleSaveAndLeave,
    guardAction,
    handleConfirmAction,
    handleSaveAndAction,
  }
}

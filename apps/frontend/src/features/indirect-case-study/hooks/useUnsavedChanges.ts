import { useState, useEffect, useCallback } from 'react'
import { useBlocker } from '@tanstack/react-router'

type UseUnsavedChangesParams = {
  isDirty: boolean
  onSave?: () => Promise<void>
}

export function useUnsavedChanges({ isDirty, onSave }: UseUnsavedChangesParams) {
  const [showDialog, setShowDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const { proceed, reset, status } = useBlocker({
    condition: isDirty,
  })

  useEffect(() => {
    if (status === 'blocked') {
      setShowDialog(true)
    }
  }, [status])

  // ブラウザタブ閉じ対応
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const handleCancelLeave = useCallback(() => {
    setShowDialog(false)
    setPendingAction(null)
    reset?.()
  }, [reset])

  const handleConfirmLeave = useCallback(() => {
    setShowDialog(false)
    setPendingAction(null)
    proceed?.()
  }, [proceed])

  const handleSaveAndLeave = useCallback(async () => {
    if (onSave) {
      await onSave()
    }
    setShowDialog(false)
    setPendingAction(null)
    proceed?.()
  }, [onSave, proceed])

  const guardAction = useCallback(
    (action: () => void) => {
      if (isDirty) {
        setShowDialog(true)
        setPendingAction(() => action)
        return false
      }
      action()
      return true
    },
    [isDirty],
  )

  const handleConfirmAction = useCallback(() => {
    setShowDialog(false)
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }, [pendingAction])

  const handleSaveAndAction = useCallback(async () => {
    if (onSave) {
      await onSave()
    }
    setShowDialog(false)
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }, [onSave, pendingAction])

  return {
    showDialog,
    setShowDialog,
    handleCancelLeave,
    handleConfirmLeave,
    handleSaveAndLeave,
    guardAction,
    handleConfirmAction,
    handleSaveAndAction,
  }
}

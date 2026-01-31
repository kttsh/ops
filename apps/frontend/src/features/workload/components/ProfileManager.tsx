import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { chartViewsQueryOptions } from '@/features/workload/api/queries'
import {
  useCreateChartView,
  useDeleteChartView,
} from '@/features/workload/api/mutations'

export function ProfileManager() {
  const { data: viewsData } = useQuery(chartViewsQueryOptions())
  const views = viewsData?.data ?? []

  const createMutation = useCreateChartView()
  const deleteMutation = useDeleteChartView()

  const [newName, setNewName] = useState('')

  const handleSave = useCallback(() => {
    if (!newName.trim()) return
    createMutation.mutate(
      { viewName: newName.trim() },
      { onSuccess: () => setNewName('') },
    )
  }, [newName, createMutation])

  const handleDelete = useCallback(
    (id: number) => {
      deleteMutation.mutate(id)
    },
    [deleteMutation],
  )

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">プロファイル管理</h3>

      {/* 保存 */}
      <div className="mb-3 flex gap-2">
        <Input
          placeholder="プロファイル名"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="h-8 text-sm"
        />
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          onClick={handleSave}
          disabled={createMutation.isPending || !newName.trim()}
        >
          <Save className="h-3.5 w-3.5" />
          保存
        </Button>
      </div>

      {/* 一覧 */}
      <div className="space-y-1">
        {views.map((view) => (
          <div
            key={view.chartViewId}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
          >
            <button
              type="button"
              className="flex-1 text-left text-sm hover:text-primary"
            >
              {view.viewName}
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(view.chartViewId)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {views.length === 0 && (
          <p className="py-2 text-center text-xs text-muted-foreground">
            保存済みプロファイルはありません
          </p>
        )}
      </div>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { projectCasesQueryOptions } from '@/features/case-study/api/queries'
import type { ProjectCase } from '@/features/case-study/types'

interface CaseSidebarProps {
  projectId: number
  selectedCaseId: number | null
  onSelectCase: (caseId: number) => void
  onNewCase: () => void
  onEditCase: (caseId: number) => void
  onDeleteCase: (projectCase: ProjectCase) => void
}

export function CaseSidebar({
  projectId,
  selectedCaseId,
  onSelectCase,
  onNewCase,
  onEditCase,
  onDeleteCase,
}: CaseSidebarProps) {
  const { data, isLoading } = useQuery(
    projectCasesQueryOptions(projectId, { includeDisabled: false }),
  )
  const cases = data?.data ?? []

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold">ケース一覧</h3>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={onNewCase}
        >
          <Plus className="h-3.5 w-3.5" />
          新規作成
        </Button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto">
        {isLoading && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            読み込み中...
          </p>
        )}

        {!isLoading && cases.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            ケースが見つかりませんでした
          </p>
        )}

        {cases.map((pc) => (
          <button
            key={pc.projectCaseId}
            type="button"
            className={`group flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
              selectedCaseId === pc.projectCaseId
                ? 'border-l-2 border-l-primary bg-primary/5 border-y-border border-r-border'
                : 'border-border hover:bg-muted/50'
            }`}
            onClick={() => onSelectCase(pc.projectCaseId)}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium">
                  {pc.caseName}
                </span>
                {pc.isPrimary && (
                  <Badge variant="outline" className="shrink-0 text-[10px] px-1 py-0">
                    Primary
                  </Badge>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <Badge
                  variant={
                    pc.calculationType === 'STANDARD' ? 'default' : 'secondary'
                  }
                  className="text-[10px] px-1.5 py-0"
                >
                  {pc.calculationType}
                </Badge>
              </div>
              {pc.description && (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {pc.description}
                </p>
              )}
            </div>

            <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title="編集"
                onClick={(e) => {
                  e.stopPropagation()
                  onEditCase(pc.projectCaseId)
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                title="削除"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteCase(pc)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

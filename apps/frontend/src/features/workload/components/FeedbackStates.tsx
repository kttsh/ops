import { AlertCircle, BarChart3, RefreshCw, SearchX, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'

// --- スケルトンローダー ---

export function SkeletonChart() {
  return (
    <div className="h-[400px] w-full animate-pulse rounded-lg bg-muted">
      <div className="flex h-full items-end gap-1 p-8">
        {[45, 60, 35, 72, 55, 80, 50, 65, 40, 75, 58, 42].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-muted-foreground/20"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-8 rounded bg-muted" />
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="h-12 rounded bg-muted" />
      ))}
    </div>
  )
}

// --- 空状態 ---

interface EmptyStateProps {
  message: string
  description?: string
  icon?: React.ReactNode
}

export function EmptyState({ message, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16">
      {icon ?? <Inbox className="h-10 w-10 text-muted-foreground/50" />}
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
      {description && (
        <p className="max-w-sm text-center text-xs text-muted-foreground/80">
          {description}
        </p>
      )}
    </div>
  )
}

export function BuEmptyState() {
  return (
    <EmptyState
      message="ビジネスユニットを選択してください"
      description="ヘッダー右上のBUボタンからビジネスユニットを選択すると、データが表示されます。"
      icon={<BarChart3 className="h-10 w-10 text-muted-foreground/50" />}
    />
  )
}

export function NoDataState() {
  return (
    <EmptyState message="表示可能な案件がありません" />
  )
}

export function NoSearchResults() {
  return (
    <EmptyState
      message="検索条件に一致する案件が見つかりません"
      icon={<SearchX className="h-10 w-10 text-muted-foreground/50" />}
    />
  )
}

// --- エラー状態 ---

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 py-16">
      <AlertCircle className="h-10 w-10 text-destructive/70" />
      <p className="text-sm font-medium text-destructive">
        {message ?? 'データの取得に失敗しました'}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="gap-2" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          再試行
        </Button>
      )}
    </div>
  )
}

// --- オーバーレイスピナー ---

export function OverlaySpinner() {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/60">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

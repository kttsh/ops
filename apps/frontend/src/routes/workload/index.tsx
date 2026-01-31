import { createFileRoute } from '@tanstack/react-router'
import { workloadSearchSchema } from '@/features/workload'

export const Route = createFileRoute('/workload/')({
  validateSearch: workloadSearchSchema,
  component: WorkloadPage,
})

function WorkloadPage() {
  return (
    <div className="flex h-full flex-col">
      <h1 className="text-2xl font-bold">山積ダッシュボード</h1>
      <p className="mt-2 text-muted-foreground">準備中...</p>
    </div>
  )
}

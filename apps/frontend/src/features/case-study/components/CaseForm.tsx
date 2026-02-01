import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createProjectCaseSchema } from '../types'
import { standardEffortMastersQueryOptions } from '../api/queries'
import { StandardEffortPreview } from './StandardEffortPreview'
import type { CreateProjectCaseInput } from '../types'

function getErrorMessage(errors: unknown[]): string | undefined {
  if (errors.length === 0) return undefined
  const first = errors[0]
  if (typeof first === 'string') return first
  if (first && typeof first === 'object' && 'message' in first) {
    return String((first as { message: string }).message)
  }
  return String(first)
}

type CaseFormValues = {
  caseName: string
  calculationType: 'STANDARD' | 'MANUAL'
  standardEffortId: number | null
  description: string | null
  isPrimary: boolean
  startYearMonth: string | null
  durationMonths: number | null
  totalManhour: number | null
}

interface CaseFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<CaseFormValues>
  onSubmit: (values: CreateProjectCaseInput) => Promise<void>
  isSubmitting: boolean
  onCancel: () => void
}

const formDefaults: CaseFormValues = {
  caseName: '',
  calculationType: 'MANUAL',
  standardEffortId: null,
  description: null,
  isPrimary: false,
  startYearMonth: null,
  durationMonths: null,
  totalManhour: null,
}

export function CaseForm({
  mode,
  defaultValues,
  onSubmit,
  isSubmitting,
  onCancel,
}: CaseFormProps) {
  const { data: mastersData, isLoading: mastersLoading } = useQuery(
    standardEffortMastersQueryOptions(),
  )
  const masters = mastersData?.data ?? []

  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { ...formDefaults, ...defaultValues },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      const result = createProjectCaseSchema.safeParse(value)
      if (!result.success) {
        const firstIssue = result.error.issues[0]
        setSubmitError(firstIssue?.message ?? '入力内容にエラーがあります')
        return
      }
      await onSubmit(result.data)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-6"
    >
      {submitError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {submitError}
        </div>
      )}

      {/* ケース名 */}
      <form.Field name="caseName">
        {(field) => {
          const error = getErrorMessage(field.state.meta.errors)
          return (
            <div className="space-y-2">
              <Label htmlFor="caseName">
                ケース名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="caseName"
                value={field.state.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  field.handleChange(e.target.value)
                }
                onBlur={field.handleBlur}
                placeholder="ケース名を入力"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )
        }}
      </form.Field>

      {/* 計算モード */}
      <form.Field name="calculationType">
        {(field) => (
          <div className="space-y-2">
            <Label>
              計算モード <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-4">
              {(['MANUAL', 'STANDARD'] as const).map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="calculationType"
                    value={type}
                    checked={field.state.value === type}
                    onChange={() => {
                      field.handleChange(type)
                      if (type === 'MANUAL') {
                        form.setFieldValue('standardEffortId', null)
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>

            {/* 標準工数マスタ (STANDARD時) */}
            {field.state.value === 'STANDARD' && (
              <form.Field name="standardEffortId">
                {(seField) => {
                  const seError = getErrorMessage(seField.state.meta.errors)
                  return (
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="standardEffortId">
                        標準工数マスタ{' '}
                        <span className="text-destructive">*</span>
                      </Label>
                      {mastersLoading ? (
                        <div className="flex items-center gap-2 h-10 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          読み込み中...
                        </div>
                      ) : (
                        <Select
                          value={
                            seField.state.value != null
                              ? String(seField.state.value)
                              : ''
                          }
                          onValueChange={(val: string) =>
                            seField.handleChange(val ? Number(val) : null)
                          }
                        >
                          <SelectTrigger id="standardEffortId">
                            <SelectValue placeholder="選択してください" />
                          </SelectTrigger>
                          <SelectContent>
                            {masters.map((m) => (
                              <SelectItem
                                key={m.standardEffortId}
                                value={String(m.standardEffortId)}
                              >
                                {m.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {seError && (
                        <p className="text-sm text-destructive">{seError}</p>
                      )}
                      <StandardEffortPreview
                        standardEffortId={seField.state.value}
                      />
                    </div>
                  )
                }}
              </form.Field>
            )}

            {/* MANUALモード情報パネル */}
            {field.state.value === 'MANUAL' && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  MANUALモードでは、月別工数を手動で入力します。工数データはケーススタディ画面で入力してください。
                </p>
              </div>
            )}
          </div>
        )}
      </form.Field>

      {/* 説明 */}
      <form.Field name="description">
        {(field) => {
          const error = getErrorMessage(field.state.meta.errors)
          return (
            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <textarea
                id="description"
                value={field.state.value ?? ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(e.target.value || null)
                }
                onBlur={field.handleBlur}
                placeholder="説明を入力（任意）"
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )
        }}
      </form.Field>

      {/* プライマリ */}
      <form.Field name="isPrimary">
        {(field) => (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrimary"
              checked={field.state.value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                field.handleChange(e.target.checked)
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isPrimary">プライマリケースとして設定</Label>
          </div>
        )}
      </form.Field>

      {/* 開始年月 */}
      <form.Field name="startYearMonth">
        {(field) => {
          const error = getErrorMessage(field.state.meta.errors)
          return (
            <div className="space-y-2">
              <Label htmlFor="startYearMonth">開始年月</Label>
              <Input
                id="startYearMonth"
                value={field.state.value ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  field.handleChange(e.target.value || null)
                }
                onBlur={field.handleBlur}
                placeholder="YYYYMM"
                maxLength={6}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )
        }}
      </form.Field>

      {/* 期間月数 */}
      <form.Field name="durationMonths">
        {(field) => {
          const error = getErrorMessage(field.state.meta.errors)
          return (
            <div className="space-y-2">
              <Label htmlFor="durationMonths">期間月数</Label>
              <Input
                id="durationMonths"
                type="number"
                value={field.state.value ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  field.handleChange(
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
                onBlur={field.handleBlur}
                placeholder="月数"
                min={1}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )
        }}
      </form.Field>

      {/* 総工数 */}
      <form.Field name="totalManhour">
        {(field) => {
          const error = getErrorMessage(field.state.meta.errors)
          return (
            <div className="space-y-2">
              <Label htmlFor="totalManhour">総工数</Label>
              <Input
                id="totalManhour"
                type="number"
                value={field.state.value ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  field.handleChange(
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
                onBlur={field.handleBlur}
                placeholder="工数"
                min={0}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )
        }}
      </form.Field>

      {/* ボタン */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting
            ? mode === 'create'
              ? '作成中...'
              : '更新中...'
            : mode === 'create'
              ? '作成'
              : '更新'}
        </Button>
      </div>
    </form>
  )
}

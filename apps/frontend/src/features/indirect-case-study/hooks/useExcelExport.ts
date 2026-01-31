import { useState, useCallback } from 'react'
import type { ExcelExportParams } from '@/features/indirect-case-study/types'

export function useExcelExport() {
  const [isExporting, setIsExporting] = useState(false)

  const exportToExcel = useCallback(async (params: ExcelExportParams) => {
    setIsExporting(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const XLSX = (await import('xlsx' as any)) as any
      const { tableData, headcountPlanCaseName, scenarioName, indirectWorkCaseName, fiscalYear } =
        params

      // ヘッダー情報
      const headerRows = [
        [`間接作業・キャパシティ設定 - ${fiscalYear}年度`],
        [`人員計画ケース: ${headcountPlanCaseName}`],
        [`キャパシティシナリオ: ${scenarioName}`],
        [`間接作業ケース: ${indirectWorkCaseName}`],
        [],
      ]

      // テーブルヘッダー
      const tableHeader = ['項目', ...tableData.months, '年間合計']

      // データ行
      const dataRows = tableData.rows.map((row) => [
        row.label,
        ...tableData.months.map((m) => row.monthly[m] ?? 0),
        row.annualTotal,
      ])

      const wsData = [...headerRows, tableHeader, ...dataRows]
      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // カラム幅の設定
      ws['!cols'] = [
        { wch: 20 },
        ...tableData.months.map(() => ({ wch: 10 })),
        { wch: 12 },
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '計算結果')
      XLSX.writeFileXLSX(wb, `indirect-capacity-${fiscalYear}.xlsx`)
    } finally {
      setIsExporting(false)
    }
  }, [])

  return { exportToExcel, isExporting }
}

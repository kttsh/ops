import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { SettingsPanel } from './SettingsPanel'
import {
  mockCapacityScenarios,
  mockHeadcountPlanCases,
  mockIndirectWorkCases,
  mockMonthlyHeadcounts,
  mockIndirectWorkRatios,
} from './__mocks__/data'
import { mockWorkTypes } from '@/features/work-types/components/__mocks__/data'

const meta = {
  title: 'Features/IndirectCaseStudy/SettingsPanel',
  component: SettingsPanel,
  tags: ['autodocs'],
  parameters: {
    msw: {
      handlers: [
        http.get('/api/headcount-plan-cases/:id/monthly', () => {
          return HttpResponse.json({
            data: mockMonthlyHeadcounts.filter(
              (h) => h.businessUnitCode === 'BU001',
            ),
          })
        }),
        http.get('/api/indirect-work-cases/:id/ratios', () => {
          return HttpResponse.json({ data: mockIndirectWorkRatios })
        }),
        http.get('/api/work-types', () => {
          return HttpResponse.json({ data: mockWorkTypes })
        }),
      ],
    },
  },
} satisfies Meta<typeof SettingsPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    businessUnitCode: 'BU001',
    headcountCases: mockHeadcountPlanCases,
    capacityScenarios: mockCapacityScenarios,
    indirectWorkCases: mockIndirectWorkCases,
    isLoadingCases: false,
    selectedHeadcountPlanCaseId: 1,
    onSelectHeadcountPlanCase: fn(),
    selectedCapacityScenarioId: 1,
    onSelectCapacityScenario: fn(),
    selectedIndirectWorkCaseId: 1,
    onSelectIndirectWorkCase: fn(),
    settingsFiscalYear: 2025,
    onSettingsFiscalYearChange: fn(),
    onCalculateCapacity: fn(),
    isCalculatingCapacity: false,
    canCalculateCapacity: true,
    onCalculateIndirectWork: fn(),
    canCalculateIndirectWork: true,
    onSaveHeadcount: fn(),
    isSavingHeadcount: false,
    onSaveRatios: fn(),
    isSavingRatios: false,
    onHeadcountDirtyChange: fn(),
    onRatioDirtyChange: fn(),
    headcountDirty: false,
    ratioDirty: false,
    onHeadcountLocalDataChange: fn(),
    onRatioLocalDataChange: fn(),
    hpcIncludeDisabled: false,
    onHpcIncludeDisabledChange: fn(),
    csIncludeDisabled: false,
    onCsIncludeDisabledChange: fn(),
    iwcIncludeDisabled: false,
    onIwcIncludeDisabledChange: fn(),
  },
}

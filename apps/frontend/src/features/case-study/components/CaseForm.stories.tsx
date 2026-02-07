import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { CaseForm } from './CaseForm'
import { mockStandardEffortMasters } from './__mocks__/data'

const meta = {
  title: 'Features/CaseStudy/CaseForm',
  component: CaseForm,
  tags: ['autodocs'],
  parameters: {
    msw: {
      handlers: [
        http.get('/api/standard-efforts', () => {
          return HttpResponse.json({
            data: mockStandardEffortMasters,
            meta: { total: mockStandardEffortMasters.length },
          })
        }),
      ],
    },
  },
} satisfies Meta<typeof CaseForm>

export default meta
type Story = StoryObj<typeof meta>

export const CreateMode: Story = {
  args: {
    mode: 'create',
    onSubmit: fn(),
    isSubmitting: false,
    onCancel: fn(),
  },
}

export const EditMode: Story = {
  args: {
    mode: 'edit',
    defaultValues: {
      caseName: '標準ケース',
      calculationType: 'STANDARD',
      standardEffortId: 1,
      description: 'メインの工数見積りケース',
      isPrimary: true,
      startYearMonth: '202504',
      durationMonths: 24,
      totalManhour: 12000,
    },
    onSubmit: fn(),
    isSubmitting: false,
    onCancel: fn(),
  },
}

export const ManualMode: Story = {
  args: {
    mode: 'create',
    defaultValues: {
      caseName: '',
      calculationType: 'MANUAL',
      standardEffortId: null,
      description: null,
      isPrimary: false,
      startYearMonth: null,
      durationMonths: null,
      totalManhour: null,
    },
    onSubmit: fn(),
    isSubmitting: false,
    onCancel: fn(),
  },
}

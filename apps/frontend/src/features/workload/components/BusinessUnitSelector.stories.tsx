import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { BusinessUnitSelector } from './BusinessUnitSelector'
import { mockBusinessUnits } from '@/features/business-units/components/__mocks__/data'

const meta = {
  title: 'Features/Workload/BusinessUnitSelector',
  component: BusinessUnitSelector,
  tags: ['autodocs'],
  parameters: {
    msw: {
      handlers: [
        http.get('/api/business-units', () => {
          return HttpResponse.json({
            data: mockBusinessUnits,
            meta: { total: mockBusinessUnits.length },
          })
        }),
      ],
    },
  },
} satisfies Meta<typeof BusinessUnitSelector>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    selectedCodes: ['BU001'],
    onChange: fn(),
  },
}

export const MultipleSelected: Story = {
  args: {
    selectedCodes: ['BU001', 'BU002'],
    onChange: fn(),
  },
}

export const NoneSelected: Story = {
  args: {
    selectedCodes: [],
    onChange: fn(),
  },
}

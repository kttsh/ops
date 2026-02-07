import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { SidePanelSettings } from './SidePanelSettings'
import { mockProjects } from '@/features/projects/components/__mocks__/data'

const meta = {
  title: 'Features/Workload/SidePanelSettings',
  component: SidePanelSettings,
  tags: ['autodocs'],
  parameters: {
    msw: {
      handlers: [
        http.get('/api/projects', () => {
          return HttpResponse.json({
            data: mockProjects,
            meta: { total: mockProjects.length, page: 1, pageSize: 100 },
          })
        }),
        http.get('/api/capacity-scenarios', () => {
          return HttpResponse.json({ data: [] })
        }),
        http.get('/api/chart-views', () => {
          return HttpResponse.json({ data: [] })
        }),
      ],
    },
  },
} satisfies Meta<typeof SidePanelSettings>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    from: '202501',
    months: 36,
    businessUnitCodes: ['BU001'],
    selectedProjectIds: new Set([1]),
    onPeriodChange: fn(),
  },
}

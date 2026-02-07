import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { ProfileManager } from './ProfileManager'

const meta = {
  title: 'Features/Workload/ProfileManager',
  component: ProfileManager,
  tags: ['autodocs'],
  parameters: {
    msw: {
      handlers: [
        http.get('/api/chart-views', () => {
          return HttpResponse.json({ data: [] })
        }),
      ],
    },
  },
} satisfies Meta<typeof ProfileManager>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    chartType: 'stacked-area',
    startYearMonth: '202501',
    endYearMonth: '202712',
    projectItems: [],
    businessUnitCodes: ['BU001'],
    onApply: fn(),
  },
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'
import { SidePanelIndirect } from './SidePanelIndirect'
import { mockWorkTypes } from '@/features/work-types/components/__mocks__/data'

const meta = {
  title: 'Features/Workload/SidePanelIndirect',
  component: SidePanelIndirect,
  tags: ['autodocs'],
  parameters: {
    msw: {
      handlers: [
        http.get('/api/work-types', () => {
          return HttpResponse.json({ data: mockWorkTypes })
        }),
      ],
    },
  },
} satisfies Meta<typeof SidePanelIndirect>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { IndirectWorkRatioMatrix } from './IndirectWorkRatioMatrix'
import { mockIndirectWorkRatios } from './__mocks__/data'
import { mockWorkTypes } from '@/features/work-types/components/__mocks__/data'

const meta = {
  title: 'Features/IndirectCaseStudy/IndirectWorkRatioMatrix',
  component: IndirectWorkRatioMatrix,
  tags: ['autodocs'],
  parameters: {
    msw: {
      handlers: [
        http.get('/api/indirect-work-cases/:id/ratios', () => {
          return HttpResponse.json({ data: mockIndirectWorkRatios })
        }),
        http.get('/api/work-types', () => {
          return HttpResponse.json({ data: mockWorkTypes })
        }),
      ],
    },
  },
} satisfies Meta<typeof IndirectWorkRatioMatrix>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    indirectWorkCaseId: 1,
    onDirtyChange: fn(),
    onLocalDataChange: fn(),
  },
}

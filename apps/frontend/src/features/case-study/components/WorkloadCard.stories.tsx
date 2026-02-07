import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { WorkloadCard } from './WorkloadCard'
import { mockProjectCase, mockProjectLoads } from './__mocks__/data'

const meta = {
  title: 'Features/CaseStudy/WorkloadCard',
  component: WorkloadCard,
  tags: ['autodocs'],
} satisfies Meta<typeof WorkloadCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    projectCase: mockProjectCase,
    projectLoads: mockProjectLoads,
    onWorkloadsChange: fn(),
  },
}

export const EmptyLoads: Story = {
  args: {
    projectCase: mockProjectCase,
    projectLoads: [],
    onWorkloadsChange: fn(),
  },
}

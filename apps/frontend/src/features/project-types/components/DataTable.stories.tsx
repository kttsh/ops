import type { Meta, StoryObj } from '@storybook/react-vite'
import { withRouter } from '@/lib/storybook-decorators'
import { DataTable } from './DataTable'
import { createColumns } from './columns'
import {
  mockProjectTypes,
  generateMockProjectTypes,
} from './__mocks__/data'
import type { ProjectType } from '@/features/project-types/types'

const columns = createColumns({})

const meta = {
  title: 'Features/ProjectTypes/DataTable',
  component: DataTable<ProjectType>,
  tags: ['autodocs'],
  decorators: [withRouter],
  args: {
    columns,
    globalFilter: '',
  },
} satisfies Meta<typeof DataTable<ProjectType>>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: { data: [] },
}

export const FewItems: Story = {
  args: { data: mockProjectTypes },
}

export const ManyItems: Story = {
  args: { data: generateMockProjectTypes(50) },
}

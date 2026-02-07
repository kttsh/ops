import type { Meta, StoryObj } from '@storybook/react-vite'
import { withRouter } from '@/lib/storybook-decorators'
import { DataTable } from './DataTable'
import { createColumns } from './columns'
import {
  mockWorkTypes,
  generateMockWorkTypes,
} from './__mocks__/data'
import type { WorkType } from '@/features/work-types/types'

const columns = createColumns({})

const meta = {
  title: 'Features/WorkTypes/DataTable',
  component: DataTable<WorkType>,
  tags: ['autodocs'],
  decorators: [withRouter],
  args: {
    columns,
    globalFilter: '',
  },
} satisfies Meta<typeof DataTable<WorkType>>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: { data: [] },
}

export const FewItems: Story = {
  args: { data: mockWorkTypes },
}

export const ManyItems: Story = {
  args: { data: generateMockWorkTypes(50) },
}

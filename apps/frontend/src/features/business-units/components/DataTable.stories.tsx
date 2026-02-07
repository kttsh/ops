import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { withRouter } from '@/lib/storybook-decorators'
import { DataTable } from './DataTable'
import { createColumns } from './columns'
import {
  mockBusinessUnits,
  generateMockBusinessUnits,
} from './__mocks__/data'
import type { BusinessUnit } from '@/features/business-units/types'

const columns = createColumns({})

const meta = {
  title: 'Features/BusinessUnits/DataTable',
  component: DataTable<BusinessUnit>,
  tags: ['autodocs'],
  decorators: [withRouter],
  args: {
    columns,
    globalFilter: '',
    pagination: {
      currentPage: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 1,
    },
    onPageChange: fn(),
    onPageSizeChange: fn(),
  },
} satisfies Meta<typeof DataTable<BusinessUnit>>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    data: [],
    pagination: { currentPage: 1, pageSize: 20, totalItems: 0, totalPages: 1 },
  },
}

export const FewItems: Story = {
  args: {
    data: mockBusinessUnits,
    pagination: {
      currentPage: 1,
      pageSize: 20,
      totalItems: mockBusinessUnits.length,
      totalPages: 1,
    },
  },
}

export const ManyItems: Story = {
  args: {
    data: generateMockBusinessUnits(50),
    pagination: {
      currentPage: 1,
      pageSize: 20,
      totalItems: 50,
      totalPages: 3,
    },
  },
}

export const Loading: Story = {
  args: {
    data: [],
    isLoading: true,
  },
}

export const Error: Story = {
  args: {
    data: [],
    isError: true,
    errorMessage: 'データの取得に失敗しました',
  },
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import React from 'react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table'

const TableExample = () => (
  <Table>
    <TableCaption>サンプルテーブル</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead className="w-[100px]">ID</TableHead>
        <TableHead>名前</TableHead>
        <TableHead>ステータス</TableHead>
        <TableHead className="text-right">金額</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell className="font-medium">001</TableCell>
        <TableCell>田中太郎</TableCell>
        <TableCell>有効</TableCell>
        <TableCell className="text-right">¥1,000</TableCell>
      </TableRow>
      <TableRow>
        <TableCell className="font-medium">002</TableCell>
        <TableCell>鈴木花子</TableCell>
        <TableCell>有効</TableCell>
        <TableCell className="text-right">¥2,500</TableCell>
      </TableRow>
      <TableRow>
        <TableCell className="font-medium">003</TableCell>
        <TableCell>佐藤次郎</TableCell>
        <TableCell>無効</TableCell>
        <TableCell className="text-right">¥500</TableCell>
      </TableRow>
    </TableBody>
    <TableFooter>
      <TableRow>
        <TableCell colSpan={3}>合計</TableCell>
        <TableCell className="text-right">¥4,000</TableCell>
      </TableRow>
    </TableFooter>
  </Table>
)

const meta = {
  title: 'UI/Table',
  component: TableExample,
  tags: ['autodocs'],
} satisfies Meta<typeof TableExample>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

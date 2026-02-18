import { useMemo } from 'react';
import { Table, Tag, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined } from '@ant-design/icons';
import type { Order } from '../types';
import { formatNumber, formatCurrency, formatDate, getAllocationStatus } from '../utils/helpers';

const TYPE_TAG_COLOR: Record<string, string> = {
  EMERGENCY: 'red',
  OVER_DUE: 'orange',
  DAILY: 'default',
};

const STATUS_TAG_COLOR: Record<string, string> = {
  full: 'green',
  partial: 'orange',
  unallocated: 'default',
};

const STATUS_LABEL: Record<string, string> = {
  full: 'Full',
  partial: 'Partial',
  unallocated: 'None',
};

const AllocationTable = ({ orders, onSelectOrder }: {
  orders: Order[];
  onSelectOrder: (id: string) => void;
}) => {
  const columns: ColumnsType<Order> = useMemo(() => [
    { title: 'Order', dataIndex: 'orderId', width: 110, ellipsis: true },
    {
      title: 'Sub Order', dataIndex: 'id', width: 150, ellipsis: true,
      render: (value: string) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{value}</span>,
    },
    { title: 'Item ID', dataIndex: 'itemId', width: 70, ellipsis: true },
    { title: 'WH ID', dataIndex: 'warehouseId', width: 70, ellipsis: true },
    { title: 'Supplier ID', dataIndex: 'supplierId', width: 80, ellipsis: true },
    {
      title: 'Request', dataIndex: 'requestedQty', width: 80, align: 'right',
      render: (value: number) => formatNumber(value),
    },
    {
      title: 'Type', dataIndex: 'type', width: 100,
      render: (value: string) => <Tag color={TYPE_TAG_COLOR[value]}>{value}</Tag>,
    },
    {
      title: 'Create Date', dataIndex: 'orderDate', width: 110,
      render: (value: string) => formatDate(value),
    },
    { title: 'Customer ID', dataIndex: 'customerId', width: 90, ellipsis: true },
    {
      title: 'Remark', dataIndex: 'remark', width: 120, ellipsis: true,
      render: (value: string) => value || '—',
    },
    {
      title: 'Allocated', dataIndex: 'allocatedQty', width: 80, align: 'right',
      render: (value: number) => formatNumber(value),
    },
    {
      title: 'Unit Price', dataIndex: 'unitPrice', width: 90, align: 'right',
      render: (value: number) => value > 0 ? formatCurrency(value) : '—',
    },
    {
      title: 'Total Cost', dataIndex: 'totalCost', width: 100, align: 'right',
      render: (value: number) => value > 0 ? formatCurrency(value) : '—',
    },
    {
      title: 'Status', width: 90,
      render: (_: unknown, record: Order) => {
        const status = getAllocationStatus(record);
        return <Tag color={STATUS_TAG_COLOR[status]}>{STATUS_LABEL[status]}</Tag>;
      },
    },
    {
      title: '', width: 60, align: 'center',
      render: (_: unknown, record: Order) => (
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => onSelectOrder(record.id)}
        />
      ),
    },
  ], [onSelectOrder]);

  return (
    <Table<Order>
      columns={columns}
      dataSource={orders}
      rowKey="id"
      virtual
      scroll={{ x: 1400, y: 'calc(100vh - 340px)' as unknown as number }}
      pagination={false}
      size="small"
    />
  );
};

export default AllocationTable;

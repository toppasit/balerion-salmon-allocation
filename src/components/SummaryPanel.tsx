import { Flex, Tag } from 'antd';
import type { Summary } from '../types';
import { formatNumber, formatCurrency } from '../utils/helpers';

const SummaryPanel = ({ summary }: { summary: Summary }) => (
  <Flex wrap gap={4}>
    <Tag>Orders: <strong>{summary.totalOrders.toLocaleString()}</strong></Tag>
    <Tag>Sub-orders: <strong>{summary.totalSubOrders.toLocaleString()}</strong></Tag>
    <Tag color="green">Full: <strong>{summary.fullyAllocated.toLocaleString()}</strong></Tag>
    <Tag color="orange">Partial: <strong>{summary.partiallyAllocated.toLocaleString()}</strong></Tag>
    <Tag>None: <strong>{summary.unallocated.toLocaleString()}</strong></Tag>
    <Tag>Requested: <strong>{formatNumber(summary.totalRequested)}</strong></Tag>
    <Tag color="blue">Allocated: <strong>{formatNumber(summary.totalAllocated)}</strong></Tag>
    <Tag>Fill: <strong>{summary.fillRate}%</strong></Tag>
    <Tag color="purple">Revenue: <strong>{formatCurrency(summary.totalRevenue)}</strong></Tag>
  </Flex>
);

export default SummaryPanel;

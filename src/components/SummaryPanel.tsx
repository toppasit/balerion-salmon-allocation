import type { Summary } from '../types';
import { formatNumber, formatCurrency } from '../utils/helpers';

const SummaryPanel = ({ summary }: { summary: Summary }) => (
  <div className="text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
    <span>Orders: <strong>{summary.totalOrders.toLocaleString()}</strong></span>
    <span>Sub-orders: <strong>{summary.totalSubOrders.toLocaleString()}</strong></span>
    <span>Full: <strong>{summary.fullyAllocated.toLocaleString()}</strong></span>
    <span>Partial: <strong>{summary.partiallyAllocated.toLocaleString()}</strong></span>
    <span>None: <strong>{summary.unallocated.toLocaleString()}</strong></span>
    <span>Requested: <strong>{formatNumber(summary.totalRequested)}</strong></span>
    <span>Allocated: <strong>{formatNumber(summary.totalAllocated)}</strong></span>
    <span>Fill: <strong>{summary.fillRate}%</strong></span>
    <span>Revenue: <strong>{formatCurrency(summary.totalRevenue)}</strong></span>
  </div>
);

export default SummaryPanel;

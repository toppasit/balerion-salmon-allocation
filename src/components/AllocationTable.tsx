import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Order } from '../types';
import { formatNumber, formatCurrency, formatDate, getAllocationStatus } from '../utils/helpers';

const ROW_HEIGHT = 32;

const OrderRow = React.memo(({ order, onEdit, style }: { order: Order; onEdit: (id: string) => void; style: React.CSSProperties }) => {
  const status = getAllocationStatus(order);
  const typeColor = order.type === 'EMERGENCY' ? 'text-red-600' : order.type === 'OVER_DUE' ? 'text-amber-600' : 'text-gray-600';
  const statusColor = status === 'full' ? 'text-green-700' : status === 'partial' ? 'text-amber-700' : 'text-gray-500';
  const statusLabel = status === 'full' ? 'Full' : status === 'partial' ? 'Partial' : 'None';

  return (
    <div className="flex items-center border-b border-gray-100 text-xs hover:bg-gray-50" style={style}>
      <div style={{ width: 110 }} className="px-2 truncate">{order.orderId}</div>
      <div style={{ width: 150 }} className="px-2 truncate font-mono text-[11px]">{order.id}</div>
      <div style={{ width: 70 }} className="px-2 truncate">{order.itemId}</div>
      <div style={{ width: 70 }} className="px-2 truncate">{order.warehouseId}</div>
      <div style={{ width: 80 }} className="px-2 truncate">{order.supplierId}</div>
      <div style={{ width: 70 }} className="px-2 text-right">{formatNumber(order.requestedQty)}</div>
      <div style={{ width: 95 }} className={`px-2 font-medium ${typeColor}`}>{order.type}</div>
      <div style={{ width: 95 }} className="px-2">{formatDate(order.orderDate)}</div>
      <div style={{ width: 85 }} className="px-2 truncate">{order.customerId}</div>
      <div style={{ width: 110 }} className="px-2 truncate text-gray-500">{order.remark || '—'}</div>
      <div style={{ width: 75 }} className="px-2 text-right">{formatNumber(order.allocatedQty)}</div>
      <div style={{ width: 80 }} className="px-2 text-right">{order.unitPrice > 0 ? formatCurrency(order.unitPrice) : '—'}</div>
      <div style={{ width: 90 }} className="px-2 text-right">{order.totalCost > 0 ? formatCurrency(order.totalCost) : '—'}</div>
      <div style={{ width: 85 }} className={`px-2 ${statusColor}`}>{statusLabel}</div>
      <div style={{ width: 50 }} className="px-2">
        <button onClick={() => onEdit(order.id)} className="text-blue-600 hover:underline text-xs">Edit</button>
      </div>
    </div>
  );
});

const HEADERS = [
  ['Order', 110], ['Sub Order', 150], ['Item ID', 70], ['WH ID', 70], ['Supplier ID', 80],
  ['Request', 70, 'right'], ['Type', 95], ['Create Date', 95], ['Customer ID', 85], ['Remark', 110],
  ['Allocated', 75, 'right'], ['Unit Price', 80, 'right'], ['Total Cost', 90, 'right'], ['Status', 85], ['', 50],
] as const;

const TOTAL_WIDTH = HEADERS.reduce((sum, h) => sum + (h[1] as number), 0);

const AllocationTable = ({ orders, onSelectOrder }: { orders: Order[]; onSelectOrder: (id: string) => void }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: orders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  return (
    <div className="border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <div style={{ minWidth: TOTAL_WIDTH }}>
          <div className="flex items-center bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 sticky top-0 z-10">
            {HEADERS.map(([label, width, align], i) => (
              <div key={i} style={{ width: width as number }} className={`px-2 py-2 ${align === 'right' ? 'text-right' : ''}`}>
                {label}
              </div>
            ))}
          </div>
          <div ref={parentRef} className="overflow-y-auto" style={{ height: 'calc(100vh - 340px)', minHeight: 300 }}>
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map(vRow => (
                <OrderRow
                  key={orders[vRow.index].id}
                  order={orders[vRow.index]}
                  onEdit={onSelectOrder}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: ROW_HEIGHT, transform: `translateY(${vRow.start}px)` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllocationTable;

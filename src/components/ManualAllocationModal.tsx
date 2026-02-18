import { useState, type KeyboardEvent } from 'react';
import type { Order, AllocationConstraints } from '../types';
import { formatNumber, formatCurrency, getAllocationStatus } from '../utils/helpers';

const ManualAllocationModal = ({ order, constraints, onApply, onClose }: {
  order: Order;
  constraints: AllocationConstraints;
  onApply: (orderId: string, qty: number) => boolean;
  onClose: () => void;
}) => {
  const [inputValue, setInputValue] = useState(String(order.allocatedQty));
  const [error, setError] = useState('');

  const parsed = parseFloat(inputValue) || 0;
  const previewCost = parsed * constraints.unitPrice;
  const status = getAllocationStatus({
    allocatedQty: parsed,
    requestedQty: order.requestedQty,
  });

  const handleApply = () => {
    const qty = parseFloat(inputValue);
    if (isNaN(qty) || qty < 0) {
      setError('Enter a valid non-negative number');
      return;
    }
    if (qty > constraints.maxAllocation) {
      setError(`Max allocation is ${formatNumber(constraints.maxAllocation)}`);
      return;
    }
    if (onApply(order.id, qty)) onClose();
    else setError('Allocation failed');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleApply();
    if (e.key === 'Escape') onClose();
  };

  const row = (label: string, value: React.ReactNode) => (
    <tr>
      <td className="py-1.5 text-gray-500 w-40">{label}</td>
      <td className="py-1.5">{value}</td>
    </tr>
  );

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-300 w-full max-w-lg mx-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold">Manual Allocation</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Sub Order: {order.id} | Order: {order.orderId}
          </p>
        </div>

        <div className="p-4 space-y-4">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-gray-100">
              {row('Customer', `${order.customerName} (${order.customerId})`)}
              {row('Item', order.itemId)}
              {row('Type', order.type)}
              {row('Requested Qty', formatNumber(order.requestedQty))}
              {row('Unit Price', constraints.unitPrice > 0 ? formatCurrency(constraints.unitPrice) : '—')}
              {row('Supplier', `${constraints.supplier?.id ?? '—'} (${constraints.supplier?.name ?? '—'}) — Stock: ${formatNumber(constraints.availableSupplierStock)}`)}
              {row('Warehouse', `${constraints.warehouse?.id ?? '—'} (${constraints.warehouse?.name ?? '—'}) — Stock: ${formatNumber(constraints.availableWarehouseStock)}`)}
              {row('Available Credit', `${formatCurrency(constraints.availableCredit)} (max qty: ${formatNumber(constraints.maxFromCredit)})`)}
              <tr>
                <td className="py-1.5 text-gray-500 font-medium">Max Allocation</td>
                <td className="py-1.5 font-medium">{formatNumber(constraints.maxAllocation)}</td>
              </tr>
            </tbody>
          </table>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Allocated Quantity</label>
            <input
              type="number"
              value={inputValue}
              onChange={(event) => { setInputValue(event.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              min={0}
              max={constraints.maxAllocation}
              step="0.01"
              className="w-full border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              autoFocus
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
            <span>Preview: {formatNumber(parsed)} qty = {formatCurrency(previewCost)}</span>
            <span className={
              status === 'full' ? 'text-green-700'
                : status === 'partial' ? 'text-amber-700'
                  : 'text-gray-500'
            }>
              {status === 'full' ? 'Fully allocated'
                : status === 'partial' ? 'Partially allocated'
                  : 'Unallocated'}
            </span>
          </div>

          {order.remark && (
            <p className="text-xs text-gray-400">Remark: {order.remark}</p>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-3 py-1.5 text-xs bg-gray-800 text-white hover:bg-gray-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualAllocationModal;

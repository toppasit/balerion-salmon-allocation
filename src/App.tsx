import { useState, useMemo } from 'react';
import type { Filters, Order } from './types';
import { useAllocation } from './hooks/useAllocation';
import { getAllocationStatus } from './utils/helpers';
import SummaryPanel from './components/SummaryPanel';
import StockOverview from './components/StockOverview';
import SearchFilter from './components/SearchFilter';
import AllocationTable from './components/AllocationTable';
import ManualAllocationModal from './components/ManualAllocationModal';

const matchesSearchQuery = (order: Order, query: string) => {
  if (!query) return true;

  const searchableFields = [
    order.id, order.orderId, order.customerId,
    order.customerName, order.itemId, order.remark,
  ];
  return searchableFields.some((field) => field.toLowerCase().includes(query));
};

const App = () => {
  const {
    orders,
    suppliers,
    warehouses,
    summary,
    isAllocated,
    runAutoAllocate,
    resetAllocations,
    getManualConstraints,
    applyManualAllocation,
  } = useAllocation();

  const [filters, setFilters] = useState<Filters>({
    search: '',
    type: '',
    status: '',
    supplier: '',
    warehouse: '',
  });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showStock, setShowStock] = useState(false);

  const filteredOrders = useMemo(() => {
    const query = filters.search.toLowerCase();

    return orders.filter((order) => {
      if (!matchesSearchQuery(order, query)) return false;
      if (filters.type && order.type !== filters.type) return false;
      if (filters.status && getAllocationStatus(order) !== filters.status) return false;
      if (filters.supplier && order.supplierId !== filters.supplier) return false;
      if (filters.warehouse && order.warehouseId !== filters.warehouse) return false;
      return true;
    });
  }, [orders, filters]);

  const selectedOrder = selectedOrderId
    ? orders.find((order) => order.id === selectedOrderId) ?? null
    : null;

  const selectedConstraints = selectedOrderId
    ? getManualConstraints(selectedOrderId)
    : null;

  return (
    <div className="min-h-screen">
      <div className="border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <h1 className="text-sm font-semibold">Salmon Allocation</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStock(!showStock)}
            className="text-xs text-gray-500 hover:underline"
          >
            {showStock ? 'Hide Stock' : 'Show Stock'}
          </button>
          <button
            onClick={resetAllocations}
            className="px-3 py-1 text-xs border border-gray-300 hover:bg-gray-50"
          >
            Reset
          </button>
          {!isAllocated && (
            <button
              onClick={runAutoAllocate}
              className="px-3 py-1 text-xs bg-gray-800 text-white hover:bg-gray-700"
            >
              Auto Allocate
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-2 space-y-2">
        <SummaryPanel summary={summary} />
        {showStock && <StockOverview suppliers={suppliers} warehouses={warehouses} />}
        <SearchFilter
          filters={filters}
          onFilterChange={setFilters}
          suppliers={suppliers}
          warehouses={warehouses}
          totalCount={orders.length}
          filteredCount={filteredOrders.length}
        />
        <AllocationTable orders={filteredOrders} onSelectOrder={setSelectedOrderId} />
      </div>

      {selectedOrder && selectedConstraints && (
        <ManualAllocationModal
          order={selectedOrder}
          constraints={selectedConstraints}
          onApply={applyManualAllocation}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
};

export default App;

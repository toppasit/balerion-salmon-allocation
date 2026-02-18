import { useState, useMemo } from 'react';
import { Layout, Button, Space } from 'antd';
import { ReloadOutlined, ThunderboltOutlined, BarChartOutlined } from '@ant-design/icons';
import type { Filters, Order } from './types';
import { useAllocation } from './hooks/useAllocation';
import { getAllocationStatus } from './utils/helpers';
import SummaryPanel from './components/SummaryPanel';
import StockOverview from './components/StockOverview';
import SearchFilter from './components/SearchFilter';
import AllocationTable from './components/AllocationTable';
import ManualAllocationModal from './components/ManualAllocationModal';

const { Header, Content } = Layout;

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
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 16px',
          height: 48,
          lineHeight: '48px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <strong style={{ fontSize: 14 }}>Salmon Allocation</strong>
        <Space>
          <Button
            size="small"
            icon={<BarChartOutlined />}
            onClick={() => setShowStock(!showStock)}
          >
            {showStock ? 'Hide Stock' : 'Show Stock'}
          </Button>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={resetAllocations}
          >
            Reset
          </Button>
          {!isAllocated && (
            <Button
              type="primary"
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={runAutoAllocate}
            >
              Auto Allocate
            </Button>
          )}
        </Space>
      </Header>

      <Content style={{ padding: 16 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
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
        </Space>
      </Content>

      {selectedOrder && selectedConstraints && (
        <ManualAllocationModal
          order={selectedOrder}
          constraints={selectedConstraints}
          onApply={applyManualAllocation}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </Layout>
  );
};

export default App;

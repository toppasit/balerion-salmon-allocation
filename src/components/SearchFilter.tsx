import { Input, Select, Space, Typography } from 'antd';
import type { Filters, Supplier, Warehouse } from '../types';

const { Text } = Typography;

const SearchFilter = ({ filters, onFilterChange, suppliers, warehouses, totalCount, filteredCount }: {
  filters: Filters;
  onFilterChange: (updatedFilters: Filters) => void;
  suppliers: Supplier[];
  warehouses: Warehouse[];
  totalCount: number;
  filteredCount: number;
}) => {
  const updateFilter = (key: keyof Filters, value: string) => onFilterChange({ ...filters, [key]: value });

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Space wrap>
        <Input.Search
          placeholder="Search order ID, customer ID, item, remark..."
          value={filters.search}
          onChange={(event) => updateFilter('search', event.target.value)}
          allowClear
          style={{ width: 320 }}
        />
        <Select
          value={filters.type || undefined}
          onChange={(value) => updateFilter('type', value ?? '')}
          placeholder="All Types"
          allowClear
          style={{ width: 140 }}
          options={[
            { value: 'EMERGENCY', label: 'Emergency' },
            { value: 'OVER_DUE', label: 'Over Due' },
            { value: 'DAILY', label: 'Daily' },
          ]}
        />
        <Select
          value={filters.status || undefined}
          onChange={(value) => updateFilter('status', value ?? '')}
          placeholder="All Statuses"
          allowClear
          style={{ width: 140 }}
          options={[
            { value: 'full', label: 'Full' },
            { value: 'partial', label: 'Partial' },
            { value: 'unallocated', label: 'Unallocated' },
          ]}
        />
        <Select
          value={filters.supplier || undefined}
          onChange={(value) => updateFilter('supplier', value ?? '')}
          placeholder="All Suppliers"
          allowClear
          style={{ width: 160 }}
          options={[
            { value: 'SP-000', label: 'SP-000 (Any)' },
            ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.id })),
          ]}
        />
        <Select
          value={filters.warehouse || undefined}
          onChange={(value) => updateFilter('warehouse', value ?? '')}
          placeholder="All Warehouses"
          allowClear
          style={{ width: 160 }}
          options={[
            { value: 'WH-000', label: 'WH-000 (Any)' },
            ...warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.id })),
          ]}
        />
      </Space>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Showing {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} sub-orders
      </Text>
    </Space>
  );
};

export default SearchFilter;

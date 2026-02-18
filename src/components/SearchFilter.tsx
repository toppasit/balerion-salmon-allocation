import type { Filters, Supplier, Warehouse } from '../types';

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
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Search order ID, customer ID, item, remark..."
          value={filters.search}
          onChange={(event) => updateFilter('search', event.target.value)}
          className="flex-1 min-w-[200px] border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
        />
        <select value={filters.type} onChange={(event) => updateFilter('type', event.target.value)} className="border border-gray-300 px-2 py-1.5 text-sm">
          <option value="">All Types</option>
          <option value="EMERGENCY">Emergency</option>
          <option value="OVER_DUE">Over Due</option>
          <option value="DAILY">Daily</option>
        </select>
        <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="border border-gray-300 px-2 py-1.5 text-sm">
          <option value="">All Statuses</option>
          <option value="full">Full</option>
          <option value="partial">Partial</option>
          <option value="unallocated">Unallocated</option>
        </select>
        <select value={filters.supplier} onChange={(event) => updateFilter('supplier', event.target.value)} className="border border-gray-300 px-2 py-1.5 text-sm">
          <option value="">All Suppliers</option>
          <option value="SP-000">SP-000 (Any)</option>
          {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.id}</option>)}
        </select>
        <select value={filters.warehouse} onChange={(event) => updateFilter('warehouse', event.target.value)} className="border border-gray-300 px-2 py-1.5 text-sm">
          <option value="">All Warehouses</option>
          <option value="WH-000">WH-000 (Any)</option>
          {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.id}</option>)}
        </select>
      </div>
      <p className="text-xs text-gray-500">
        Showing {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} sub-orders
      </p>
    </div>
  );
};

export default SearchFilter;

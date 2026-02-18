export type OrderType = 'EMERGENCY' | 'OVER_DUE' | 'DAILY';
export type AllocationStatus = 'full' | 'partial' | 'unallocated';

export interface Item { id: string; name: string }

export interface Supplier { id: string; name: string; totalStock: number; remainingStock: number }

export interface Warehouse { id: string; name: string; totalStock: number; remainingStock: number }

export interface Customer { id: string; name: string; creditLimit: number; usedCredit: number }

export interface PriceEntry { itemId: string; supplierId: string; basePrice: number }

export interface Order {
  id: string;
  orderId: string;
  itemId: string;
  warehouseId: string;
  supplierId: string;
  customerId: string;
  customerName: string;
  type: OrderType;
  requestedQty: number;
  allocatedQty: number;
  unitPrice: number;
  totalCost: number;
  orderDate: string;
  remark: string;
  resolvedSupplierId: string | null;
  resolvedWarehouseId: string | null;
}

export interface MockData {
  items: Item[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  customers: Customer[];
  orders: Order[];
  priceEntries: PriceEntry[];
}

export interface AllocationResult {
  orders: Order[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  customers: Customer[];
}

export interface AllocationConstraints {
  maxAllocation: number;
  supplier: Supplier | null;
  warehouse: Warehouse | null;
  customer: Customer | null;
  unitPrice: number;
  availableSupplierStock: number;
  availableWarehouseStock: number;
  availableCredit: number;
  maxFromCredit: number;
}

export interface Summary {
  totalOrders: number;
  totalSubOrders: number;
  allocatedSubOrders: number;
  fullyAllocated: number;
  partiallyAllocated: number;
  unallocated: number;
  totalRequested: number;
  totalAllocated: number;
  totalRevenue: number;
  totalSupplierStock: number;
  remainingSupplierStock: number;
  totalWarehouseStock: number;
  remainingWarehouseStock: number;
  fillRate: number;
}

export interface Filters { search: string; type: string; status: string; supplier: string; warehouse: string }

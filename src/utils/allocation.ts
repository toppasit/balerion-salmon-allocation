import type {
  Order, Supplier, Warehouse, Customer,
  PriceEntry, AllocationResult, AllocationConstraints,
} from '../types';
import { bankersRound, ORDER_TYPE_PRIORITY, getUnitPrice } from './helpers';

const pickBestSupplier = (supplierMap: Map<string, Supplier>) =>
  [...supplierMap.values()]
    .filter((supplier) => supplier.remainingStock > 0)
    .sort((a, b) => b.remainingStock - a.remainingStock)[0];

const pickBestWarehouse = (warehouseMap: Map<string, Warehouse>) =>
  [...warehouseMap.values()]
    .filter((warehouse) => warehouse.remainingStock > 0)
    .sort((a, b) => b.remainingStock - a.remainingStock)[0];

const sortOrdersByPriority = <T extends Order>(orders: T[]): T[] => {
  const sorted = [...orders];
  sorted.sort((a, b) => {
    const priorityDiff = ORDER_TYPE_PRIORITY[a.type] - ORDER_TYPE_PRIORITY[b.type];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
  });
  return sorted;
};

const resolveSupplier = (order: Order, supplierMap: Map<string, Supplier>) =>
  order.supplierId === 'SP-000'
    ? pickBestSupplier(supplierMap)
    : supplierMap.get(order.supplierId);

const resolveWarehouse = (order: Order, warehouseMap: Map<string, Warehouse>) =>
  order.warehouseId === 'WH-000'
    ? pickBestWarehouse(warehouseMap)
    : warehouseMap.get(order.warehouseId);

const calculateAllocationQty = (
  requestedQty: number,
  supplierStock: number,
  warehouseStock: number,
  maxAffordable: number,
) =>
  bankersRound(
    Math.max(0, Math.min(
      requestedQty,
      supplierStock,
      warehouseStock,
      maxAffordable,
    )),
    2,
  );

const findSupplierForOrder = (order: Order, suppliers: Supplier[]) => {
  const supplierId = order.resolvedSupplierId || order.supplierId;

  if (supplierId === 'SP-000') {
    return [...suppliers]
      .filter((supplier) => supplier.remainingStock > 0 || order.allocatedQty > 0)
      .sort((a, b) => b.remainingStock - a.remainingStock)[0];
  }

  return suppliers.find((supplier) => supplier.id === supplierId);
};

const findWarehouseForOrder = (order: Order, warehouses: Warehouse[]) => {
  const warehouseId = order.resolvedWarehouseId || order.warehouseId;

  if (warehouseId === 'WH-000') {
    return [...warehouses]
      .filter((warehouse) => warehouse.remainingStock > 0 || order.allocatedQty > 0)
      .sort((a, b) => b.remainingStock - a.remainingStock)[0];
  }

  return warehouses.find((warehouse) => warehouse.id === warehouseId);
};

export const autoAllocate = (
  ordersInput: Order[],
  suppliersInput: Supplier[],
  warehousesInput: Warehouse[],
  customersInput: Customer[],
  priceEntries: PriceEntry[],
): AllocationResult => {
  const supplierMap = new Map(suppliersInput.map((supplier) => [supplier.id, { ...supplier }]));
  const warehouseMap = new Map(warehousesInput.map((warehouse) => [warehouse.id, { ...warehouse }]));
  const customerMap = new Map(customersInput.map((customer) => [customer.id, { ...customer }]));

  const ordersWithIndex = ordersInput.map((order, originalIndex) => ({ ...order, _originalIndex: originalIndex }));
  const prioritized = sortOrdersByPriority(ordersWithIndex);

  const result: Order[] = new Array(ordersInput.length);

  for (const order of prioritized) {
    const unallocatedBase: Order = {
      ...order,
      allocatedQty: 0,
      unitPrice: 0,
      totalCost: 0,
      resolvedSupplierId: null,
      resolvedWarehouseId: null,
    };

    const supplier = resolveSupplier(order, supplierMap);
    if (!supplier || supplier.remainingStock <= 0) {
      result[order._originalIndex] = unallocatedBase;
      continue;
    }

    const warehouse = resolveWarehouse(order, warehouseMap);
    if (!warehouse || warehouse.remainingStock <= 0) {
      result[order._originalIndex] = unallocatedBase;
      continue;
    }

    const unitPrice = getUnitPrice(order.itemId, supplier.id, order.type, priceEntries);
    if (unitPrice <= 0) {
      result[order._originalIndex] = unallocatedBase;
      continue;
    }

    const customer = customerMap.get(order.customerId);
    if (!customer) {
      result[order._originalIndex] = unallocatedBase;
      continue;
    }

    const remainingCredit = customer.creditLimit - customer.usedCredit;
    if (remainingCredit <= 0) {
      result[order._originalIndex] = unallocatedBase;
      continue;
    }

    const maxAffordable = remainingCredit / unitPrice;
    const allocation = calculateAllocationQty(
      order.requestedQty,
      supplier.remainingStock,
      warehouse.remainingStock,
      maxAffordable,
    );

    if (allocation <= 0) {
      result[order._originalIndex] = unallocatedBase;
      continue;
    }

    const totalCost = bankersRound(allocation * unitPrice, 2);

    supplier.remainingStock = bankersRound(supplier.remainingStock - allocation, 2);
    warehouse.remainingStock = bankersRound(warehouse.remainingStock - allocation, 2);
    customer.usedCredit = bankersRound(customer.usedCredit + totalCost, 2);

    result[order._originalIndex] = {
      ...unallocatedBase,
      allocatedQty: allocation,
      unitPrice,
      totalCost,
      resolvedSupplierId: supplier.id,
      resolvedWarehouseId: warehouse.id,
    };
  }

  return {
    orders: result,
    suppliers: [...supplierMap.values()],
    warehouses: [...warehouseMap.values()],
    customers: [...customerMap.values()],
  };
};

export const calculateManualAllocationConstraints = (
  order: Order,
  suppliers: Supplier[],
  warehouses: Warehouse[],
  customers: Customer[],
  priceEntries: PriceEntry[],
): AllocationConstraints => {
  const supplier = findSupplierForOrder(order, suppliers);
  const warehouse = findWarehouseForOrder(order, warehouses);
  const customer = customers.find((customer) => customer.id === order.customerId);

  const emptyConstraints: AllocationConstraints = {
    maxAllocation: 0,
    supplier: null,
    warehouse: null,
    customer: null,
    unitPrice: 0,
    availableSupplierStock: 0,
    availableWarehouseStock: 0,
    availableCredit: 0,
    maxFromCredit: 0,
  };

  if (!supplier || !warehouse || !customer) return emptyConstraints;

  const unitPrice = getUnitPrice(order.itemId, supplier.id, order.type, priceEntries);
  if (unitPrice <= 0) return { ...emptyConstraints, supplier, warehouse, customer };

  const availableSupplierStock = bankersRound(supplier.remainingStock + order.allocatedQty, 2);
  const availableWarehouseStock = bankersRound(warehouse.remainingStock + order.allocatedQty, 2);
  const availableCredit = bankersRound(
    (customer.creditLimit - customer.usedCredit) + order.totalCost,
    2,
  );
  const maxFromCredit = bankersRound(availableCredit / unitPrice, 2);

  const maxAllocation = calculateAllocationQty(
    order.requestedQty,
    availableSupplierStock,
    availableWarehouseStock,
    maxFromCredit,
  );

  return {
    maxAllocation,
    supplier,
    warehouse,
    customer,
    unitPrice,
    availableSupplierStock,
    availableWarehouseStock,
    availableCredit,
    maxFromCredit,
  };
};

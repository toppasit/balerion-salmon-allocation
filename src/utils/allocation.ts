import type { Order, Supplier, Warehouse, Customer, PriceEntry, AllocationResult, AllocationConstraints } from '../types';
import { bankersRound, ORDER_TYPE_PRIORITY, getUnitPrice } from './helpers';

const pickBestSupplier = (map: Map<string, Supplier>) =>
  [...map.values()].filter(s => s.remainingStock > 0).sort((a, b) => b.remainingStock - a.remainingStock)[0];

const pickBestWarehouse = (map: Map<string, Warehouse>) =>
  [...map.values()].filter(w => w.remainingStock > 0).sort((a, b) => b.remainingStock - a.remainingStock)[0];

export const autoAllocate = (
  ordersInput: Order[],
  suppliersInput: Supplier[],
  warehousesInput: Warehouse[],
  customersInput: Customer[],
  priceEntries: PriceEntry[],
): AllocationResult => {
  const supplierMap = new Map(suppliersInput.map(s => [s.id, { ...s }]));
  const warehouseMap = new Map(warehousesInput.map(w => [w.id, { ...w }]));
  const customerMap = new Map(customersInput.map(c => [c.id, { ...c }]));

  const indexed = ordersInput.map((o, i) => ({ ...o, _i: i }));
  indexed.sort((a, b) => {
    const p = ORDER_TYPE_PRIORITY[a.type] - ORDER_TYPE_PRIORITY[b.type];
    return p !== 0 ? p : new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
  });

  const result: Order[] = new Array(ordersInput.length);

  for (const order of indexed) {
    const base: Order = {
      ...order, allocatedQty: 0, unitPrice: 0, totalCost: 0,
      resolvedSupplierId: null, resolvedWarehouseId: null,
    };

    const supplier = order.supplierId === 'SP-000' ? pickBestSupplier(supplierMap) : supplierMap.get(order.supplierId);
    if (!supplier || supplier.remainingStock <= 0) { result[order._i] = base; continue; }

    const warehouse = order.warehouseId === 'WH-000' ? pickBestWarehouse(warehouseMap) : warehouseMap.get(order.warehouseId);
    if (!warehouse || warehouse.remainingStock <= 0) { result[order._i] = base; continue; }

    const unitPrice = getUnitPrice(order.itemId, supplier.id, order.type, priceEntries);
    if (unitPrice <= 0) { result[order._i] = base; continue; }

    const customer = customerMap.get(order.customerId);
    if (!customer) { result[order._i] = base; continue; }

    const remainingCredit = customer.creditLimit - customer.usedCredit;
    if (remainingCredit <= 0) { result[order._i] = base; continue; }

    const allocation = bankersRound(
      Math.max(0, Math.min(order.requestedQty, supplier.remainingStock, warehouse.remainingStock, remainingCredit / unitPrice)),
      2,
    );

    if (allocation <= 0) { result[order._i] = base; continue; }

    const totalCost = bankersRound(allocation * unitPrice, 2);
    supplier.remainingStock = bankersRound(supplier.remainingStock - allocation, 2);
    warehouse.remainingStock = bankersRound(warehouse.remainingStock - allocation, 2);
    customer.usedCredit = bankersRound(customer.usedCredit + totalCost, 2);

    result[order._i] = {
      ...base,
      allocatedQty: allocation, unitPrice, totalCost,
      resolvedSupplierId: supplier.id, resolvedWarehouseId: warehouse.id,
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
  const sid = order.resolvedSupplierId || order.supplierId;
  const wid = order.resolvedWarehouseId || order.warehouseId;

  const supplier = sid === 'SP-000'
    ? [...suppliers].filter(s => s.remainingStock > 0 || order.allocatedQty > 0).sort((a, b) => b.remainingStock - a.remainingStock)[0]
    : suppliers.find(s => s.id === sid);

  const warehouse = wid === 'WH-000'
    ? [...warehouses].filter(w => w.remainingStock > 0 || order.allocatedQty > 0).sort((a, b) => b.remainingStock - a.remainingStock)[0]
    : warehouses.find(w => w.id === wid);

  const customer = customers.find(c => c.id === order.customerId);

  const empty: AllocationConstraints = {
    maxAllocation: 0, supplier: null, warehouse: null, customer: null,
    unitPrice: 0, availableSupplierStock: 0, availableWarehouseStock: 0, availableCredit: 0, maxFromCredit: 0,
  };

  if (!supplier || !warehouse || !customer) return empty;

  const unitPrice = getUnitPrice(order.itemId, supplier.id, order.type, priceEntries);
  if (unitPrice <= 0) return { ...empty, supplier, warehouse, customer };

  const availableSupplierStock = bankersRound(supplier.remainingStock + order.allocatedQty, 2);
  const availableWarehouseStock = bankersRound(warehouse.remainingStock + order.allocatedQty, 2);
  const availableCredit = bankersRound((customer.creditLimit - customer.usedCredit) + order.totalCost, 2);
  const maxFromCredit = bankersRound(availableCredit / unitPrice, 2);
  const maxAllocation = bankersRound(Math.max(0, Math.min(order.requestedQty, availableSupplierStock, availableWarehouseStock, maxFromCredit)), 2);

  return { maxAllocation, supplier, warehouse, customer, unitPrice, availableSupplierStock, availableWarehouseStock, availableCredit, maxFromCredit };
};

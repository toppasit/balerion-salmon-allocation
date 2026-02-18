import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { AllocationConstraints, Summary } from '../types';
import { generateMockData } from '../data/mockData';
import { autoAllocate, calculateManualAllocationConstraints } from '../utils/allocation';
import { bankersRound } from '../utils/helpers';

export const useAllocation = () => {
  const initialData = useRef(generateMockData());
  const [suppliers, setSuppliers] = useState(initialData.current.suppliers);
  const [warehouses, setWarehouses] = useState(initialData.current.warehouses);
  const [customers, setCustomers] = useState(initialData.current.customers);
  const [orders, setOrders] = useState(initialData.current.orders);
  const [items] = useState(initialData.current.items);
  const [priceEntries] = useState(initialData.current.priceEntries);
  const [isAllocated, setIsAllocated] = useState(false);

  useEffect(() => {
    const d = initialData.current;
    const result = autoAllocate(d.orders, d.suppliers, d.warehouses, d.customers, d.priceEntries);
    setOrders(result.orders);
    setSuppliers(result.suppliers);
    setWarehouses(result.warehouses);
    setCustomers(result.customers);
    setIsAllocated(true);
  }, []);

  const resetAllocations = useCallback(() => {
    const d = generateMockData();
    initialData.current = d;
    setOrders(d.orders);
    setSuppliers(d.suppliers);
    setWarehouses(d.warehouses);
    setCustomers(d.customers);
    setIsAllocated(false);
  }, []);

  const runAutoAllocate = useCallback(() => {
    const d = initialData.current;
    const result = autoAllocate(d.orders, d.suppliers, d.warehouses, d.customers, d.priceEntries);
    setOrders(result.orders);
    setSuppliers(result.suppliers);
    setWarehouses(result.warehouses);
    setCustomers(result.customers);
    setIsAllocated(true);
  }, []);

  const getManualConstraints = useCallback(
    (orderId: string): AllocationConstraints | null => {
      const order = orders.find(o => o.id === orderId);
      if (!order) return null;
      return calculateManualAllocationConstraints(order, suppliers, warehouses, customers, priceEntries);
    },
    [orders, suppliers, warehouses, customers, priceEntries],
  );

  const applyManualAllocation = useCallback(
    (orderId: string, newQty: number) => {
      const idx = orders.findIndex(o => o.id === orderId);
      if (idx === -1) return false;

      const order = orders[idx];
      const c = calculateManualAllocationConstraints(order, suppliers, warehouses, customers, priceEntries);
      if (!c.supplier || !c.warehouse || !c.customer) return false;

      const qty = bankersRound(newQty, 2);
      if (qty < 0 || qty > c.maxAllocation) return false;

      const cost = bankersRound(qty * c.unitPrice, 2);
      const qtyDiff = qty - order.allocatedQty;
      const costDiff = cost - order.totalCost;

      const updated = [...orders];
      updated[idx] = { ...order, allocatedQty: qty, unitPrice: c.unitPrice, totalCost: cost, resolvedSupplierId: c.supplier.id, resolvedWarehouseId: c.warehouse.id };
      setOrders(updated);

      setSuppliers(prev => prev.map(s => s.id === c.supplier!.id ? { ...s, remainingStock: bankersRound(s.remainingStock - qtyDiff, 2) } : s));
      setWarehouses(prev => prev.map(w => w.id === c.warehouse!.id ? { ...w, remainingStock: bankersRound(w.remainingStock - qtyDiff, 2) } : w));
      setCustomers(prev => prev.map(cu => cu.id === order.customerId ? { ...cu, usedCredit: bankersRound(cu.usedCredit + costDiff, 2) } : cu));

      return true;
    },
    [orders, suppliers, warehouses, customers, priceEntries],
  );

  const summary: Summary = useMemo(() => {
    const allocated = orders.filter(o => o.allocatedQty > 0);
    const full = orders.filter(o => o.allocatedQty >= o.requestedQty);
    const totalReq = orders.reduce((s, o) => s + o.requestedQty, 0);
    const totalAlloc = orders.reduce((s, o) => s + o.allocatedQty, 0);

    return {
      totalOrders: new Set(orders.map(o => o.orderId)).size,
      totalSubOrders: orders.length,
      allocatedSubOrders: allocated.length,
      fullyAllocated: full.length,
      partiallyAllocated: allocated.length - full.length,
      unallocated: orders.length - allocated.length,
      totalRequested: bankersRound(totalReq, 2),
      totalAllocated: bankersRound(totalAlloc, 2),
      totalRevenue: bankersRound(orders.reduce((s, o) => s + o.totalCost, 0), 2),
      totalSupplierStock: suppliers.reduce((s, sp) => s + sp.totalStock, 0),
      remainingSupplierStock: bankersRound(suppliers.reduce((s, sp) => s + sp.remainingStock, 0), 2),
      totalWarehouseStock: warehouses.reduce((s, w) => s + w.totalStock, 0),
      remainingWarehouseStock: bankersRound(warehouses.reduce((s, w) => s + w.remainingStock, 0), 2),
      fillRate: totalReq > 0 ? bankersRound((totalAlloc / totalReq) * 100, 1) : 0,
    };
  }, [orders, suppliers, warehouses]);

  return {
    orders, suppliers, warehouses, customers, items, priceEntries,
    summary, isAllocated, runAutoAllocate, resetAllocations, getManualConstraints, applyManualAllocation,
  };
};

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { AllocationConstraints, Supplier, Warehouse, Customer, Summary } from '../types';
import { generateMockData } from '../data/mockData';
import { autoAllocate, calculateManualAllocationConstraints } from '../utils/allocation';
import { bankersRound } from '../utils/helpers';

const adjustSupplierStock = (
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>,
  supplierId: string,
  qtyDiff: number,
) => {
  setSuppliers((previousSuppliers) =>
    previousSuppliers.map((supplier) =>
      supplier.id === supplierId
        ? { ...supplier, remainingStock: bankersRound(supplier.remainingStock - qtyDiff, 2) }
        : supplier,
    ),
  );
};

const adjustWarehouseStock = (
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>,
  warehouseId: string,
  qtyDiff: number,
) => {
  setWarehouses((previousWarehouses) =>
    previousWarehouses.map((warehouse) =>
      warehouse.id === warehouseId
        ? { ...warehouse, remainingStock: bankersRound(warehouse.remainingStock - qtyDiff, 2) }
        : warehouse,
    ),
  );
};

const adjustCustomerCredit = (
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>,
  customerId: string,
  costDiff: number,
) => {
  setCustomers((previousCustomers) =>
    previousCustomers.map((customer) =>
      customer.id === customerId
        ? { ...customer, usedCredit: bankersRound(customer.usedCredit + costDiff, 2) }
        : customer,
    ),
  );
};

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
    const data = initialData.current;
    const result = autoAllocate(
      data.orders, data.suppliers, data.warehouses, data.customers, data.priceEntries,
    );
    setOrders(result.orders);
    setSuppliers(result.suppliers);
    setWarehouses(result.warehouses);
    setCustomers(result.customers);
    setIsAllocated(true);
  }, []);

  const resetAllocations = useCallback(() => {
    const data = generateMockData();
    initialData.current = data;
    setOrders(data.orders);
    setSuppliers(data.suppliers);
    setWarehouses(data.warehouses);
    setCustomers(data.customers);
    setIsAllocated(false);
  }, []);

  const runAutoAllocate = useCallback(() => {
    const data = initialData.current;
    const result = autoAllocate(
      data.orders, data.suppliers, data.warehouses, data.customers, data.priceEntries,
    );
    setOrders(result.orders);
    setSuppliers(result.suppliers);
    setWarehouses(result.warehouses);
    setCustomers(result.customers);
    setIsAllocated(true);
  }, []);

  const getManualConstraints = useCallback(
    (orderId: string): AllocationConstraints | null => {
      const order = orders.find((order) => order.id === orderId);
      if (!order) return null;
      return calculateManualAllocationConstraints(
        order, suppliers, warehouses, customers, priceEntries,
      );
    },
    [orders, suppliers, warehouses, customers, priceEntries],
  );

  const applyManualAllocation = useCallback(
    (orderId: string, newQty: number) => {
      const orderIndex = orders.findIndex((order) => order.id === orderId);
      if (orderIndex === -1) return false;

      const order = orders[orderIndex];
      const constraints = calculateManualAllocationConstraints(
        order, suppliers, warehouses, customers, priceEntries,
      );

      if (!constraints.supplier || !constraints.warehouse || !constraints.customer) return false;

      const qty = bankersRound(newQty, 2);
      if (qty < 0 || qty > constraints.maxAllocation) return false;

      const cost = bankersRound(qty * constraints.unitPrice, 2);
      const qtyDiff = qty - order.allocatedQty;
      const costDiff = cost - order.totalCost;

      const updatedOrders = [...orders];
      updatedOrders[orderIndex] = {
        ...order,
        allocatedQty: qty,
        unitPrice: constraints.unitPrice,
        totalCost: cost,
        resolvedSupplierId: constraints.supplier.id,
        resolvedWarehouseId: constraints.warehouse.id,
      };
      setOrders(updatedOrders);

      adjustSupplierStock(setSuppliers, constraints.supplier.id, qtyDiff);
      adjustWarehouseStock(setWarehouses, constraints.warehouse.id, qtyDiff);
      adjustCustomerCredit(setCustomers, order.customerId, costDiff);

      return true;
    },
    [orders, suppliers, warehouses, customers, priceEntries],
  );

  const summary: Summary = useMemo(() => {
    const allocatedOrders = orders.filter((order) => order.allocatedQty > 0);
    const fullyAllocatedOrders = orders.filter((order) => order.allocatedQty >= order.requestedQty);
    const totalRequested = orders.reduce((sum, order) => sum + order.requestedQty, 0);
    const totalAllocated = orders.reduce((sum, order) => sum + order.allocatedQty, 0);
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalCost, 0);

    return {
      totalOrders: new Set(orders.map((order) => order.orderId)).size,
      totalSubOrders: orders.length,
      allocatedSubOrders: allocatedOrders.length,
      fullyAllocated: fullyAllocatedOrders.length,
      partiallyAllocated: allocatedOrders.length - fullyAllocatedOrders.length,
      unallocated: orders.length - allocatedOrders.length,
      totalRequested: bankersRound(totalRequested, 2),
      totalAllocated: bankersRound(totalAllocated, 2),
      totalRevenue: bankersRound(totalRevenue, 2),
      totalSupplierStock: suppliers.reduce((sum, supplier) => sum + supplier.totalStock, 0),
      remainingSupplierStock: bankersRound(
        suppliers.reduce((sum, supplier) => sum + supplier.remainingStock, 0), 2,
      ),
      totalWarehouseStock: warehouses.reduce((sum, warehouse) => sum + warehouse.totalStock, 0),
      remainingWarehouseStock: bankersRound(
        warehouses.reduce((sum, warehouse) => sum + warehouse.remainingStock, 0), 2,
      ),
      fillRate: totalRequested > 0
        ? bankersRound((totalAllocated / totalRequested) * 100, 1)
        : 0,
    };
  }, [orders, suppliers, warehouses]);

  return {
    orders,
    suppliers,
    warehouses,
    customers,
    items,
    priceEntries,
    summary,
    isAllocated,
    runAutoAllocate,
    resetAllocations,
    getManualConstraints,
    applyManualAllocation,
  };
};

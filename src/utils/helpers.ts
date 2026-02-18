import type { Order, AllocationStatus, OrderType, PriceEntry } from '../types';

export const bankersRound = (num: number, decimals = 2) => {
  if (!isFinite(num)) return num;
  const m = Math.pow(10, decimals);
  const n = +(num * m).toPrecision(15);
  const i = Math.floor(n);
  const f = n - i;
  if (f > 0.5 - 1e-8 && f < 0.5 + 1e-8) {
    return (i % 2 === 0 ? i : i + 1) / m;
  }
  return Math.round(n) / m;
};

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export const formatNumber = (num: number, decimals = 2) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num);

export const formatDate = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export const ORDER_TYPE_PRIORITY: Record<OrderType, number> = {
  EMERGENCY: 0,
  OVER_DUE: 1,
  DAILY: 2,
};

export const PRICE_TIER_MULTIPLIER: Record<OrderType, number> = {
  EMERGENCY: 1.25,
  OVER_DUE: 1.00,
  DAILY: 0.90,
};

export const getUnitPrice = (itemId: string, supplierId: string, orderType: OrderType, priceEntries: PriceEntry[]) => {
  const entry = priceEntries.find(e => e.itemId === itemId && e.supplierId === supplierId);
  if (!entry) return 0;
  return bankersRound(entry.basePrice * PRICE_TIER_MULTIPLIER[orderType], 2);
};

export const getAllocationStatus = (order: Pick<Order, 'allocatedQty' | 'requestedQty'>): AllocationStatus => {
  if (order.allocatedQty === 0) return 'unallocated';
  if (order.allocatedQty >= order.requestedQty) return 'full';
  return 'partial';
};

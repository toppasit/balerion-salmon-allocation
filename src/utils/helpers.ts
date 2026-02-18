import type { Order, AllocationStatus, OrderType, PriceEntry } from '../types';

export const bankersRound = (num: number, decimals = 2) => {
  if (!isFinite(num)) return num;

  const multiplier = Math.pow(10, decimals);
  const shifted = +(num * multiplier).toPrecision(15);
  const integer = Math.floor(shifted);
  const fraction = shifted - integer;

  const isExactMidpoint = fraction > 0.5 - 1e-8 && fraction < 0.5 + 1e-8;
  if (isExactMidpoint) {
    const roundToEven = integer % 2 === 0 ? integer : integer + 1;
    return roundToEven / multiplier;
  }

  return Math.round(shifted) / multiplier;
};

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export const formatNumber = (num: number, decimals = 2) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);

export const formatDate = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

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

export const getUnitPrice = (
  itemId: string,
  supplierId: string,
  orderType: OrderType,
  priceEntries: PriceEntry[],
) => {
  const entry = priceEntries.find(
    (priceEntry) => priceEntry.itemId === itemId && priceEntry.supplierId === supplierId,
  );
  if (!entry) return 0;
  return bankersRound(entry.basePrice * PRICE_TIER_MULTIPLIER[orderType], 2);
};

export const getAllocationStatus = (
  order: Pick<Order, 'allocatedQty' | 'requestedQty'>,
): AllocationStatus => {
  if (order.allocatedQty === 0) return 'unallocated';
  if (order.allocatedQty >= order.requestedQty) return 'full';
  return 'partial';
};

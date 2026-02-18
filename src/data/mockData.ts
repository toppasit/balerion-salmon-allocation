import type { Item, Supplier, Warehouse, Customer, Order, OrderType, PriceEntry, MockData } from '../types';

const mulberry32 = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const createRng = (seed: number) => {
  const rand = mulberry32(seed);
  return {
    next: () => rand(),
    nextInt: (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min,
    nextFloat: (min: number, max: number) => rand() * (max - min) + min,
    pick: <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)],
  };
};

type Rng = ReturnType<typeof createRng>;

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Lisa', 'Daniel', 'Nancy',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Dorothy', 'Andrew', 'Kimberly', 'Paul', 'Emily', 'Joshua', 'Donna',
  'Kenneth', 'Michelle', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa',
  'Timothy', 'Deborah',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts',
];

const ITEMS: Item[] = [
  { id: 'Item-1', name: 'Fresh Atlantic Salmon' },
  { id: 'Item-2', name: 'Smoked Salmon' },
  { id: 'Item-3', name: 'Salmon Steak' },
  { id: 'Item-4', name: 'Salmon Sashimi Grade' },
  { id: 'Item-5', name: 'Salmon Portions' },
];

const SUPPLIER_DATA = [
  { id: 'SP-001', name: 'Nordic Salmon Co.', totalStock: 6500 },
  { id: 'SP-002', name: 'Atlantic Fresh Ltd.', totalStock: 5800 },
  { id: 'SP-003', name: 'FjordFish AS', totalStock: 7200 },
  { id: 'SP-004', name: 'OceanPrime Seafood', totalStock: 4900 },
  { id: 'SP-005', name: 'SalmonKing Inc.', totalStock: 5500 },
  { id: 'SP-006', name: 'ArcticCatch Ltd.', totalStock: 6100 },
  { id: 'SP-007', name: 'PacificHarvest Co.', totalStock: 4200 },
  { id: 'SP-008', name: 'CoastalFarms AS', totalStock: 5300 },
];

const WAREHOUSE_DATA = [
  { id: 'WH-001', name: 'Oslo Central Hub', totalStock: 9500 },
  { id: 'WH-002', name: 'Bergen Cold Storage', totalStock: 8200 },
  { id: 'WH-003', name: 'Trondheim Logistics', totalStock: 10500 },
  { id: 'WH-004', name: 'Stavanger Port', totalStock: 7800 },
  { id: 'WH-005', name: 'Tromsø Arctic Storage', totalStock: 9000 },
  { id: 'WH-006', name: 'Kristiansand Depot', totalStock: 8500 },
];

const REMARKS = ['', '', '', '', '', '', '', '', '', 'Special for VIP', 'Urgent delivery', 'Bulk discount'];

const generatePriceEntries = (rng: Rng, items: Item[], suppliers: Supplier[]): PriceEntry[] => {
  const entries: PriceEntry[] = [];
  for (const item of items) {
    for (const supplier of suppliers) {
      entries.push({ itemId: item.id, supplierId: supplier.id, basePrice: Math.round(rng.nextFloat(50, 200) * 100) / 100 });
    }
  }
  return entries;
};

const generateCustomers = (rng: Rng, count: number): Customer[] => {
  const customers: Customer[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let name: string;
    do { name = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`; } while (usedNames.has(name));
    usedNames.add(name);

    const r = rng.next();
    const creditLimit = r < 0.2 ? rng.nextInt(2000, 5000) : r < 0.6 ? rng.nextInt(5000, 30000) : rng.nextInt(30000, 100000);

    customers.push({ id: `CT-${String(i + 1).padStart(4, '0')}`, name, creditLimit, usedCredit: 0 });
  }
  return customers;
};

const generateOrders = (rng: Rng, customers: Customer[], items: Item[], suppliers: Supplier[], warehouses: Warehouse[], parentCount: number): Order[] => {
  const orders: Order[] = [];
  const orderTypes: OrderType[] = ['EMERGENCY', 'OVER_DUE', 'DAILY'];
  const startDate = new Date('2025-01-01').getTime();
  const dateRange = new Date('2025-12-31').getTime() - startDate;

  for (let p = 0; p < parentCount; p++) {
    const parentId = `ORDER-${String(p + 1).padStart(4, '0')}`;
    const customer = rng.pick(customers);
    const r = rng.next();
    const type = r < 0.1 ? orderTypes[0] : r < 0.3 ? orderTypes[1] : orderTypes[2];
    const orderDate = new Date(startDate + rng.next() * dateRange).toISOString().split('T')[0];
    const remark = rng.pick(REMARKS);

    for (let s = 0; s < rng.nextInt(1, 5); s++) {
      orders.push({
        id: `${parentId}-${String(s + 1).padStart(3, '0')}`,
        orderId: parentId,
        itemId: rng.pick(items).id,
        warehouseId: rng.next() < 0.1 ? 'WH-000' : rng.pick(warehouses).id,
        supplierId: rng.next() < 0.1 ? 'SP-000' : rng.pick(suppliers).id,
        customerId: customer.id,
        customerName: customer.name,
        type,
        requestedQty: Math.round(rng.nextFloat(5, 50) * 100) / 100,
        allocatedQty: 0,
        unitPrice: 0,
        totalCost: 0,
        orderDate,
        remark,
        resolvedSupplierId: null,
        resolvedWarehouseId: null,
      });
    }
  }
  return orders;
};

export const generateMockData = (): MockData => {
  const rng = createRng(12345);
  const suppliers: Supplier[] = SUPPLIER_DATA.map(s => ({ ...s, remainingStock: s.totalStock }));
  const warehouses: Warehouse[] = WAREHOUSE_DATA.map(w => ({ ...w, remainingStock: w.totalStock }));
  const priceEntries = generatePriceEntries(rng, ITEMS, suppliers);
  const customers = generateCustomers(rng, 200);
  const orders = generateOrders(rng, customers, ITEMS, suppliers, warehouses, 2000);

  return { items: ITEMS, suppliers, warehouses, customers, orders, priceEntries };
};

import type { Supplier, Warehouse } from '../types';
import { formatNumber } from '../utils/helpers';

const StockBar = ({ id, label, used, total }: { id: string; label: string; used: number; total: number }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="w-16 font-mono text-gray-500">{id}</span>
    <span className="w-32 truncate text-gray-600">{label}</span>
    <div className="flex-1 h-3 bg-gray-100 border border-gray-200">
      <div className="h-full bg-gray-400" style={{ width: `${total > 0 ? (used / total) * 100 : 0}%` }} />
    </div>
    <span className="w-28 text-right text-gray-500">{formatNumber(used)} / {formatNumber(total)}</span>
  </div>
);

const StockOverview = ({ suppliers, warehouses }: { suppliers: Supplier[]; warehouses: Warehouse[] }) => (
  <div className="border border-gray-200 bg-white p-3 space-y-3">
    <div>
      <h3 className="text-xs font-semibold text-gray-700 mb-2">Supplier Stock</h3>
      <div className="space-y-1">
        {suppliers.map(s => <StockBar key={s.id} id={s.id} label={s.name} used={s.totalStock - s.remainingStock} total={s.totalStock} />)}
      </div>
    </div>
    <div>
      <h3 className="text-xs font-semibold text-gray-700 mb-2">Warehouse Stock</h3>
      <div className="space-y-1">
        {warehouses.map(w => <StockBar key={w.id} id={w.id} label={w.name} used={w.totalStock - w.remainingStock} total={w.totalStock} />)}
      </div>
    </div>
  </div>
);

export default StockOverview;

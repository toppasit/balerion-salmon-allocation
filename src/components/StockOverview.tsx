import { Card, Progress, Space, Typography } from 'antd';
import type { Supplier, Warehouse } from '../types';
import { formatNumber } from '../utils/helpers';

const { Text } = Typography;

const StockBar = ({ id, label, used, total }: { id: string; label: string; used: number; total: number }) => {
  const percent = total > 0 ? Math.round((used / total) * 100) : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Text code style={{ width: 60, fontSize: 12 }}>{id}</Text>
      <Text type="secondary" ellipsis style={{ width: 130, fontSize: 12 }}>{label}</Text>
      <Progress
        percent={percent}
        size="small"
        style={{ flex: 1, margin: 0 }}
        strokeColor="#8c8c8c"
        format={() => ''}
      />
      <Text type="secondary" style={{ width: 120, textAlign: 'right', fontSize: 12, flexShrink: 0 }}>
        {formatNumber(used)} / {formatNumber(total)}
      </Text>
    </div>
  );
};

const StockOverview = ({ suppliers, warehouses }: { suppliers: Supplier[]; warehouses: Warehouse[] }) => (
  <Card size="small" styles={{ body: { padding: 12 } }}>
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Text strong style={{ fontSize: 12 }}>Supplier Stock</Text>
        <Space direction="vertical" size={2} style={{ width: '100%', marginTop: 4 }}>
          {suppliers.map((supplier) => (
            <StockBar
              key={supplier.id}
              id={supplier.id}
              label={supplier.name}
              used={supplier.totalStock - supplier.remainingStock}
              total={supplier.totalStock}
            />
          ))}
        </Space>
      </div>
      <div>
        <Text strong style={{ fontSize: 12 }}>Warehouse Stock</Text>
        <Space direction="vertical" size={2} style={{ width: '100%', marginTop: 4 }}>
          {warehouses.map((warehouse) => (
            <StockBar
              key={warehouse.id}
              id={warehouse.id}
              label={warehouse.name}
              used={warehouse.totalStock - warehouse.remainingStock}
              total={warehouse.totalStock}
            />
          ))}
        </Space>
      </div>
    </Space>
  </Card>
);

export default StockOverview;

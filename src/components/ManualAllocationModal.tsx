import { useState } from 'react';
import { Modal, InputNumber, Descriptions, Alert, Space, Tag, Typography } from 'antd';
import type { Order, AllocationConstraints } from '../types';
import { formatNumber, formatCurrency, getAllocationStatus } from '../utils/helpers';

const { Text } = Typography;

const ManualAllocationModal = ({ order, constraints, onApply, onClose }: {
  order: Order;
  constraints: AllocationConstraints;
  onApply: (orderId: string, qty: number) => boolean;
  onClose: () => void;
}) => {
  const [inputValue, setInputValue] = useState<number | null>(order.allocatedQty);
  const [error, setError] = useState('');

  const parsed = inputValue ?? 0;
  const previewCost = parsed * constraints.unitPrice;
  const status = getAllocationStatus({
    allocatedQty: parsed,
    requestedQty: order.requestedQty,
  });

  const statusColor = status === 'full' ? 'green' : status === 'partial' ? 'orange' : 'default';
  const statusLabel = status === 'full' ? 'Fully allocated' : status === 'partial' ? 'Partially allocated' : 'Unallocated';

  const handleApply = () => {
    const qty = inputValue ?? 0;
    if (qty < 0) {
      setError('Enter a valid non-negative number');
      return;
    }
    if (qty > constraints.maxAllocation) {
      setError(`Max allocation is ${formatNumber(constraints.maxAllocation)}`);
      return;
    }
    if (onApply(order.id, qty)) onClose();
    else setError('Allocation failed');
  };

  return (
    <Modal
      title="Manual Allocation"
      open
      onOk={handleApply}
      onCancel={onClose}
      okText="Apply"
      width={560}
      destroyOnClose
    >
      <Text type="secondary" style={{ fontSize: 12 }}>
        Sub Order: {order.id} | Order: {order.orderId}
      </Text>

      <Descriptions
        column={1}
        size="small"
        style={{ marginTop: 12 }}
        labelStyle={{ width: 140, fontSize: 12 }}
        contentStyle={{ fontSize: 12 }}
      >
        <Descriptions.Item label="Customer">{order.customerName} ({order.customerId})</Descriptions.Item>
        <Descriptions.Item label="Item">{order.itemId}</Descriptions.Item>
        <Descriptions.Item label="Type">{order.type}</Descriptions.Item>
        <Descriptions.Item label="Requested Qty">{formatNumber(order.requestedQty)}</Descriptions.Item>
        <Descriptions.Item label="Unit Price">
          {constraints.unitPrice > 0 ? formatCurrency(constraints.unitPrice) : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Supplier">
          {constraints.supplier?.id ?? '—'} ({constraints.supplier?.name ?? '—'}) — Stock: {formatNumber(constraints.availableSupplierStock)}
        </Descriptions.Item>
        <Descriptions.Item label="Warehouse">
          {constraints.warehouse?.id ?? '—'} ({constraints.warehouse?.name ?? '—'}) — Stock: {formatNumber(constraints.availableWarehouseStock)}
        </Descriptions.Item>
        <Descriptions.Item label="Available Credit">
          {formatCurrency(constraints.availableCredit)} (max qty: {formatNumber(constraints.maxFromCredit)})
        </Descriptions.Item>
        <Descriptions.Item label="Max Allocation">
          <Text strong>{formatNumber(constraints.maxAllocation)}</Text>
        </Descriptions.Item>
      </Descriptions>

      <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>Allocated Quantity</Text>
        <InputNumber
          value={inputValue}
          onChange={(value) => { setInputValue(value); setError(''); }}
          onPressEnter={handleApply}
          min={0}
          max={constraints.maxAllocation}
          step={0.01}
          style={{ width: '100%' }}
          autoFocus
        />
        {error && <Alert message={error} type="error" showIcon style={{ fontSize: 12 }} />}
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Preview: {formatNumber(parsed)} qty = {formatCurrency(previewCost)}
        </Text>
        <Tag color={statusColor}>{statusLabel}</Tag>
      </Space>

      {order.remark && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
          Remark: {order.remark}
        </Text>
      )}
    </Modal>
  );
};

export default ManualAllocationModal;

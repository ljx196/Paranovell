import { useState } from 'react';
import { Modal, Form, Radio, InputNumber, Input, message } from 'antd';
import { useAdminStore } from '../../store/useAdminStore';

interface AdjustBalanceModalProps {
  open: boolean;
  userId: number;
  currentBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdjustBalanceModal({
  open,
  userId,
  currentBalance,
  onClose,
  onSuccess,
}: AdjustBalanceModalProps) {
  const adjustBalance = useAdminStore((s) => s.adjustBalance);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await adjustBalance(userId, {
        type: values.type,
        amount: values.amount,
        reason: values.reason,
      });
      message.success('调账成功');
      form.resetFields();
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        message.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="手动调账"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="确认调账"
      cancelText="取消"
      destroyOnClose
    >
      <div style={{ marginBottom: 16, padding: 12, background: '#f6f8fa', borderRadius: 8 }}>
        <span style={{ color: '#999', fontSize: 13 }}>当前余额：</span>
        <span style={{ fontSize: 18, fontWeight: 600, color: '#1677ff' }}>
          {(currentBalance ?? 0).toLocaleString()} 点
        </span>
      </div>

      <Form form={form} layout="vertical" initialValues={{ type: 'increase' }}>
        <Form.Item
          name="type"
          label="调账类型"
          rules={[{ required: true, message: '请选择调账类型' }]}
        >
          <Radio.Group>
            <Radio value="increase">增加积分</Radio>
            <Radio value="decrease">扣除积分</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="amount"
          label="调账金额（点）"
          rules={[
            { required: true, message: '请输入金额' },
            { type: 'number', min: 1, message: '金额必须大于 0' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="请输入调账金额"
            min={1}
            precision={0}
          />
        </Form.Item>

        <Form.Item
          name="reason"
          label="调账原因"
          rules={[
            { required: true, message: '请输入调账原因' },
            { min: 2, message: '原因至少 2 个字符' },
          ]}
        >
          <Input.TextArea rows={3} placeholder="请输入调账原因" maxLength={200} showCount />
        </Form.Item>
      </Form>
    </Modal>
  );
}

import { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { useAdminStore } from '../../store/useAdminStore';

interface BanUserModalProps {
  open: boolean;
  userId: number;
  userEmail: string;
  currentStatus: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BanUserModal({
  open,
  userId,
  userEmail,
  currentStatus,
  onClose,
  onSuccess,
}: BanUserModalProps) {
  const updateUserStatus = useAdminStore((s) => s.updateUserStatus);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const isBanning = currentStatus === 1; // 当前正常，要封禁
  const title = isBanning ? '确认封禁用户' : '确认解封用户';
  const newStatus = isBanning ? 0 : 1;

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await updateUserStatus(userId, {
        status: newStatus,
        reason: values.reason || '',
      });
      message.success(isBanning ? '用户已封禁' : '用户已解封');
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
      title={title}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText={isBanning ? '确认封禁' : '确认解封'}
      cancelText="取消"
      okButtonProps={isBanning ? { danger: true } : {}}
      destroyOnClose
    >
      <p style={{ marginBottom: 16, color: '#666' }}>
        {isBanning
          ? `确定要封禁用户 ${userEmail} 吗？封禁后该用户将无法登录。`
          : `确定要解封用户 ${userEmail} 吗？解封后该用户可以正常使用。`}
      </p>

      <Form form={form} layout="vertical">
        <Form.Item
          name="reason"
          label="操作原因"
          rules={isBanning ? [{ required: true, message: '请输入封禁原因' }] : []}
        >
          <Input.TextArea
            rows={3}
            placeholder={isBanning ? '请输入封禁原因（必填）' : '请输入解封原因（选填）'}
            maxLength={200}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

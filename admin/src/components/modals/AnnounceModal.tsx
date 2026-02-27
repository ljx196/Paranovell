import { useState } from 'react';
import { Modal, Form, Radio, Input, message } from 'antd';
import { useAdminStore } from '../../store/useAdminStore';

interface AnnounceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AnnounceModal({ open, onClose, onSuccess }: AnnounceModalProps) {
  const createAnnouncement = useAdminStore((s) => s.createAnnouncement);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState<'all' | 'specific'>('all');

  const submitAnnouncement = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await createAnnouncement({
        msg_type: values.msg_type,
        target: values.target,
        target_emails: values.target === 'specific' ? values.target_emails?.split(',').map((e: string) => e.trim()).filter(Boolean) : undefined,
        title: values.title,
        content: values.content,
      });
      message.success('公告发送成功');
      form.resetFields();
      setTarget('all');
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        message.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOk = async () => {
    try {
      await form.validateFields();
    } catch {
      return;
    }

    const values = form.getFieldsValue();
    if (values.target === 'all') {
      Modal.confirm({
        title: '二次确认',
        content: '确定向全部用户发送此公告吗？此操作不可撤回。',
        okButtonProps: { danger: true },
        okText: '确认发送',
        cancelText: '取消',
        onOk: submitAnnouncement,
      });
    } else {
      await submitAnnouncement();
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setTarget('all');
    onClose();
  };

  return (
    <Modal
      title="发送新公告"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="发送"
      cancelText="取消"
      width={560}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ msg_type: 'notice', target: 'all' }}>
        <Form.Item
          name="msg_type"
          label="消息类型"
          rules={[{ required: true, message: '请选择消息类型' }]}
        >
          <Radio.Group>
            <Radio value="notice">系统公告</Radio>
            <Radio value="account">账户通知</Radio>
            <Radio value="usage">用量提醒</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="target"
          label="发送对象"
          rules={[{ required: true, message: '请选择发送对象' }]}
        >
          <Radio.Group onChange={(e) => setTarget(e.target.value)}>
            <Radio value="all">全部用户</Radio>
            <Radio value="specific">指定用户</Radio>
          </Radio.Group>
        </Form.Item>

        {target === 'specific' && (
          <Form.Item
            name="target_emails"
            label="目标用户邮箱"
            rules={[{ required: true, message: '请输入用户邮箱' }]}
          >
            <Input.TextArea
              rows={2}
              placeholder="多个邮箱用逗号分隔"
              maxLength={500}
            />
          </Form.Item>
        )}

        <Form.Item
          name="title"
          label="标题"
          rules={[
            { required: true, message: '请输入标题' },
            { max: 100, message: '标题不超过 100 字符' },
          ]}
        >
          <Input placeholder="请输入公告标题" />
        </Form.Item>

        <Form.Item
          name="content"
          label="内容"
          rules={[
            { required: true, message: '请输入内容' },
            { max: 2000, message: '内容不超过 2000 字符' },
          ]}
        >
          <Input.TextArea rows={4} placeholder="请输入公告内容" showCount maxLength={2000} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAdminStore } from '../store/useAdminStore';

export default function Login() {
  const navigate = useNavigate();
  const login = useAdminStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await login(values.email, values.password);
      message.success('登录成功');
      navigate('/admin/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '登录失败';
      setErrorMsg(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #001529 0%, #003a70 100%)',
      }}
    >
      <div
        style={{
          width: 400,
          background: '#fff',
          borderRadius: 12,
          padding: 40,
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, color: '#001529', marginBottom: 4 }}>
            GenNovel Admin
          </h1>
          <p style={{ color: '#999', fontSize: 13, margin: 0 }}>
            管理后台登录
          </p>
        </div>

        {errorMsg && (
          <div style={{
            padding: '8px 12px', marginBottom: 16, borderRadius: 6,
            background: '#fff2f0', border: '1px solid #ffccc7', color: '#ff4d4f', fontSize: 13,
          }}>
            {errorMsg}
          </div>
        )}

        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#bbb' }} />}
              placeholder="admin@example.com"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bbb' }} />}
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{ fontWeight: 500 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

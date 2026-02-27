import { useEffect, useState, useMemo } from 'react';
import { Card, Form, Switch, InputNumber, Button, Tag, Input, Space, message, Spin } from 'antd';
import { SaveOutlined, PlusOutlined } from '@ant-design/icons';
import { useAdminStore } from '../store/useAdminStore';

interface ConfigFormValues {
  'registration.enabled': boolean;
  'registration.invite_only': boolean;
  'registration.gift_points': number;
  'referral.referrer_reward': number;
  'referral.referee_reward': number;
  'balance.low_threshold': number;
  'recharge.rate': number;
  'recharge.min_amount': number;
  'recharge.presets': string;
}

export default function Configs() {
  const { configs, isConfigsLoading, isConfigsSaving, fetchConfigs, updateConfigs } = useAdminStore();
  const [form] = Form.useForm();
  const [presets, setPresets] = useState<number[]>([]);
  const [newPreset, setNewPreset] = useState<string>('');

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  // Convert configs array to form values
  const initialValues = useMemo(() => {
    const values: Record<string, unknown> = {};
    for (const cfg of configs) {
      if (cfg.value_type === 'bool') {
        values[cfg.key] = cfg.value === 'true';
      } else if (cfg.value_type === 'number' || cfg.value_type === 'int') {
        values[cfg.key] = Number(cfg.value);
      } else {
        values[cfg.key] = cfg.value;
      }
    }
    // Parse presets
    const presetsStr = values['recharge.presets'] as string;
    if (presetsStr) {
      try {
        const parsed = JSON.parse(presetsStr);
        if (Array.isArray(parsed)) setPresets(parsed);
      } catch {
        // ignore
      }
    }
    return values;
  }, [configs]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const handleSave = async () => {
    try {
      const values = form.getFieldsValue() as ConfigFormValues;
      const updates: Array<{ key: string; value: string }> = [];

      for (const cfg of configs) {
        const formValue = values[cfg.key as keyof ConfigFormValues];
        let newValue: string;

        if (cfg.key === 'recharge.presets') {
          newValue = JSON.stringify(presets);
        } else if (typeof formValue === 'boolean') {
          newValue = String(formValue);
        } else {
          newValue = String(formValue ?? cfg.value);
        }

        if (newValue !== cfg.value) {
          updates.push({ key: cfg.key, value: newValue });
        }
      }

      if (updates.length === 0) {
        message.info('没有需要保存的修改');
        return;
      }

      await updateConfigs({ configs: updates });
      message.success('配置保存成功');
      fetchConfigs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '保存失败';
      message.error(msg);
    }
  };

  const addPreset = () => {
    const val = Number(newPreset);
    if (!val || val <= 0) return;
    if (presets.includes(val)) return;
    setPresets([...presets, val].sort((a, b) => a - b));
    setNewPreset('');
  };

  const removePreset = (val: number) => {
    setPresets(presets.filter((p) => p !== val));
  };

  return (
    <Spin spinning={isConfigsLoading}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>系统配置</div>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={isConfigsSaving}
          onClick={handleSave}
        >
          保存全部修改
        </Button>
      </div>

      <Form form={form} layout="vertical">
        {/* Registration Settings */}
        <Card style={{ marginBottom: 16, borderRadius: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
            注册设置
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Form.Item name="registration.enabled" label="开放注册" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="registration.invite_only" label="仅邀请码注册" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="registration.gift_points" label="新用户赠送积分">
              <InputNumber style={{ width: '100%' }} min={0} precision={0} />
            </Form.Item>
          </div>
        </Card>

        {/* Referral Settings */}
        <Card style={{ marginBottom: 16, borderRadius: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
            邀请奖励
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="referral.referrer_reward" label="邀请人奖励（点）">
              <InputNumber style={{ width: '100%' }} min={0} precision={0} />
            </Form.Item>
            <Form.Item name="referral.referee_reward" label="被邀请人奖励（点）">
              <InputNumber style={{ width: '100%' }} min={0} precision={0} />
            </Form.Item>
          </div>
        </Card>

        {/* Balance Alert */}
        <Card style={{ marginBottom: 16, borderRadius: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
            余额预警
          </div>
          <Form.Item name="balance.low_threshold" label="低余额阈值（点）" style={{ maxWidth: 300 }}>
            <InputNumber style={{ width: '100%' }} min={0} precision={0} />
          </Form.Item>
        </Card>

        {/* Recharge Settings */}
        <Card style={{ borderRadius: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
            充值设置
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="recharge.rate" label="兑换比率（元 → 点）">
              <InputNumber style={{ width: '100%' }} min={1} precision={0} />
            </Form.Item>
            <Form.Item name="recharge.min_amount" label="最低充值金额（元）">
              <InputNumber style={{ width: '100%' }} min={1} precision={2} />
            </Form.Item>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>充值套餐</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {presets.map((val) => (
                <Tag
                  key={val}
                  closable
                  onClose={() => removePreset(val)}
                  style={{ fontSize: 13, padding: '2px 8px' }}
                >
                  ¥{val}
                </Tag>
              ))}
            </div>
            <Space>
              <Input
                placeholder="金额"
                value={newPreset}
                onChange={(e) => setNewPreset(e.target.value)}
                onPressEnter={addPreset}
                style={{ width: 120 }}
              />
              <Button icon={<PlusOutlined />} onClick={addPreset}>
                添加
              </Button>
            </Space>
          </div>
        </Card>
      </Form>
    </Spin>
  );
}

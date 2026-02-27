import { useState } from 'react';
import { Modal, InputNumber, Radio, Input, Button, Spin, Descriptions, Tag, Space } from 'antd';
import { useAdminStore } from '../../store/useAdminStore';
import type { ScanResponse } from '../../types/admin';

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function ScanModal({ open, onClose, onComplete }: Props) {
  const { scanContent } = useAdminStore();

  const [scanScope, setScanScope] = useState<'all' | 'user'>('all');
  const [userId, setUserId] = useState<number | undefined>();
  const [days, setDays] = useState(7);
  const [maxConversations, setMaxConversations] = useState(100);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);

  const handleScan = async () => {
    setScanning(true);
    setResult(null);
    try {
      const res = await scanContent({
        user_id: scanScope === 'user' ? userId : 0,
        days,
        max_conversations: maxConversations,
      });
      setResult(res);
    } catch (err: unknown) {
      // Error shown by store
    } finally {
      setScanning(false);
    }
  };

  const handleClose = () => {
    if (result && result.flagged_conversations > 0) {
      onComplete();
    } else {
      onClose();
    }
    setResult(null);
    setScanScope('all');
    setUserId(undefined);
  };

  return (
    <Modal
      title="内容扫描"
      open={open}
      onCancel={handleClose}
      footer={result ? (
        <Button type="primary" onClick={handleClose}>
          {result.flagged_conversations > 0 ? '查看标记结果' : '关闭'}
        </Button>
      ) : (
        <Space>
          <Button onClick={handleClose}>取消</Button>
          <Button type="primary" loading={scanning} onClick={handleScan}>
            开始扫描
          </Button>
        </Space>
      )}
      width={560}
    >
      {scanning ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#666' }}>正在扫描中，请稍候...</div>
        </div>
      ) : result ? (
        <div>
          <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="扫描对话数">{result.scanned_conversations}</Descriptions.Item>
            <Descriptions.Item label="扫描消息数">{result.scanned_messages}</Descriptions.Item>
            <Descriptions.Item label="标记对话数" span={2}>
              <span style={{ color: result.flagged_conversations > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 600, fontSize: 16 }}>
                {result.flagged_conversations}
              </span>
            </Descriptions.Item>
          </Descriptions>

          {result.flagged_details.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>标记详情</div>
              {result.flagged_details.map((item, i) => (
                <div key={i} style={{
                  padding: '8px 12px', marginBottom: 8, borderRadius: 6,
                  background: '#fff2f0', border: '1px solid #ffccc7',
                }}>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>
                    <strong>对话 #{item.conversation_id}</strong> — {item.user_email}
                  </div>
                  <div>
                    {item.matched_words.map((word) => (
                      <Tag key={word} color="red" style={{ marginBottom: 2 }}>{word}</Tag>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>扫描范围</div>
            <Radio.Group value={scanScope} onChange={(e) => setScanScope(e.target.value)}>
              <Radio value="all">全部用户</Radio>
              <Radio value="user">指定用户</Radio>
            </Radio.Group>
            {scanScope === 'user' && (
              <InputNumber
                style={{ marginTop: 8, width: '100%' }}
                placeholder="输入用户 ID"
                min={1}
                value={userId}
                onChange={(v) => setUserId(v || undefined)}
              />
            )}
          </div>

          <div>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>时间范围</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>最近</span>
              <InputNumber min={1} max={30} value={days} onChange={(v) => setDays(v || 7)} style={{ width: 80 }} />
              <span>天</span>
            </div>
          </div>

          <div>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>最大扫描对话数</div>
            <InputNumber min={1} max={500} value={maxConversations} onChange={(v) => setMaxConversations(v || 100)} style={{ width: 120 }} />
          </div>
        </div>
      )}
    </Modal>
  );
}

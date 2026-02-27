import { useState } from 'react';
import { Modal, Radio, Input, Select, message, Tag } from 'antd';
import { useAdminStore } from '../../store/useAdminStore';
import { SENSITIVE_CATEGORY_MAP } from '../../utils/format';
import type { SensitiveCategory } from '../../types/admin';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddSensitiveWordModal({ open, onClose, onSuccess }: Props) {
  const { createSensitiveWords } = useAdminStore();

  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [singleWord, setSingleWord] = useState('');
  const [batchText, setBatchText] = useState('');
  const [category, setCategory] = useState<SensitiveCategory>('other');
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    const words: Array<{ word: string; category: SensitiveCategory }> = [];

    if (mode === 'single') {
      const w = singleWord.trim();
      if (!w) {
        message.warning('请输入敏感词');
        return;
      }
      words.push({ word: w, category });
    } else {
      const lines = batchText.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        message.warning('请输入至少一个敏感词');
        return;
      }
      lines.forEach((w) => words.push({ word: w, category }));
    }

    setLoading(true);
    try {
      const result = await createSensitiveWords({ words });
      let msg = `成功添加 ${result.created} 个敏感词`;
      if (result.duplicates.length > 0) {
        msg += `，${result.duplicates.length} 个重复跳过`;
      }
      message.success(msg);

      setSingleWord('');
      setBatchText('');
      onSuccess();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '添加失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSingleWord('');
    setBatchText('');
    onClose();
  };

  const categoryOptions = Object.entries(SENSITIVE_CATEGORY_MAP).map(([value, info]) => ({
    value, label: info.text,
  }));

  return (
    <Modal
      title="添加敏感词"
      open={open}
      onCancel={handleClose}
      onOk={handleOk}
      confirmLoading={loading}
      okText="添加"
      width={480}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
        <div>
          <div style={{ marginBottom: 4, fontWeight: 500 }}>添加方式</div>
          <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
            <Radio value="single">单个添加</Radio>
            <Radio value="batch">批量添加</Radio>
          </Radio.Group>
        </div>

        <div>
          <div style={{ marginBottom: 4, fontWeight: 500 }}>类别</div>
          <Select
            value={category}
            onChange={setCategory}
            options={categoryOptions}
            style={{ width: '100%' }}
          />
        </div>

        {mode === 'single' ? (
          <div>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>敏感词</div>
            <Input
              value={singleWord}
              onChange={(e) => setSingleWord(e.target.value)}
              placeholder="输入敏感词"
              maxLength={100}
            />
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>敏感词列表（每行一个）</div>
            <Input.TextArea
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              rows={6}
              placeholder={`每行输入一个敏感词，例如：\n词语1\n词语2\n词语3`}
            />
            {batchText && (
              <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                共 {batchText.split('\n').map((l) => l.trim()).filter(Boolean).length} 个词
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

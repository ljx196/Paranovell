import { Modal } from 'antd';
import type { AuditLogDetail } from '../../types/admin';
import { ACTION_LABELS, formatFullDateTime } from '../../utils/format';

interface LogDetailModalProps {
  open: boolean;
  log: AuditLogDetail | null;
  onClose: () => void;
}

export default function LogDetailModal({ open, log, onClose }: LogDetailModalProps) {
  if (!log) return null;

  return (
    <Modal
      title="操作日志详情"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      {/* Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ color: '#999', minWidth: 70, fontSize: 13 }}>操作人</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{log.admin_name || '-'}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ color: '#999', minWidth: 70, fontSize: 13 }}>操作时间</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{formatFullDateTime(log.created_at)}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ color: '#999', minWidth: 70, fontSize: 13 }}>操作类型</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{ACTION_LABELS[log.action] || log.action}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ color: '#999', minWidth: 70, fontSize: 13 }}>IP 地址</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{log.ip || '-'}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, gridColumn: '1 / -1' }}>
          <span style={{ color: '#999', minWidth: 70, fontSize: 13 }}>操作对象</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>
            {log.target_type ? `${log.target_type} #${log.target_id}` : '-'}
          </span>
        </div>
      </div>

      {/* Detail JSON */}
      {log.detail && (
        <>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>详细信息</div>
          <pre
            style={{
              background: '#f6f8fa',
              padding: 16,
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
              overflow: 'auto',
              maxHeight: 300,
              margin: 0,
            }}
          >
            {typeof log.detail === 'string' ? log.detail : JSON.stringify(log.detail, null, 2)}
          </pre>
        </>
      )}
    </Modal>
  );
}

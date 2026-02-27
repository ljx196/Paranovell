import { Card, Button } from 'antd';
import type { RecentLog } from '../../types/admin';
import { ACTION_LABELS, formatDateTime } from '../../utils/format';

interface RecentLogsProps {
  logs: RecentLog[];
  onViewAll: () => void;
}

const ACTION_DOT_COLOR: Record<string, string> = {
  'user.disable': '#ff4d4f',
  'user.enable': '#52c41a',
  'user.adjust_balance': '#1677ff',
  'user.reset_password': '#722ed1',
  'message.broadcast': '#52c41a',
  'message.delete': '#ff4d4f',
  'config.update': '#fa8c16',
  'order.refund': '#1677ff',
};

export default function RecentLogs({ logs, onViewAll }: RecentLogsProps) {
  return (
    <Card
      bodyStyle={{ padding: 20 }}
      style={{ borderRadius: 10 }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600 }}>最近操作</span>
        <Button type="link" size="small" onClick={onViewAll}>
          查看全部 →
        </Button>
      </div>
      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#ccc', padding: '40px 0' }}>
          暂无操作记录
        </div>
      ) : (
        logs.map((log, idx) => (
          <div
            key={log.id || idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: idx < logs.length - 1 ? '1px solid #f5f5f5' : 'none',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: ACTION_DOT_COLOR[log.action] || '#999',
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1, fontSize: 13, color: '#555' }}>
              {log.admin_name || '系统'} {ACTION_LABELS[log.action] || log.action}
              {log.target_name ? ` - ${log.target_name}` : ''}
            </span>
            <span style={{ fontSize: 12, color: '#bbb', whiteSpace: 'nowrap' }}>
              {formatDateTime(log.created_at)}
            </span>
          </div>
        ))
      )}
    </Card>
  );
}

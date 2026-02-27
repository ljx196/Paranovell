import { Card } from 'antd';
import { formatNumber, formatChangeRate } from '../../utils/format';

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  yesterdayValue?: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

export default function StatCard({
  title,
  value,
  prefix,
  yesterdayValue,
  icon,
  iconBg,
  iconColor,
}: StatCardProps) {
  const change = yesterdayValue != null ? formatChangeRate(value, yesterdayValue) : null;

  return (
    <Card bodyStyle={{ padding: 20 }} style={{ borderRadius: 10 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 13, color: '#999' }}>{title}</span>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 8 }}>
        {prefix}
        {formatNumber(value)}
      </div>
      {change && (
        <div
          style={{
            fontSize: 12,
            color: change.isUp ? '#52c41a' : '#ff4d4f',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>{change.text}</span>
          <span style={{ color: '#bbb' }}>较昨日</span>
        </div>
      )}
    </Card>
  );
}

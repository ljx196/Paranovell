import { Card, Spin } from 'antd';
import { Column } from '@ant-design/charts';
import type { TrendItem } from '../../types/admin';
import dayjs from 'dayjs';

interface ChartCardProps {
  title: string;
  data: TrendItem[];
  days: number;
  onDaysChange: (days: number) => void;
  color: [string, string];
  isLoading?: boolean;
}

const DAY_OPTIONS = [7, 30, 90];

export default function ChartCard({
  title,
  data,
  days,
  onDaysChange,
  color,
  isLoading,
}: ChartCardProps) {
  const chartConfig = {
    data,
    xField: 'date',
    yField: 'value',
    color: `l(90) 0:${color[0]} 1:${color[1]}`,
    columnStyle: { radius: [4, 4, 0, 0] },
    height: 200,
    xAxis: {
      label: {
        formatter: (v: string) => dayjs(v).format('MM/DD'),
        style: { fontSize: 11 },
      },
    },
    yAxis: {
      label: { style: { fontSize: 11 } },
    },
    tooltip: {
      formatter: (datum: TrendItem) => ({
        name: title,
        value: datum.value.toLocaleString(),
      }),
    },
  };

  return (
    <Card bodyStyle={{ padding: 20 }} style={{ borderRadius: 10 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => onDaysChange(d)}
              style={{
                padding: '3px 10px',
                borderRadius: 4,
                fontSize: 12,
                cursor: 'pointer',
                color: days === d ? '#fff' : '#999',
                background: days === d ? '#1677ff' : '#f5f5f5',
                border: 'none',
              }}
            >
              {d}天
            </button>
          ))}
        </div>
      </div>
      <Spin spinning={!!isLoading}>
        {data.length > 0 ? (
          <Column {...chartConfig} />
        ) : (
          <div
            style={{
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ccc',
              background: '#fafafa',
              borderRadius: 8,
            }}
          >
            暂无数据
          </div>
        )}
      </Spin>
    </Card>
  );
}

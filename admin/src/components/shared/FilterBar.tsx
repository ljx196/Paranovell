import { useState } from 'react';
import { Input, Select, DatePicker, Button, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export interface FilterItem {
  type: 'select' | 'input' | 'dateRange';
  key: string;
  placeholder: string;
  options?: Array<{ label: string; value: string | number }>;
  width?: number;
}

interface FilterBarProps {
  items: FilterItem[];
  onSearch: (values: Record<string, unknown>) => void;
}

export default function FilterBar({ items, onSearch }: FilterBarProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});

  const handleChange = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    const result: Record<string, unknown> = {};
    for (const item of items) {
      const val = values[item.key];
      if (item.type === 'dateRange' && Array.isArray(val) && val.length === 2) {
        result.start_date = dayjs(val[0]).format('YYYY-MM-DD');
        result.end_date = dayjs(val[1]).format('YYYY-MM-DD');
      } else if (val !== undefined && val !== null && val !== '') {
        result[item.key] = val;
      }
    }
    result.page = 1;
    onSearch(result);
  };

  return (
    <Space wrap style={{ marginBottom: 16 }}>
      {items.map((item) => {
        if (item.type === 'select') {
          return (
            <Select
              key={item.key}
              placeholder={item.placeholder}
              allowClear
              style={{ minWidth: item.width || 120 }}
              options={item.options}
              value={values[item.key] as string | number | undefined}
              onChange={(v) => handleChange(item.key, v)}
            />
          );
        }
        if (item.type === 'dateRange') {
          return (
            <RangePicker
              key={item.key}
              placeholder={['开始日期', '结束日期']}
              onChange={(dates) => handleChange(item.key, dates)}
            />
          );
        }
        return (
          <Input
            key={item.key}
            placeholder={item.placeholder}
            allowClear
            style={{ width: item.width || 200 }}
            value={values[item.key] as string | undefined}
            onChange={(e) => handleChange(item.key, e.target.value)}
            onPressEnter={handleSearch}
          />
        );
      })}
      <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
        搜索
      </Button>
    </Space>
  );
}

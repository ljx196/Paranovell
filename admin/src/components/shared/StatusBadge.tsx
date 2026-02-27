import { Tag } from 'antd';

export type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'purple';

interface StatusBadgeProps {
  text: string;
  variant: BadgeVariant;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  success: { bg: '#f6ffed', color: '#52c41a', border: '#b7eb8f' },
  error: { bg: '#fff2f0', color: '#ff4d4f', border: '#ffccc7' },
  warning: { bg: '#fffbe6', color: '#faad14', border: '#ffe58f' },
  info: { bg: '#e6f4ff', color: '#1677ff', border: '#91caff' },
  purple: { bg: '#f9f0ff', color: '#722ed1', border: '#d3adf7' },
};

export default function StatusBadge({ text, variant }: StatusBadgeProps) {
  const style = VARIANT_STYLES[variant];
  return (
    <Tag
      style={{
        background: style.bg,
        color: style.color,
        borderColor: style.border,
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 500,
        margin: 0,
      }}
    >
      {text}
    </Tag>
  );
}

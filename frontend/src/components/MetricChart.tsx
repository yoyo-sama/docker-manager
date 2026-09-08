import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface DataPoint {
  time: string;
  [key: string]: number | string;
}

interface Props {
  title: string;
  data: DataPoint[];
  dataKey: string;
  unit?: string;
  color?: string;
  yAxisDomain?: [number, number];
}

export default function MetricChart({ title, data, dataKey, unit, color = '#0ea5e9', yAxisDomain }: Props) {
  const gradientId = `grad-${dataKey}`;

  return (
    <div className="bg-surface border border-line rounded-xl p-4">
      <h3 className="text-sm font-semibold tracking-tight mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: 'var(--muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--line)' }}
            tickFormatter={(t) => new Date(t as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--muted)' }}
            tickLine={false}
            axisLine={false}
            domain={yAxisDomain}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--elevated)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--fg)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)',
              padding: '6px 10px',
            }}
            labelStyle={{ color: 'var(--muted)', marginBottom: 2 }}
            labelFormatter={(t) => new Date(t as string).toLocaleTimeString()}
            formatter={(v) => [`${Number(v ?? 0).toFixed(1)}${unit || ''}`]}
            cursor={{ stroke: 'var(--line)' }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

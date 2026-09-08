import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

export default function MetricChart({ title, data, dataKey, unit, color = '#3b82f6', yAxisDomain }: Props) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickFormatter={(t) => new Date(t as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          />
          <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} domain={yAxisDomain} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
            labelFormatter={(t) => new Date(t as string).toLocaleTimeString()}
            formatter={(v) => [`${Number(v ?? 0).toFixed(1)}${unit || ''}`]}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

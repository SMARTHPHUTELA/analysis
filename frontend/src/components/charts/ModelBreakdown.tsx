import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { ModelBreakdown }   from '@/types';
import { formatCost }       from '@/utils/formatters';
import { PROVIDER_COLORS }  from '@/utils/constants';

interface Props {
  data:     ModelBreakdown[];
  loading?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
      <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
      <p className="text-xs text-gray-500">Cost: {formatCost(d.total_cost)}</p>
      <p className="text-xs text-gray-500">Requests: {d.request_count.toLocaleString()}</p>
      <p className="text-xs text-gray-500 capitalize">Provider: {d.provider}</p>
    </div>
  );
}

export default function ModelBreakdownChart({ data, loading }: Props) {
  if (loading) {
    return <div className="h-56 animate-pulse bg-gray-50 rounded-xl" />;
  }

  if (!data.length) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-gray-400">
        No model data yet
      </div>
    );
  }

  const formatted = data.slice(0, 6).map((d) => ({
    ...d,
    total_cost: Number(d.total_cost),
    label: d.model.length > 16 ? d.model.slice(0, 16) + '…' : d.model,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={formatted}
        margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        barSize={28}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatCost(v)}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
        <Bar dataKey="total_cost" radius={[6, 6, 0, 0]}>
          {formatted.map((d, i) => (
            <Cell
              key={i}
              fill={PROVIDER_COLORS[d.provider] ?? '#4f6ef7'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
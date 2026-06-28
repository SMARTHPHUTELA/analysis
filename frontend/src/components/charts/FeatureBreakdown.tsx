import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FeatureBreakdown } from '@/types';
import { formatCost }       from '@/utils/formatters';
import { FEATURE_COLORS }   from '@/utils/constants';

interface Props {
  data:     FeatureBreakdown[];
  loading?: boolean;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
      <p className="text-sm font-semibold text-gray-900 capitalize mb-1">{d.feature}</p>
      <p className="text-xs text-gray-500">Cost: {formatCost(d.total_cost)}</p>
      <p className="text-xs text-gray-500">Requests: {d.request_count.toLocaleString()}</p>
      <p className="text-xs text-gray-500">Tokens: {d.total_tokens.toLocaleString()}</p>
    </div>
  );
}

export default function FeatureBreakdownChart({ data, loading }: Props) {
  if (loading) {
    return <div className="h-56 animate-pulse bg-gray-50 rounded-xl" />;
  }

  if (!data.length) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-gray-400">
        No feature data yet
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    total_cost: Number(d.total_cost),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={formatted}
          dataKey="total_cost"
          nameKey="feature"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
        >
          {formatted.map((_, i) => (
            <Cell
              key={i}
              fill={FEATURE_COLORS[i % FEATURE_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span className="text-xs text-gray-600 capitalize">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
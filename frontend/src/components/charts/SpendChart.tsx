// import {
//   AreaChart, Area, XAxis, YAxis, CartesianGrid,
//   Tooltip, ResponsiveContainer,
// } from 'recharts';
// import { DailySpend }   from '@/types';
// import { formatCost }   from '@/utils/formatters';
// import { format, parseISO } from 'date-fns';

// interface Props {
//   data:     DailySpend[];
//   loading?: boolean;
// }

// function CustomTooltip({ active, payload, label }: any) {
//   if (!active || !payload?.length) return null;
//   return (
//     <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
//       <p className="text-xs text-gray-500 mb-2">
//         {label ? format(parseISO(label), 'MMM d, yyyy') : ''}
//       </p>
//       <p className="text-sm font-semibold text-gray-900">
//         {formatCost(payload[0]?.value ?? 0)}
//       </p>
//       <p className="text-xs text-gray-500">
//         {payload[1]?.value?.toLocaleString() ?? 0} requests
//       </p>
//     </div>
//   );
// }

// export default function SpendChart({ data, loading }: Props) {
//   if (loading) {
//     return (
//       <div className="h-64 flex items-center justify-center">
//         <div className="animate-pulse w-full h-full bg-gray-50 rounded-xl" />
//       </div>
//     );
//   }

//   if (!data.length) {
//     return (
//       <div className="h-64 flex flex-col items-center justify-center text-gray-400">
//         <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
//             d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z
//                M9 19V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2
//                m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//         </svg>
//         <p className="text-sm">No spend data yet</p>
//       </div>
//     );
//   }

//   const formatted = data.map((d) => ({
//     ...d,
//     total_cost: Number(d.total_cost),
//   }));

//   return (
//     <ResponsiveContainer width="100%" height={240}>
//       <AreaChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
//         <defs>
//           <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
//             <stop offset="5%"  stopColor="#4f6ef7" stopOpacity={0.15} />
//             <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0}    />
//           </linearGradient>
//         </defs>
//         <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
//         <XAxis
//           dataKey="date"
//           tickFormatter={(d) => format(parseISO(d), 'MMM d')}
//           tick={{ fontSize: 11, fill: '#9ca3af' }}
//           axisLine={false}
//           tickLine={false}
//           interval="preserveStartEnd"
//         />
//         <YAxis
//           tickFormatter={(v) => formatCost(v)}
//           tick={{ fontSize: 11, fill: '#9ca3af' }}
//           axisLine={false}
//           tickLine={false}
//           width={60}
//         />
//         <Tooltip content={<CustomTooltip />} />
//         <Area
//           type="monotone"
//           dataKey="total_cost"
//           stroke="#4f6ef7"
//           strokeWidth={2.5}
//           fill="url(#spendGradient)"
//           dot={false}
//           activeDot={{ r: 5, fill: '#4f6ef7', strokeWidth: 0 }}
//         />
//       </AreaChart>
//     </ResponsiveContainer>
//   );
// }




import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { DailySpend }       from '@/types';
import { formatCost }        from '@/utils/formatters';
import { format, parseISO }  from 'date-fns';

interface Props {
  data:     DailySpend[];
  loading?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 min-w-40">
      <p className="text-xs text-gray-500 mb-2 font-medium">
        {label ? format(parseISO(label), 'MMM d, yyyy') : ''}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-500">Cost</span>
          <span className="text-xs font-semibold text-brand-600">
            {formatCost(payload[0]?.value ?? 0)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-500">Requests</span>
          <span className="text-xs font-semibold text-gray-900">
            {(payload[1]?.value ?? 0).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-500">Tokens</span>
          <span className="text-xs font-semibold text-gray-900">
            {(payload[0]?.payload?.total_tokens ?? 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SpendChart({ data, loading }: Props) {
  if (loading) {
    return <div className="h-64 animate-pulse bg-gray-50 rounded-xl" />;
  }

  if (!data.length) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-400">
        <svg className="w-10 h-10 mb-2 opacity-40" fill="none"
          stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0
               002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2
               2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2
               2 0 01-2-2z" />
        </svg>
        <p className="text-sm">No spend data yet</p>
        <p className="text-xs mt-1">Make some proxy calls to see data here</p>
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    date:          d.date,
    total_cost:    Number(d.total_cost),
    request_count: Number(d.request_count),
    total_tokens:  Number(d.total_tokens),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#4f6ef7" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => format(parseISO(d), 'MMM d')}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          yAxisId="cost"
          orientation="left"
          tickFormatter={(v) => formatCost(v)}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <YAxis
          yAxisId="requests"
          orientation="right"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span className="text-xs text-gray-500 capitalize">
              {value === 'total_cost' ? 'Cost ($)' : 'Requests'}
            </span>
          )}
        />
        <Area
          yAxisId="cost"
          type="monotone"
          dataKey="total_cost"
          name="total_cost"
          stroke="#4f6ef7"
          strokeWidth={2.5}
          fill="url(#spendGradient)"
          dot={false}
          activeDot={{ r: 5, fill: '#4f6ef7', strokeWidth: 0 }}
        />
        <Bar
          yAxisId="requests"
          dataKey="request_count"
          name="request_count"
          fill="#e0e7ff"
          radius={[3, 3, 0, 0]}
          maxBarSize={20}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
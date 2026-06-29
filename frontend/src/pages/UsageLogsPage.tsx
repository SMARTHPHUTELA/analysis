// import { useState }       from 'react';
// import { useAuth } from '@/context/AuthContext';
// import { useUsageLogs }   from '@/hooks/useAnalytics';
// import Table              from '@/components/ui/Table';
// import Badge              from '@/components/ui/Badge';
// import { UsageLog, RequestStatus } from '@/types';
// import {
//   formatCost, formatTokens,
//   formatLatency, formatDateTime,
// } from '@/utils/formatters';
// import { PROVIDER_LABELS } from '@/utils/constants';
// import clsx                from 'clsx';

// const STATUS_VARIANT: Record<RequestStatus, 'success' | 'error' | 'warning' | 'info'> = {
//   success: 'success',
//   error:   'error',
//   blocked: 'warning',
//   cached:  'info',
// };

// export default function UsageLogsPage() {
//   const [limit] = useState(50);
//   const { user }   = useAuth();
//   const orgId      = user?.organization_id ?? '';
//   const { data, loading, offset, nextPage, prevPage, refetch } =
//   useUsageLogs(orgId, limit);

//   const [expandedId, setExpandedId] = useState<string | null>(null);

//   const columns = [
//     {
//       key:    'created_at',
//       header: 'Time',
//       render: (row: UsageLog) => (
//         <span className="text-xs text-gray-500 whitespace-nowrap">
//           {formatDateTime(row.created_at)}
//         </span>
//       ),
//     },
//     {
//       key:    'feature',
//       header: 'Feature',
//       render: (row: UsageLog) => (
//         <Badge label={row.feature} variant="info" />
//       ),
//     },
//     {
//       key:    'provider',
//       header: 'Provider / Model',
//       render: (row: UsageLog) => (
//         <div>
//           <p className="text-xs font-medium text-gray-900">
//             {PROVIDER_LABELS[row.provider] ?? row.provider}
//           </p>
//           <p className="text-xs text-gray-400 mt-0.5 font-mono">{row.model}</p>
//         </div>
//       ),
//     },
//     {
//       key:    'tokens',
//       header: 'Tokens',
//       render: (row: UsageLog) => (
//         <div className="text-xs">
//           <p className="text-gray-900 font-medium">
//             {formatTokens(row.total_tokens)}
//           </p>
//           <p className="text-gray-400">
//             {formatTokens(row.prompt_tokens)} in ·{' '}
//             {formatTokens(row.completion_tokens)} out
//           </p>
//         </div>
//       ),
//     },
//     {
//       key:    'cost',
//       header: 'Cost',
//       render: (row: UsageLog) => (
//         <span className={clsx(
//           'text-xs font-medium',
//           row.cache_hit ? 'text-green-600' : 'text-gray-900'
//         )}>
//           {row.cache_hit ? 'Free' : formatCost(Number(row.total_cost))}
//         </span>
//       ),
//     },
//     {
//       key:    'latency',
//       header: 'Latency',
//       render: (row: UsageLog) => (
//         <span className="text-xs text-gray-500">
//           {row.cache_hit ? '—' : formatLatency(row.latency_ms)}
//         </span>
//       ),
//     },
//     {
//       key:    'status',
//       header: 'Status',
//       render: (row: UsageLog) => (
//         <div className="flex items-center gap-1.5">
//           <Badge
//             label={row.request_status}
//             variant={STATUS_VARIANT[row.request_status]}
//             dot
//           />
//           {row.cache_hit && (
//             <Badge label="cached" variant="info" />
//           )}
//         </div>
//       ),
//     },
//     {
//       key:    'customer',
//       header: 'Customer',
//       render: (row: UsageLog) => (
//         <span className="text-xs text-gray-400 font-mono">
//           {row.customer_id ?? '—'}
//         </span>
//       ),
//     },
//     {
//       key:    'expand',
//       header: '',
//       render: (row: UsageLog) => (
//         <button
//           onClick={() =>
//             setExpandedId(expandedId === row.id ? null : row.id)
//           }
//           className="text-gray-400 hover:text-gray-600 transition-colors"
//         >
//           <svg
//             className={clsx(
//               'w-4 h-4 transition-transform',
//               expandedId === row.id && 'rotate-180'
//             )}
//             fill="none" stroke="currentColor" viewBox="0 0 24 24"
//           >
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//               d="M19 9l-7 7-7-7" />
//           </svg>
//         </button>
//       ),
//     },
//   ];

//   // Stats bar
//   const totalCost    = data.reduce((s, r) => s + Number(r.total_cost), 0);
//   const cacheHits    = data.filter((r) => r.cache_hit).length;
//   const errorCount   = data.filter((r) => r.request_status === 'error').length;
//   const cacheHitRate = data.length > 0 ? Math.round((cacheHits / data.length) * 100) : 0;

//   return (
//     <div className="space-y-6 max-w-7xl mx-auto">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="page-title">Usage Logs</h2>
//           <p className="text-sm text-gray-500 mt-0.5">
//             Showing {offset + 1}–{offset + data.length} requests
//           </p>
//         </div>
//         <button
//           onClick={refetch}
//           className="btn-secondary flex items-center gap-2"
//         >
//           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//               d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0
//                  0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357
//                  2H15" />
//           </svg>
//           Refresh
//         </button>
//       </div>

//       {/* Quick stats */}
//       {!loading && data.length > 0 && (
//         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//           {[
//             { label: 'Total Cost',    value: formatCost(totalCost) },
//             { label: 'Requests',      value: data.length.toString() },
//             { label: 'Cache Hit Rate',value: `${cacheHitRate}%` },
//             { label: 'Errors',        value: errorCount.toString() },
//           ].map((stat) => (
//             <div key={stat.label} className="card px-4 py-3">
//               <p className="text-xs text-gray-500">{stat.label}</p>
//               <p className="text-lg font-semibold text-gray-900 mt-0.5">{stat.value}</p>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Table */}
//       <div className="card overflow-hidden">
//         <Table
//           columns={columns}
//           data={data}
//           loading={loading}
//           rowKey={(row) => row.id}
//           empty="No requests logged yet."
//         />

//         {/* Expanded row detail */}
//         {expandedId && (() => {
//           const row = data.find((r) => r.id === expandedId);
//           if (!row) return null;
//           return (
//             <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
//               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
//                 <div>
//                   <p className="text-gray-400 mb-1">Request ID</p>
//                   <p className="font-mono text-gray-700 break-all">{row.id}</p>
//                 </div>
//                 <div>
//                   <p className="text-gray-400 mb-1">HTTP Status</p>
//                   <p className="text-gray-700">{row.http_status ?? '—'}</p>
//                 </div>
//                 <div>
//                   <p className="text-gray-400 mb-1">Input Cost</p>
//                   <p className="text-gray-700">{formatCost(Number(row.input_cost))}</p>
//                 </div>
//                 <div>
//                   <p className="text-gray-400 mb-1">Output Cost</p>
//                   <p className="text-gray-700">{formatCost(Number(row.output_cost))}</p>
//                 </div>
//                 {row.error_message && (
//                   <div className="col-span-4">
//                     <p className="text-gray-400 mb-1">Error</p>
//                     <p className="text-red-600 font-mono">{row.error_message}</p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           );
//         })()}

//         {/* Pagination */}
//         <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
//           <button
//             onClick={prevPage}
//             disabled={offset === 0 || loading}
//             className="btn-secondary text-xs disabled:opacity-40"
//           >
//             ← Previous
//           </button>
//           <span className="text-xs text-gray-500">
//             Page {Math.floor(offset / limit) + 1}
//           </span>
//           <button
//             onClick={nextPage}
//             disabled={data.length < limit || loading}
//             className="btn-secondary text-xs disabled:opacity-40"
//           >
//             Next →
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState }            from 'react';
import { useAuth }             from '@/context/AuthContext';
import { useUsageLogs }        from '@/hooks/useAnalytics';
import Badge                   from '@/components/ui/Badge';
import { UsageLog, RequestStatus } from '@/types';
import {
  formatCost, formatTokens,
  formatLatency, formatDateTime,
} from '@/utils/formatters';
import { PROVIDER_LABELS }     from '@/utils/constants';
import clsx                    from 'clsx';

const STATUS_VARIANT: Record<RequestStatus, 'success' | 'error' | 'warning' | 'info'> = {
  success: 'success',
  error:   'error',
  blocked: 'warning',
  cached:  'info',
};

const STATUS_ICON: Record<RequestStatus, string> = {
  success: '✓',
  error:   '✕',
  blocked: '⊘',
  cached:  '◈',
};

export default function UsageLogsPage() {
  const { user }         = useAuth();
  const orgId            = user?.organization_id ?? '';
  const [limit]          = useState(50);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const {
    data, loading, offset,
    lastUpdated,
    nextPage, prevPage, refetch,
  } = useUsageLogs(orgId, limit, autoRefresh ? 15000 : 0);

  // Quick stats from current page
  const totalCost    = data.reduce((s, r) => s + Number(r.total_cost), 0);
  const totalTokens  = data.reduce((s, r) => s + Number(r.total_tokens), 0);
  const cacheHits    = data.filter((r) => r.cache_hit).length;
  const errorCount   = data.filter((r) => r.request_status === 'error').length;
  const cacheHitRate = data.length > 0
    ? Math.round((cacheHits / data.length) * 100) : 0;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Usage Logs</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {lastUpdated
              ? `Last updated ${lastUpdated.toLocaleTimeString()}`
              : 'Loading…'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
              'font-medium border transition-all',
              autoRefresh
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-white text-gray-500 border-gray-200'
            )}
          >
            <span className={clsx(
              'w-2 h-2 rounded-full',
              autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
            )} />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>

          {/* Manual refresh */}
          <button
            onClick={refetch}
            disabled={loading}
            className="btn-secondary flex items-center gap-2 text-xs"
          >
            <svg
              className={clsx('w-3.5 h-3.5', loading && 'animate-spin')}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11
                   11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Quick stats ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          {
            label:   'Total Cost',
            value:   formatCost(totalCost),
            color:   'text-brand-600',
            bg:      'bg-brand-50',
          },
          {
            label:   'Requests',
            value:   data.length.toString(),
            color:   'text-gray-900',
            bg:      'bg-gray-50',
          },
          {
            label:   'Total Tokens',
            value:   formatTokens(totalTokens),
            color:   'text-purple-600',
            bg:      'bg-purple-50',
          },
          {
            label:   'Cache Hit Rate',
            value:   `${cacheHitRate}%`,
            color:   'text-green-600',
            bg:      'bg-green-50',
          },
          {
            label:   'Errors',
            value:   errorCount.toString(),
            color:   errorCount > 0 ? 'text-red-600' : 'text-gray-400',
            bg:      errorCount > 0 ? 'bg-red-50'    : 'bg-gray-50',
          },
        ].map((stat) => (
          <div key={stat.label}
            className={clsx('rounded-xl px-4 py-3 border border-transparent', stat.bg)}>
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className={clsx('text-lg font-bold', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Logs table ───────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {[
                  'Time', 'Status', 'Feature',
                  'Provider / Model', 'Tokens',
                  'Cost', 'Latency', 'Customer', ''
                ].map((h) => (
                  <th key={h}
                    className="text-left text-xs font-semibold text-gray-500
                               uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && data.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={9}
                    className="px-4 py-16 text-center text-gray-400">
                    <svg className="w-8 h-8 mx-auto mb-3 opacity-30"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0
                           002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0
                           002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm">No requests logged yet</p>
                    <p className="text-xs mt-1">
                      Make a proxy call to see logs here
                    </p>
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <>
                    <tr
                      key={row.id}
                      onClick={() =>
                        setExpandedId(expandedId === row.id ? null : row.id)
                      }
                      className={clsx(
                        'hover:bg-gray-50 transition-colors cursor-pointer',
                        expandedId === row.id && 'bg-blue-50/30'
                      )}
                    >
                      {/* Time */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs text-gray-700 font-medium">
                          {new Date(row.created_at).toLocaleTimeString('en-US', {
                            hour:   '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(row.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day:   'numeric',
                          })}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={clsx(
                            'w-6 h-6 rounded-full flex items-center justify-center',
                            'text-xs font-bold shrink-0',
                            row.request_status === 'success'
                              ? 'bg-green-100 text-green-700'  :
                            row.request_status === 'error'
                              ? 'bg-red-100 text-red-700'      :
                            row.request_status === 'blocked'
                              ? 'bg-orange-100 text-orange-700':
                              'bg-blue-100 text-blue-700'
                          )}>
                            {STATUS_ICON[row.request_status]}
                          </span>
                          <div>
                            <p className="text-xs font-medium text-gray-700 capitalize">
                              {row.request_status}
                            </p>
                            {row.cache_hit && (
                              <p className="text-xs text-blue-500">cached</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Feature */}
                      <td className="px-4 py-3">
                        <Badge label={row.feature} variant="info" />
                      </td>

                      {/* Provider / Model */}
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-gray-900">
                          {PROVIDER_LABELS[row.provider] ?? row.provider}
                        </p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5
                                      max-w-32 truncate" title={row.model}>
                          {row.model}
                        </p>
                      </td>

                      {/* Tokens */}
                      <td className="px-4 py-3">
                        {row.cache_hit ? (
                          <div>
                            <p className="text-xs text-blue-600 font-medium">
                              Saved {formatTokens(Number(row.saved_tokens))}
                            </p>
                            <p className="text-xs text-gray-400">cache hit</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-medium text-gray-900">
                              {formatTokens(Number(row.total_tokens))} total
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatTokens(Number(row.prompt_tokens))}↑{' '}
                              {formatTokens(Number(row.completion_tokens))}↓
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Cost */}
                      <td className="px-4 py-3">
                        {row.cache_hit ? (
                          <div>
                            <p className="text-xs font-semibold text-green-600">
                              Free
                            </p>
                            <p className="text-xs text-gray-400">
                              saved {formatCost(Number(row.saved_cost))}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs font-semibold text-gray-900">
                            {formatCost(Number(row.total_cost))}
                          </p>
                        )}
                      </td>

                      {/* Latency */}
                      <td className="px-4 py-3">
                        <span className={clsx(
                          'text-xs font-medium',
                          row.cache_hit
                            ? 'text-blue-500'
                            : Number(row.latency_ms) > 3000
                            ? 'text-amber-600'
                            : 'text-gray-600'
                        )}>
                          {row.cache_hit ? 'instant' : formatLatency(row.latency_ms)}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400 font-mono">
                          {row.customer_id ?? '—'}
                        </span>
                      </td>

                      {/* Expand chevron */}
                      <td className="px-4 py-3">
                        <svg
                          className={clsx(
                            'w-4 h-4 text-gray-300 transition-transform',
                            expandedId === row.id && 'rotate-180 text-brand-400'
                          )}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round"
                            strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expandedId === row.id && (
                      <tr key={`${row.id}-expanded`}
                        className="bg-blue-50/20 border-b border-blue-100">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-gray-400 mb-1 font-medium">
                                Request ID
                              </p>
                              <p className="text-xs font-mono text-gray-600 break-all">
                                {row.id}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 mb-1 font-medium">
                                HTTP Status
                              </p>
                              <span className={clsx(
                                'text-xs font-semibold px-2 py-0.5 rounded',
                                Number(row.http_status) < 300
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              )}>
                                {row.http_status ?? '—'}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 mb-1 font-medium">
                                Input Cost
                              </p>
                              <p className="text-xs text-gray-700 font-mono">
                                {formatCost(Number(row.input_cost))}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 mb-1 font-medium">
                                Output Cost
                              </p>
                              <p className="text-xs text-gray-700 font-mono">
                                {formatCost(Number(row.output_cost))}
                              </p>
                            </div>
                            {row.cache_hit && (
                              <>
                                <div>
                                  <p className="text-xs text-gray-400 mb-1 font-medium">
                                    Cost Saved
                                  </p>
                                  <p className="text-xs text-green-600 font-semibold">
                                    {formatCost(Number(row.saved_cost))}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-400 mb-1 font-medium">
                                    Tokens Saved
                                  </p>
                                  <p className="text-xs text-green-600 font-semibold">
                                    {formatTokens(Number(row.saved_tokens))}
                                  </p>
                                </div>
                              </>
                            )}
                            {row.error_message && (
                              <div className="col-span-4">
                                <p className="text-xs text-gray-400 mb-1 font-medium">
                                  Error
                                </p>
                                <p className="text-xs text-red-600 font-mono
                                              bg-red-50 px-3 py-2 rounded-lg">
                                  {row.error_message}
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3
                        border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={prevPage}
            disabled={offset === 0 || loading}
            className="btn-secondary text-xs disabled:opacity-40
                       flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              Showing {offset + 1}–{offset + data.length}
            </span>
            {loading && (
              <svg className="w-3.5 h-3.5 animate-spin text-brand-500"
                fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </div>

          <button
            onClick={nextPage}
            disabled={data.length < limit || loading}
            className="btn-secondary text-xs disabled:opacity-40
                       flex items-center gap-1.5"
          >
            Next
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
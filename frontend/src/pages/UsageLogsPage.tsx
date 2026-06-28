import { useState }       from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUsageLogs }   from '@/hooks/useAnalytics';
import Table              from '@/components/ui/Table';
import Badge              from '@/components/ui/Badge';
import { UsageLog, RequestStatus } from '@/types';
import {
  formatCost, formatTokens,
  formatLatency, formatDateTime,
} from '@/utils/formatters';
import { PROVIDER_LABELS } from '@/utils/constants';
import clsx                from 'clsx';

const STATUS_VARIANT: Record<RequestStatus, 'success' | 'error' | 'warning' | 'info'> = {
  success: 'success',
  error:   'error',
  blocked: 'warning',
  cached:  'info',
};

export default function UsageLogsPage() {
  const [limit] = useState(50);
  const { user }   = useAuth();
  const orgId      = user?.organization_id ?? '';
  const { data, loading, offset, nextPage, prevPage, refetch } =
  useUsageLogs(orgId, limit);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const columns = [
    {
      key:    'created_at',
      header: 'Time',
      render: (row: UsageLog) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {formatDateTime(row.created_at)}
        </span>
      ),
    },
    {
      key:    'feature',
      header: 'Feature',
      render: (row: UsageLog) => (
        <Badge label={row.feature} variant="info" />
      ),
    },
    {
      key:    'provider',
      header: 'Provider / Model',
      render: (row: UsageLog) => (
        <div>
          <p className="text-xs font-medium text-gray-900">
            {PROVIDER_LABELS[row.provider] ?? row.provider}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{row.model}</p>
        </div>
      ),
    },
    {
      key:    'tokens',
      header: 'Tokens',
      render: (row: UsageLog) => (
        <div className="text-xs">
          <p className="text-gray-900 font-medium">
            {formatTokens(row.total_tokens)}
          </p>
          <p className="text-gray-400">
            {formatTokens(row.prompt_tokens)} in ·{' '}
            {formatTokens(row.completion_tokens)} out
          </p>
        </div>
      ),
    },
    {
      key:    'cost',
      header: 'Cost',
      render: (row: UsageLog) => (
        <span className={clsx(
          'text-xs font-medium',
          row.cache_hit ? 'text-green-600' : 'text-gray-900'
        )}>
          {row.cache_hit ? 'Free' : formatCost(Number(row.total_cost))}
        </span>
      ),
    },
    {
      key:    'latency',
      header: 'Latency',
      render: (row: UsageLog) => (
        <span className="text-xs text-gray-500">
          {row.cache_hit ? '—' : formatLatency(row.latency_ms)}
        </span>
      ),
    },
    {
      key:    'status',
      header: 'Status',
      render: (row: UsageLog) => (
        <div className="flex items-center gap-1.5">
          <Badge
            label={row.request_status}
            variant={STATUS_VARIANT[row.request_status]}
            dot
          />
          {row.cache_hit && (
            <Badge label="cached" variant="info" />
          )}
        </div>
      ),
    },
    {
      key:    'customer',
      header: 'Customer',
      render: (row: UsageLog) => (
        <span className="text-xs text-gray-400 font-mono">
          {row.customer_id ?? '—'}
        </span>
      ),
    },
    {
      key:    'expand',
      header: '',
      render: (row: UsageLog) => (
        <button
          onClick={() =>
            setExpandedId(expandedId === row.id ? null : row.id)
          }
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            className={clsx(
              'w-4 h-4 transition-transform',
              expandedId === row.id && 'rotate-180'
            )}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ),
    },
  ];

  // Stats bar
  const totalCost    = data.reduce((s, r) => s + Number(r.total_cost), 0);
  const cacheHits    = data.filter((r) => r.cache_hit).length;
  const errorCount   = data.filter((r) => r.request_status === 'error').length;
  const cacheHitRate = data.length > 0 ? Math.round((cacheHits / data.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Usage Logs</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Showing {offset + 1}–{offset + data.length} requests
          </p>
        </div>
        <button
          onClick={refetch}
          className="btn-secondary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0
                 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357
                 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Quick stats */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Cost',    value: formatCost(totalCost) },
            { label: 'Requests',      value: data.length.toString() },
            { label: 'Cache Hit Rate',value: `${cacheHitRate}%` },
            { label: 'Errors',        value: errorCount.toString() },
          ].map((stat) => (
            <div key={stat.label} className="card px-4 py-3">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-lg font-semibold text-gray-900 mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <Table
          columns={columns}
          data={data}
          loading={loading}
          rowKey={(row) => row.id}
          empty="No requests logged yet."
        />

        {/* Expanded row detail */}
        {expandedId && (() => {
          const row = data.find((r) => r.id === expandedId);
          if (!row) return null;
          return (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="text-gray-400 mb-1">Request ID</p>
                  <p className="font-mono text-gray-700 break-all">{row.id}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">HTTP Status</p>
                  <p className="text-gray-700">{row.http_status ?? '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Input Cost</p>
                  <p className="text-gray-700">{formatCost(Number(row.input_cost))}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Output Cost</p>
                  <p className="text-gray-700">{formatCost(Number(row.output_cost))}</p>
                </div>
                {row.error_message && (
                  <div className="col-span-4">
                    <p className="text-gray-400 mb-1">Error</p>
                    <p className="text-red-600 font-mono">{row.error_message}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <button
            onClick={prevPage}
            disabled={offset === 0 || loading}
            className="btn-secondary text-xs disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-xs text-gray-500">
            Page {Math.floor(offset / limit) + 1}
          </span>
          <button
            onClick={nextPage}
            disabled={data.length < limit || loading}
            className="btn-secondary text-xs disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
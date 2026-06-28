import { useState, useEffect }     from 'react';
import { CURRENT_ORG_ID }          from '@/App';
import { useOrganization }         from '@/hooks/useOrganization';
import {
  useSummary,
  useDailySpend,
  useFeatureBreakdown,
  useModelBreakdown,
} from '@/hooks/useAnalytics';
import { analyticsApi }            from '@/services/api';
import StatCard                    from '@/components/ui/StatCard';
import SpendChart                  from '@/components/charts/SpendChart';
import FeatureBreakdownChart       from '@/components/charts/FeatureBreakdown';
import ModelBreakdownChart         from '@/components/charts/ModelBreakdown';
import Badge                       from '@/components/ui/Badge';
import clsx                        from 'clsx';
import {
  formatCost,
  formatTokens,
  formatNumber,
  budgetPercent,
} from '@/utils/formatters';
import {
  FEATURE_COLORS,
  PROVIDER_COLORS,
} from '@/utils/constants';

const DAY_OPTIONS = [7, 14, 30, 90];

interface Savings {
  saved_cost:      number;
  saved_tokens:    number;
  cache_hit_count: number;
}

export default function DashboardPage() {
  const [days, setDays] = useState(30);
  const [savings, setSavings] = useState<Savings | null>(null);
  const [savingsLoading, setSavingsLoading] = useState(true);

  const { org } = useOrganization(CURRENT_ORG_ID);

  const { data: summary,  loading: summaryLoading  } = useSummary(CURRENT_ORG_ID);
  const { data: daily,    loading: dailyLoading    } = useDailySpend(CURRENT_ORG_ID, days);
  const { data: features, loading: featuresLoading } = useFeatureBreakdown(CURRENT_ORG_ID, days);
  const { data: models,   loading: modelsLoading   } = useModelBreakdown(CURRENT_ORG_ID, days);

  // Fetch savings whenever days changes
  useEffect(() => {
    if (!CURRENT_ORG_ID) return;
    setSavingsLoading(true);
    analyticsApi
      .savings(CURRENT_ORG_ID, days)
      .then((data:Savings) => setSavings(data))
      .catch(() => setSavings(null))
      .finally(() => setSavingsLoading(false));
  }, [days]);

  const current  = summary?.current_month;
  const spent    = Number(current?.total_cost    ?? 0);
  const budget   = Number(org?.monthly_budget    ?? 0);
  const pct      = budgetPercent(spent, budget);
  const requests = current?.request_count        ?? 0;
  const tokens   = current?.total_tokens         ?? 0;

  const budgetStatus =
    pct >= 100 ? 'error'   :
    pct >= 80  ? 'warning' : 'success';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Page header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Overview</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {org?.name ?? '—'} · This month
          </p>
        </div>

        {/* Day range selector */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                days === d
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {/* Total Spend */}
        <StatCard
          title="Total Spend"
          value={formatCost(spent)}
          subtitle={budget > 0 ? `of ${formatCost(budget)} budget` : 'No budget set'}
          accent="blue"
          loading={summaryLoading}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343
                   2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1
                   m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        {/* Total Requests */}
        <StatCard
          title="Total Requests"
          value={formatNumber(requests)}
          subtitle={`last ${days} days`}
          accent="green"
          loading={summaryLoading}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0
                   011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          }
        />

        {/* Tokens Used */}
        <StatCard
          title="Tokens Used"
          value={formatTokens(tokens)}
          subtitle="prompt + completion"
          accent="purple"
          loading={summaryLoading}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0
                   0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          }
        />

        {/* Budget Used */}
        <StatCard
          title="Budget Used"
          value={budget > 0 ? `${Math.round(pct)}%` : '—'}
          subtitle={
            budget > 0
              ? `${formatCost(Math.max(budget - spent, 0))} remaining`
              : 'No limit set'
          }
          accent={
            budgetStatus === 'error'   ? 'red'   :
            budgetStatus === 'warning' ? 'amber' : 'green'
          }
          loading={summaryLoading}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2
                   2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0
                   002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2
                   2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />

        {/* Cache Savings */}
        <StatCard
          title="Cache Savings"
          value={formatCost(Number(savings?.saved_cost ?? 0))}
          subtitle={`${savings?.cache_hit_count ?? 0} cache hits · ${formatTokens(savings?.saved_tokens ?? 0)} tokens saved`}
          accent="green"
          loading={savingsLoading}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* ── Budget progress bar ────────────────────────────────── */}
      {budget > 0 && !summaryLoading && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Budget Progress</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatCost(spent)} spent of {formatCost(budget)} monthly limit
              </p>
            </div>
            <Badge
              label={
                pct >= 100 ? 'Exhausted'  :
                pct >= 80  ? 'Near Limit' : 'On Track'
              }
              variant={budgetStatus}
              dot
            />
          </div>

          {/* Progress bar */}
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-700',
                pct >= 100 ? 'bg-red-500'   :
                pct >= 80  ? 'bg-amber-400' : 'bg-brand-500'
              )}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>

          {/* Threshold markers */}
          <div className="relative mt-1.5">
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">$0</span>
              <span className="text-xs text-gray-400">{formatCost(budget)}</span>
            </div>
            {/* 80% marker */}
            <div
              className="absolute top-0 flex flex-col items-center"
              style={{ left: '80%', transform: 'translateX(-50%)' }}
            >
              <span className="text-xs text-amber-500 font-medium">80%</span>
            </div>
          </div>

          {/* Alert info */}
          <div className="flex gap-3 mt-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-gray-500">Alert at 80%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs text-gray-500">Blocked at 100%</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Spend over time ────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="section-title">Spend Over Time</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Daily cost for the last {days} days
            </p>
          </div>
          {!dailyLoading && daily.length > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Total in period</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatCost(daily.reduce((s, d) => s + Number(d.total_cost), 0))}
              </p>
            </div>
          )}
        </div>
        <SpendChart data={daily} loading={dailyLoading} />
      </div>

      {/* ── Feature + Model breakdown ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Feature breakdown */}
        <div className="card p-5">
          <div className="mb-4">
            <p className="section-title">Spend by Feature</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Which features are driving costs
            </p>
          </div>

          <FeatureBreakdownChart data={features} loading={featuresLoading} />

          {!featuresLoading && features.length > 0 && (
            <div className="mt-4 space-y-2.5">
              {features.slice(0, 5).map((f, i) => (
                <div key={f.feature} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: FEATURE_COLORS[i % FEATURE_COLORS.length] }}
                    />
                    <span className="text-xs text-gray-600 capitalize truncate">
                      {f.feature}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-xs text-gray-400">
                      {formatNumber(f.request_count)} reqs
                    </span>
                    <span className="text-xs font-semibold text-gray-900 w-16 text-right">
                      {formatCost(Number(f.total_cost))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Model breakdown */}
        <div className="card p-5">
          <div className="mb-4">
            <p className="section-title">Spend by Model</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Cost across providers and models
            </p>
          </div>

          <ModelBreakdownChart data={models} loading={modelsLoading} />

          {!modelsLoading && models.length > 0 && (
            <div className="mt-4 space-y-2.5">
              {models.slice(0, 5).map((m) => (
                <div key={`${m.provider}-${m.model}`}
                  className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: PROVIDER_COLORS[m.provider] ?? '#4f6ef7',
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-600 truncate">{m.model}</p>
                      <p className="text-xs text-gray-400 capitalize">{m.provider}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-xs text-gray-400">
                      {formatNumber(m.request_count)} reqs
                    </span>
                    <span className="text-xs font-semibold text-gray-900 w-16 text-right">
                      {formatCost(Number(m.total_cost))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Cache savings breakdown ────────────────────────────── */}
      {!savingsLoading && savings && savings.cache_hit_count > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="section-title">Cache Savings Breakdown</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Money and tokens saved by serving cached responses
              </p>
            </div>
            <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700 font-medium">
                🎉 {formatCost(Number(savings.saved_cost))} saved
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-xs text-green-600 mb-1">Cost Avoided</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCost(Number(savings.saved_cost))}
              </p>
              <p className="text-xs text-green-500 mt-1">
                vs paying full price
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs text-blue-600 mb-1">Tokens Saved</p>
              <p className="text-2xl font-bold text-blue-700">
                {formatTokens(savings.saved_tokens)}
              </p>
              <p className="text-xs text-blue-500 mt-1">
                not sent to provider
              </p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <p className="text-xs text-purple-600 mb-1">Cache Hits</p>
              <p className="text-2xl font-bold text-purple-700">
                {formatNumber(savings.cache_hit_count)}
              </p>
              <p className="text-xs text-purple-500 mt-1">
                instant responses
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Monthly history ────────────────────────────────────── */}
      {summary?.history && summary.history.length > 1 && (
        <div className="card p-5">
          <p className="section-title mb-4">Monthly History</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {summary.history.map((h) => {
              const monthLabel = new Date(h.month).toLocaleDateString('en-US', {
                month: 'short',
                year:  '2-digit',
              });
              const isCurrentMonth =
                new Date(h.month).getMonth() === new Date().getMonth() &&
                new Date(h.month).getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={h.month}
                  className={clsx(
                    'rounded-xl p-3 text-center border transition-all',
                    isCurrentMonth
                      ? 'bg-brand-50 border-brand-200 shadow-sm'
                      : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                  )}
                >
                  <p className="text-xs text-gray-500 mb-1">{monthLabel}</p>
                  <p className={clsx(
                    'text-sm font-bold',
                    isCurrentMonth ? 'text-brand-700' : 'text-gray-900'
                  )}>
                    {formatCost(Number(h.total_cost))}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatNumber(h.request_count)} reqs
                  </p>
                  {isCurrentMonth && (
                    <span className="inline-block mt-1.5 text-xs bg-brand-100
                                     text-brand-600 px-1.5 py-0.5 rounded-full font-medium">
                      current
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
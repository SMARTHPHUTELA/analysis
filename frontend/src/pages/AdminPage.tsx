// import { useState }          from 'react';
// import { useOrganizations }  from '@/hooks/useOrganization';
// import { analyticsApi }      from '@/services/api';
// import { Organization }      from '@/types';
// import { formatCost, formatNumber, budgetPercent } from '@/utils/formatters';
// import Badge                 from '@/components/ui/Badge';
// import Table                 from '@/components/ui/Table';
// import clsx                  from 'clsx';

// interface OrgWithSpend extends Organization {
//   spent:        number;
//   request_count: number;
//   loading:      boolean;
// }

// function BudgetBar({ spent, budget }: { spent: number; budget: number }) {
//   const pct = budgetPercent(spent, budget);
//   return (
//     <div className="w-32">
//       <div className="flex justify-between text-xs text-gray-500 mb-1">
//         <span>{formatCost(spent)}</span>
//         <span>{Math.round(pct)}%</span>
//       </div>
//       <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
//         <div
//           className={clsx(
//             'h-full rounded-full',
//             pct >= 100 ? 'bg-red-500'   :
//             pct >= 80  ? 'bg-amber-400' : 'bg-brand-500'
//           )}
//           style={{ width: `${Math.min(pct, 100)}%` }}
//         />
//       </div>
//     </div>
//   );
// }

// export default function AdminPage() {
//   const { orgs, loading } = useOrganizations();
//   const [orgsWithSpend, setOrgsWithSpend] = useState<Record<string, {
//     spent: number; request_count: number;
//   }>>({});

//   // Fetch current month spend for each org
//   useState(() => {
//     orgs.forEach(async (org) => {
//       try {
//         const summary = await analyticsApi.summary(org.id);
//         setOrgsWithSpend((prev) => ({
//           ...prev,
//           [org.id]: {
//             spent:         Number(summary.current_month?.total_cost   ?? 0),
//             request_count: Number(summary.current_month?.request_count ?? 0),
//           },
//         }));
//       } catch {
//         // ignore per-org fetch errors
//       }
//     });
//   });

//   // Totals across all orgs
//   const totalSpend    = Object.values(orgsWithSpend).reduce((s, o) => s + o.spent, 0);
//   const totalRequests = Object.values(orgsWithSpend).reduce((s, o) => s + o.request_count, 0);
//   const activeOrgs    = orgs.filter((o) => o.status === 'active').length;

//   const columns = [
//     {
//       key:    'name',
//       header: 'Organization',
//       render: (row: Organization) => (
//         <div>
//           <p className="font-medium text-gray-900">{row.name}</p>
//           <p className="text-xs text-gray-400 font-mono mt-0.5">{row.slug}</p>
//         </div>
//       ),
//     },
//     {
//       key:    'status',
//       header: 'Status',
//       render: (row: Organization) => (
//         <Badge
//           label={row.status}
//           variant={
//             row.status === 'active'    ? 'success' :
//             row.status === 'suspended' ? 'warning' : 'error'
//           }
//           dot
//         />
//       ),
//     },
//     {
//       key:    'spend',
//       header: 'This Month',
//       render: (row: Organization) => {
//         const data = orgsWithSpend[row.id];
//         if (!data) return <span className="text-xs text-gray-400">Loading…</span>;
//         return (
//           <div>
//             <p className="text-sm font-medium text-gray-900">
//               {formatCost(data.spent)}
//             </p>
//             <p className="text-xs text-gray-400">
//               {formatNumber(data.request_count)} requests
//             </p>
//           </div>
//         );
//       },
//     },
//     {
//       key:    'budget',
//       header: 'Budget',
//       render: (row: Organization) => {
//         const budget = Number(row.monthly_budget);
//         const spent  = orgsWithSpend[row.id]?.spent ?? 0;
//         if (!budget) {
//           return <span className="text-xs text-gray-400">No limit</span>;
//         }
//         return (
//           <div className="space-y-1">
//             <BudgetBar spent={spent} budget={budget} />
//             <p className="text-xs text-gray-400">of {formatCost(budget)}</p>
//           </div>
//         );
//       },
//     },
//     {
//       key:    'alert_email',
//       header: 'Alert Email',
//       render: (row: Organization) => (
//         <span className="text-xs text-gray-500">
//           {row.alert_email ?? '—'}
//         </span>
//       ),
//     },
//     {
//       key:    'created_at',
//       header: 'Created',
//       render: (row: Organization) => (
//         <span className="text-xs text-gray-500">
//           {new Date(row.created_at).toLocaleDateString('en-US', {
//             month: 'short', day: 'numeric', year: 'numeric',
//           })}
//         </span>
//       ),
//     },
//   ];

//   return (
//     <div className="space-y-6 max-w-7xl mx-auto">
//       {/* Header */}
//       <div>
//         <h2 className="page-title">Admin — All Organizations</h2>
//         <p className="text-sm text-gray-500 mt-0.5">
//           Platform-wide view across all teams
//         </p>
//       </div>

//       {/* Platform totals */}
//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//         {[
//           {
//             label:   'Total Platform Spend',
//             value:   formatCost(totalSpend),
//             accent:  'bg-blue-50 text-blue-700',
//           },
//           {
//             label:   'Total Requests',
//             value:   formatNumber(totalRequests),
//             accent:  'bg-green-50 text-green-700',
//           },
//           {
//             label:   'Active Organizations',
//             value:   activeOrgs.toString(),
//             accent:  'bg-purple-50 text-purple-700',
//           },
//         ].map((stat) => (
//           <div key={stat.label} className="card p-5">
//             <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
//             <p className={clsx(
//               'text-2xl font-bold px-2 py-0.5 rounded-lg inline-block',
//               stat.accent
//             )}>
//               {stat.value}
//             </p>
//           </div>
//         ))}
//       </div>

//       {/* Orgs table */}
//       <div className="card">
//         <div className="px-5 py-4 border-b border-gray-100 flex items-center
//                         justify-between">
//           <p className="section-title">Organizations</p>
//           <Badge
//             label={`${orgs.length} total`}
//             variant="gray"
//           />
//         </div>
//         <Table
//           columns={columns}
//           data={orgs}
//           loading={loading}
//           rowKey={(row) => row.id}
//           empty="No organizations found."
//         />
//       </div>
//     </div>
//   );
// }

import { useState, useEffect }  from 'react';
import { orgApi, analyticsApi } from '@/services/api';
import { Organization }         from '@/types';
import { formatCost, formatNumber, budgetPercent } from '@/utils/formatters';
import Badge                    from '@/components/ui/Badge';
import clsx                     from 'clsx';

interface OrgSummary {
  org:           Organization;
  spent:         number;
  requestCount:  number;
  totalTokens:   number;
  loading:       boolean;
}

function BudgetBar({ spent, budget }: { spent: number; budget: number }) {
  const pct = budgetPercent(spent, budget);
  return (
    <div className="w-36">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 font-medium">{formatCost(spent)}</span>
        <span className={clsx(
          'font-semibold',
          pct >= 100 ? 'text-red-600'   :
          pct >= 80  ? 'text-amber-600' : 'text-gray-500'
        )}>
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500',
            pct >= 100 ? 'bg-red-500'   :
            pct >= 80  ? 'bg-amber-400' : 'bg-brand-500'
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-0.5">
        of {formatCost(Number(budget))} limit
      </p>
    </div>
  );
}

export default function AdminPage() {
  const [orgSummaries,  setOrgSummaries]  = useState<OrgSummary[]>([]);
  const [pageLoading,   setPageLoading]   = useState(true);
  const [lastUpdated,   setLastUpdated]   = useState<Date | null>(null);

  const loadData = async () => {
    try {
      // 1. Fetch all orgs
      const orgs = await orgApi.list();

      // 2. Set orgs immediately with loading state per org
      setOrgSummaries(
        orgs.map((org) => ({
          org,
          spent:        0,
          requestCount: 0,
          totalTokens:  0,
          loading:      true,
        }))
      );
      setPageLoading(false);

      // 3. Fetch each org's current month summary in parallel
      const summaryPromises = orgs.map(async (org) => {
        try {
          const summary = await analyticsApi.summary(org.id);
          return {
            org,
            spent:        Number(summary.current_month?.total_cost    ?? 0),
            requestCount: Number(summary.current_month?.request_count ?? 0),
            totalTokens:  Number(summary.current_month?.total_tokens  ?? 0),
            loading:      false,
          };
        } catch {
          return {
            org,
            spent:        0,
            requestCount: 0,
            totalTokens:  0,
            loading:      false,
          };
        }
      });

      // 4. Update as each one resolves
      summaryPromises.forEach((promise) => {
        promise.then((result) => {
          setOrgSummaries((prev) =>
            prev.map((s) =>
              s.org.id === result.org.id ? result : s
            )
          );
        });
      });

      // 5. Wait for all to finish then set last updated
      await Promise.allSettled(summaryPromises);
      setLastUpdated(new Date());

    } catch (err) {
      console.error('Failed to load admin data:', err);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Platform totals (computed from org summaries) ──────────
  const totalSpend    = orgSummaries.reduce((s, o) => s + o.spent, 0);
  const totalRequests = orgSummaries.reduce((s, o) => s + o.requestCount, 0);
  const totalTokens   = orgSummaries.reduce((s, o) => s + o.totalTokens, 0);
  const activeOrgs    = orgSummaries.filter(
    (o) => o.org.status === 'active'
  ).length;
  const stillLoading  = orgSummaries.some((o) => o.loading);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Admin — All Organizations</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {lastUpdated
              ? `Last updated ${lastUpdated.toLocaleTimeString()}`
              : stillLoading
              ? 'Loading organization data…'
              : 'Platform-wide view'}
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={pageLoading || stillLoading}
          className="btn-secondary flex items-center gap-2 text-xs"
        >
          <svg
            className={clsx(
              'w-3.5 h-3.5',
              (pageLoading || stillLoading) && 'animate-spin'
            )}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11
                 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Platform totals ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label:  'Total Platform Spend',
            value:  formatCost(totalSpend),
            sub:    'this month',
            bg:     'bg-brand-50',
            color:  'text-brand-700',
            icon: (
              <svg className="w-5 h-5 text-brand-500" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3
                     2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0
                     1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0
                     11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            label:  'Total Requests',
            value:  formatNumber(totalRequests),
            sub:    'this month',
            bg:     'bg-green-50',
            color:  'text-green-700',
            icon: (
              <svg className="w-5 h-5 text-green-500" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0
                     011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            ),
          },
          {
            label:  'Total Tokens',
            value:  formatNumber(totalTokens),
            sub:    'prompt + completion',
            bg:     'bg-purple-50',
            color:  'text-purple-700',
            icon: (
              <svg className="w-5 h-5 text-purple-500" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9
                     3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0
                     0h18" />
              </svg>
            ),
          },
          {
            label:  'Active Organizations',
            value:  activeOrgs.toString(),
            sub:    `${orgSummaries.length} total`,
            bg:     'bg-amber-50',
            color:  'text-amber-700',
            icon: (
              <svg className="w-5 h-5 text-amber-500" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2
                     0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2
                     10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            ),
          },
        ].map((stat) => (
          <div key={stat.label}
            className={clsx('card p-5', stat.bg, 'border-0')}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-gray-600">{stat.label}</p>
              {stat.icon}
            </div>
            {stillLoading && totalSpend === 0 ? (
              <div className="animate-pulse">
                <div className="h-7 bg-white/60 rounded w-24 mb-1" />
                <div className="h-3 bg-white/40 rounded w-16" />
              </div>
            ) : (
              <>
                <p className={clsx('text-2xl font-bold', stat.color)}>
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.sub}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── Organizations table ──────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center
                        justify-between">
          <div>
            <p className="section-title">Organizations</p>
            <p className="text-xs text-gray-500 mt-0.5">
              All teams and their current month usage
            </p>
          </div>
          <Badge
            label={`${orgSummaries.length} org${orgSummaries.length !== 1 ? 's' : ''}`}
            variant="gray"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {[
                  'Organization', 'Status', 'This Month',
                  'Budget', 'Tokens', 'Created',
                ].map((h) => (
                  <th key={h}
                    className="text-left text-xs font-semibold text-gray-500
                               uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pageLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orgSummaries.length === 0 ? (
                <tr>
                  <td colSpan={6}
                    className="px-5 py-12 text-center text-gray-400 text-sm">
                    No organizations found
                  </td>
                </tr>
              ) : (
                orgSummaries.map(({ org, spent, requestCount,
                  totalTokens: orgTokens, loading }) => (
                  <tr key={org.id}
                    className="hover:bg-gray-50/50 transition-colors">

                    {/* Organization */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 text-sm">
                        {org.name}
                      </p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        {org.slug}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <Badge
                        label={org.status}
                        variant={
                          org.status === 'active'    ? 'success' :
                          org.status === 'suspended' ? 'warning' : 'error'
                        }
                        dot
                      />
                    </td>

                    {/* This Month */}
                    <td className="px-5 py-4">
                      {loading ? (
                        <div className="animate-pulse space-y-1">
                          <div className="h-4 bg-gray-100 rounded w-20" />
                          <div className="h-3 bg-gray-100 rounded w-16" />
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCost(spent)}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatNumber(requestCount)} requests
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Budget */}
                    <td className="px-5 py-4">
                      {loading ? (
                        <div className="animate-pulse">
                          <div className="h-8 bg-gray-100 rounded w-36" />
                        </div>
                      ) : Number(org.monthly_budget) > 0 ? (
                        <BudgetBar
                          spent={spent}
                          budget={Number(org.monthly_budget)}
                        />
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          No limit set
                        </span>
                      )}
                    </td>

                    {/* Tokens */}
                    <td className="px-5 py-4">
                      {loading ? (
                        <div className="h-4 bg-gray-100 rounded w-16
                                        animate-pulse" />
                      ) : (
                        <span className="text-sm text-gray-700">
                          {formatNumber(orgTokens)}
                        </span>
                      )}
                    </td>

                    {/* Created */}
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-500">
                        {new Date(org.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day:   'numeric',
                          year:  'numeric',
                        })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
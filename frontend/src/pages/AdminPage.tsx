import { useState }          from 'react';
import { useOrganizations }  from '@/hooks/useOrganization';
import { analyticsApi }      from '@/services/api';
import { Organization }      from '@/types';
import { formatCost, formatNumber, budgetPercent } from '@/utils/formatters';
import Badge                 from '@/components/ui/Badge';
import Table                 from '@/components/ui/Table';
import clsx                  from 'clsx';

interface OrgWithSpend extends Organization {
  spent:        number;
  request_count: number;
  loading:      boolean;
}

function BudgetBar({ spent, budget }: { spent: number; budget: number }) {
  const pct = budgetPercent(spent, budget);
  return (
    <div className="w-32">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{formatCost(spent)}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full',
            pct >= 100 ? 'bg-red-500'   :
            pct >= 80  ? 'bg-amber-400' : 'bg-brand-500'
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { orgs, loading } = useOrganizations();
  const [orgsWithSpend, setOrgsWithSpend] = useState<Record<string, {
    spent: number; request_count: number;
  }>>({});

  // Fetch current month spend for each org
  useState(() => {
    orgs.forEach(async (org) => {
      try {
        const summary = await analyticsApi.summary(org.id);
        setOrgsWithSpend((prev) => ({
          ...prev,
          [org.id]: {
            spent:         Number(summary.current_month?.total_cost   ?? 0),
            request_count: Number(summary.current_month?.request_count ?? 0),
          },
        }));
      } catch {
        // ignore per-org fetch errors
      }
    });
  });

  // Totals across all orgs
  const totalSpend    = Object.values(orgsWithSpend).reduce((s, o) => s + o.spent, 0);
  const totalRequests = Object.values(orgsWithSpend).reduce((s, o) => s + o.request_count, 0);
  const activeOrgs    = orgs.filter((o) => o.status === 'active').length;

  const columns = [
    {
      key:    'name',
      header: 'Organization',
      render: (row: Organization) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{row.slug}</p>
        </div>
      ),
    },
    {
      key:    'status',
      header: 'Status',
      render: (row: Organization) => (
        <Badge
          label={row.status}
          variant={
            row.status === 'active'    ? 'success' :
            row.status === 'suspended' ? 'warning' : 'error'
          }
          dot
        />
      ),
    },
    {
      key:    'spend',
      header: 'This Month',
      render: (row: Organization) => {
        const data = orgsWithSpend[row.id];
        if (!data) return <span className="text-xs text-gray-400">Loading…</span>;
        return (
          <div>
            <p className="text-sm font-medium text-gray-900">
              {formatCost(data.spent)}
            </p>
            <p className="text-xs text-gray-400">
              {formatNumber(data.request_count)} requests
            </p>
          </div>
        );
      },
    },
    {
      key:    'budget',
      header: 'Budget',
      render: (row: Organization) => {
        const budget = Number(row.monthly_budget);
        const spent  = orgsWithSpend[row.id]?.spent ?? 0;
        if (!budget) {
          return <span className="text-xs text-gray-400">No limit</span>;
        }
        return (
          <div className="space-y-1">
            <BudgetBar spent={spent} budget={budget} />
            <p className="text-xs text-gray-400">of {formatCost(budget)}</p>
          </div>
        );
      },
    },
    {
      key:    'alert_email',
      header: 'Alert Email',
      render: (row: Organization) => (
        <span className="text-xs text-gray-500">
          {row.alert_email ?? '—'}
        </span>
      ),
    },
    {
      key:    'created_at',
      header: 'Created',
      render: (row: Organization) => (
        <span className="text-xs text-gray-500">
          {new Date(row.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="page-title">Admin — All Organizations</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Platform-wide view across all teams
        </p>
      </div>

      {/* Platform totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label:   'Total Platform Spend',
            value:   formatCost(totalSpend),
            accent:  'bg-blue-50 text-blue-700',
          },
          {
            label:   'Total Requests',
            value:   formatNumber(totalRequests),
            accent:  'bg-green-50 text-green-700',
          },
          {
            label:   'Active Organizations',
            value:   activeOrgs.toString(),
            accent:  'bg-purple-50 text-purple-700',
          },
        ].map((stat) => (
          <div key={stat.label} className="card p-5">
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className={clsx(
              'text-2xl font-bold px-2 py-0.5 rounded-lg inline-block',
              stat.accent
            )}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Orgs table */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center
                        justify-between">
          <p className="section-title">Organizations</p>
          <Badge
            label={`${orgs.length} total`}
            variant="gray"
          />
        </div>
        <Table
          columns={columns}
          data={orgs}
          loading={loading}
          rowKey={(row) => row.id}
          empty="No organizations found."
        />
      </div>
    </div>
  );
}
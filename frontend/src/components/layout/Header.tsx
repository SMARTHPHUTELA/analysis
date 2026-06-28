import { useLocation }            from 'react-router-dom';
import { useOrganization }        from '@/hooks/useOrganization';
import { CURRENT_ORG_ID }         from '@/App';
import { budgetPercent, formatCost } from '@/utils/formatters';
import { useSummary }             from '@/hooks/useAnalytics';
import clsx                       from 'clsx';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/keys':      'API Keys',
  '/logs':      'Usage Logs',
  '/settings':  'Settings',
  '/admin':     'Admin',
};

export default function Header() {
  const location          = useLocation();
  const title             = PAGE_TITLES[location.pathname] ?? 'AI Cost Proxy';
  const { org }           = useOrganization(CURRENT_ORG_ID);
  const { data: summary } = useSummary(CURRENT_ORG_ID);

  const spent  = Number(summary?.current_month?.total_cost ?? 0);
  const budget = Number(org?.monthly_budget ?? 0);
  const pct    = budgetPercent(spent, budget);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center
                        justify-between px-6 shrink-0">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      {budget > 0 && (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-500">Monthly Budget</p>
            <p className="text-sm font-medium text-gray-900">
              {formatCost(spent)}
              <span className="text-gray-400 font-normal">
                {' '}/ {formatCost(budget)}
              </span>
            </p>
          </div>
          <div className="w-28">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{Math.round(pct)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all',
                  pct >= 100 ? 'bg-red-500'   :
                  pct >= 80  ? 'bg-amber-400' : 'bg-brand-500'
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
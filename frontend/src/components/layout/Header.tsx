import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth }                  from '@/context/AuthContext';
import { useSummary }               from '@/hooks/useAnalytics';
import { budgetPercent, formatCost } from '@/utils/formatters';
import clsx from 'clsx';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/keys':      'API Keys',
  '/logs':      'Usage Logs',
  '/settings':  'Settings',
  '/admin':     'Admin',
};

export default function Header() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const title      = PAGE_TITLES[location.pathname] ?? 'AI Cost Proxy';
  const { user, logout } = useAuth();

  const orgId          = user?.organization_id ?? '';
  const { data: summary } = useSummary(orgId);

  // Get org budget from summary context
  const spent  = Number(summary?.current_month?.total_cost  ?? 0);
  const budget = 0; // fetched in Header via org separately if needed
  const pct    = budgetPercent(spent, budget);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center
                        justify-between px-6 shrink-0">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-4">
        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center
                          justify-center text-brand-700 font-semibold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500
                     hover:text-gray-700 transition-colors"
          title="Logout"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor"
            viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0
                 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
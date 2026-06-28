import { NavLink }   from 'react-router-dom';
import { useAuth }   from '@/context/AuthContext';
import clsx          from 'clsx';

const NAV_ITEMS = [
  {
    to:       '/dashboard',
    label:    'Dashboard',
    adminOnly: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z
             M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z
             M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z
             M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    to:       '/keys',
    label:    'API Keys',
    adminOnly: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4
             a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
  },
  {
    to:       '/logs',
    label:    'Usage Logs',
    adminOnly: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
             M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    to:       '/settings',
    label:    'Settings',
    adminOnly: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0
             002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0
             001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0
             00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0
             00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0
             00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0
             00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0
             001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07
             2.572-1.065z
             M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    to:       '/admin',
    label:    'Admin',
    adminOnly: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9
             0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1
             1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { user } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return user?.role === 'admin';
    return true;
  });

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-200">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor"
            viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">AI Cost Proxy</p>
          <p className="text-xs text-gray-500">Control Plane</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm',
                'font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            {item.icon}
            {item.label}

            {/* Admin badge */}
            {item.adminOnly && (
              <span className="ml-auto text-xs bg-purple-100 text-purple-700
                               px-1.5 py-0.5 rounded-full font-medium">
                Admin
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info at bottom */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center
                          justify-center text-brand-700 font-semibold text-xs shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
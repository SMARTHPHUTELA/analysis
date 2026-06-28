import clsx from 'clsx';

interface StatCardProps {
  title:      string;
  value:      string;
  subtitle?:  string;
  trend?:     { value: string; positive: boolean };
  icon?:      React.ReactNode;
  accent?:    'blue' | 'green' | 'amber' | 'red' | 'purple';
  loading?:   boolean;
}

const ACCENT_CLASSES = {
  blue:   'bg-blue-50   text-blue-600',
  green:  'bg-green-50  text-green-600',
  amber:  'bg-amber-50  text-amber-600',
  red:    'bg-red-50    text-red-600',
  purple: 'bg-purple-50 text-purple-600',
};

export default function StatCard({
  title, value, subtitle, trend, icon, accent = 'blue', loading,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="card p-5 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-24 mb-4" />
        <div className="h-8 bg-gray-100 rounded w-32 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-20" />
      </div>
    );
  }

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && (
          <div className={clsx('p-2 rounded-lg', ACCENT_CLASSES[accent])}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <div className="flex items-center gap-2">
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        {trend && (
          <span className={clsx(
            'text-xs font-medium',
            trend.positive ? 'text-green-600' : 'text-red-500'
          )}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
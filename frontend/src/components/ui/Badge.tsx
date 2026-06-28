import clsx from 'clsx';

interface BadgeProps {
  label:    string;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'gray';
  dot?:     boolean;
}

const VARIANTS = {
  success: 'bg-green-100  text-green-700',
  error:   'bg-red-100    text-red-700',
  warning: 'bg-amber-100  text-amber-700',
  info:    'bg-blue-100   text-blue-700',
  gray:    'bg-gray-100   text-gray-600',
};

const DOT_VARIANTS = {
  success: 'bg-green-500',
  error:   'bg-red-500',
  warning: 'bg-amber-500',
  info:    'bg-blue-500',
  gray:    'bg-gray-400',
};

export default function Badge({ label, variant = 'gray', dot }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
      VARIANTS[variant]
    )}>
      {dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full', DOT_VARIANTS[variant])} />
      )}
      {label}
    </span>
  );
}
export function formatCost(value: number | string): string {
  const num = Number(value);
  if (isNaN(num) || num === 0) return '$0.00';
  if (num < 0.01) return `$${num.toFixed(6)}`;
  if (num < 1)    return `$${num.toFixed(4)}`;
  return `$${num.toFixed(2)}`;
}

export function formatTokens(value: number | string): string {
  const num = Number(value);
  if (isNaN(num)) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function formatNumber(value: number | string): string {
  return new Intl.NumberFormat('en-US').format(Number(value));
}

export function formatLatency(ms: number | null): string {
  if (ms === null) return '—';
  if (ms >= 1000)  return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month:  'short',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

export function budgetPercent(spent: number | string, budget: number | string): number {
  const s = Number(spent);
  const b = Number(budget);
  if (!b || b <= 0) return 0;
  return Math.min((s / b) * 100, 100);
}
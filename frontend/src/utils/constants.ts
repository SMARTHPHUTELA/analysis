export const PROVIDER_LABELS: Record<string, string> = {
  openai:       'OpenAI',
  anthropic:    'Anthropic',
  gemini:       'Gemini',
  azure_openai: 'Azure OpenAI',
};

export const PROVIDER_COLORS: Record<string, string> = {
  openai:       '#10a37f',
  anthropic:    '#d97706',
  gemini:       '#4285f4',
  azure_openai: '#0078d4',
};

export const STATUS_COLORS: Record<string, string> = {
  success: 'bg-green-100 text-green-800',
  error:   'bg-red-100 text-red-800',
  blocked: 'bg-orange-100 text-orange-800',
  cached:  'bg-blue-100 text-blue-800',
};

export const FEATURE_COLORS = [
  '#4f6ef7', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#06b6d4',
  '#f97316', '#84cc16',
];

export const DEFAULT_DAYS = 30;
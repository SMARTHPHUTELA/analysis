export type ProviderType = 'openai' | 'anthropic' | 'gemini' | 'azure_openai';
export type RequestStatus = 'success' | 'error' | 'blocked' | 'cached';
export type OrgStatus = 'active' | 'suspended' | 'deleted';

// ── DB row shapes ──────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  monthly_budget: number;
  status: OrgStatus;
  alert_email: string | null;
  slack_webhook: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ApiKey {
  id: string;
  organization_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: Date | null;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProviderCredential {
  id: string;
  organization_id: string;
  provider: ProviderType;
  label: string;
  encrypted_key: string;
  iv: string;
  auth_tag: string;
  is_active: boolean;
}

export interface ModelPricing {
  id: string;
  provider: ProviderType;
  model: string;
  input_cost_per_1k: number;
  output_cost_per_1k: number;
  context_window: number | null;
  is_active: boolean;
}

export interface UsageLog {
  id: string;
  organization_id: string;
  api_key_id: string | null;
  customer_id: string | null;
  feature: string;
  provider: ProviderType;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  input_cost: number;
  output_cost: number;
  total_cost: number;
  latency_ms: number | null;
  cache_hit: boolean;
  request_status: RequestStatus;
  http_status: number | null;
  error_message: string | null;
  request_id: string | null;
  created_at: Date;
}

export interface OrganizationBudgetSummary {
  organization_id: string;
  month: Date;
  total_cost: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  request_count: number;
  updated_at: Date;
}

// ── Request context (attached to req by middleware) ───────────

export interface ProxyRequestContext {
  organizationId: string;
  organizationSlug: string;
  keyId: string;
  scopes: string[];
  monthlyBudget: number;
  feature: string;
  customerId: string | null;
  requestId: string;
}

// ── Provider request/response shapes ─────────────────────────

export interface LLMRequestBody {
  model: string;
  messages?: any[];
  prompt?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  system?: string;
  tools?: any[];
  stream?: boolean;
  [key: string]: any;
}

export interface LLMUsageResult {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface ProxyResponse {
  data: any;
  usage: LLMUsageResult;
  latencyMs: number;
  provider: ProviderType;
  model: string;
  cacheHit: boolean;
}
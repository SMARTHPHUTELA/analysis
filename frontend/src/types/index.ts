export type ProviderType   = 'openai' | 'anthropic' | 'gemini' | 'azure_openai';
export type RequestStatus  = 'success' | 'error' | 'blocked' | 'cached';
export type OrgStatus      = 'active' | 'suspended' | 'deleted';

export interface Organization {
  id:              string;
  name:            string;
  slug:            string;
  monthly_budget:  number;
  status:          OrgStatus;
  alert_email:     string | null;
  slack_webhook:   string | null;
  created_at:      string;
  updated_at:      string;
}

export interface ApiKey {
  id:              string;
  organization_id: string;
  name:            string;
  key_prefix:      string;
  scopes:          string[];
  is_active:       boolean;
  last_used_at:    string | null;
  expires_at:      string | null;
  created_at:      string;
  plaintext_key?:  string; // only present immediately after creation
}

export interface BudgetSummary {
  organization_id:   string;
  month:             string;
  total_cost:        number;
  prompt_tokens:     number;
  completion_tokens: number;
  total_tokens:      number;
  request_count:     number;
  updated_at:        string;
}

export interface UsageLog {
  id:                string;
  organization_id:   string;
  api_key_id:        string | null;
  customer_id:       string | null;
  feature:           string;
  provider:          ProviderType;
  model:             string;
  prompt_tokens:     number;
  completion_tokens: number;
  total_tokens:      number;
  input_cost:        number;
  output_cost:       number;
  total_cost:        number;
  latency_ms:        number | null;
  cache_hit:         boolean;
  request_status:    RequestStatus;
  http_status:       number | null;
  error_message:     string | null;
  created_at:        string;
}

export interface FeatureBreakdown {
  feature:        string;
  request_count:  number;
  total_tokens:   number;
  total_cost:     number;
  avg_latency_ms: number;
}

export interface ModelBreakdown {
  provider:      ProviderType;
  model:         string;
  request_count: number;
  total_tokens:  number;
  total_cost:    number;
}

export interface DailySpend {
  date:          string;
  request_count: number;
  total_cost:    number;
  total_tokens:  number;
}

export interface ApiResponse<T> {
  success: boolean;
  data:    T;
  error?:  { message: string };
}

export interface AuthUser {
  id:              string;
  name:            string;
  email:           string;
  role:            'admin' | 'manager';
  organization_id: string | null;
}
import axios, { AxiosInstance } from 'axios';
import {
  ApiResponse, Organization, ApiKey,
  BudgetSummary, UsageLog, FeatureBreakdown,
  ModelBreakdown, DailySpend,
} from '@/types';

const client: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// ── Response interceptor — unwrap { success, data } envelope ──
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error?.message ??
      err.message ??
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

function unwrap<T>(res: { data: ApiResponse<T> }): T {
  return res.data.data;
}

// ── Organizations ──────────────────────────────────────────────
export const orgApi = {
  list: () =>
    client.get<ApiResponse<Organization[]>>('/organizations').then(unwrap),

  getOne: (id: string) =>
    client.get<ApiResponse<Organization>>(`/organizations/${id}`).then(unwrap),

  create: (data: {
    name: string;
    slug: string;
    monthly_budget?: number;
    alert_email?: string;
    slack_webhook?: string;
  }) =>
    client.post<ApiResponse<Organization>>('/organizations', data).then(unwrap),

  update: (id: string, data: Partial<{
    name: string;
    monthly_budget: number;
    alert_email: string;
    slack_webhook: string;
    status: string;
  }>) =>
    client.patch<ApiResponse<Organization>>(`/organizations/${id}`, data).then(unwrap),
};

// ── API Keys ───────────────────────────────────────────────────
export const keyApi = {
  list: (orgId: string) =>
    client.get<ApiResponse<ApiKey[]>>(`/organizations/${orgId}/keys`).then(unwrap),

  create: (orgId: string, data: {
    name: string;
    scopes?: string[];
    expiresAt?: string;
  }) =>
    client
      .post<ApiResponse<ApiKey>>(`/organizations/${orgId}/keys`, data)
      .then(unwrap),

  revoke: (orgId: string, keyId: string) =>
    client
      .delete<ApiResponse<{ message: string }>>(`/organizations/${orgId}/keys/${keyId}`)
      .then(unwrap),
};

// ── Credentials ────────────────────────────────────────────────
export const credentialApi = {
  upsert: (orgId: string, data: {
    provider: string;
    api_key: string;
    label?: string;
  }) =>
    client
      .post<ApiResponse<any>>(`/organizations/${orgId}/credentials`, data)
      .then(unwrap),
};

// ── Analytics ──────────────────────────────────────────────────
export const analyticsApi = {
  summary: (orgId: string) =>
    client
      .get<ApiResponse<{ current_month: BudgetSummary | null; history: BudgetSummary[] }>>(
        `/organizations/${orgId}/analytics/summary`
      )
      .then(unwrap),

  daily: (orgId: string, days = 30) =>
    client
      .get<ApiResponse<DailySpend[]>>(
        `/organizations/${orgId}/analytics/daily?days=${days}`
      )
      .then(unwrap),

  features: (orgId: string, days = 30) =>
    client
      .get<ApiResponse<FeatureBreakdown[]>>(
        `/organizations/${orgId}/analytics/features?days=${days}`
      )
      .then(unwrap),

  models: (orgId: string, days = 30) =>
    client
      .get<ApiResponse<ModelBreakdown[]>>(
        `/organizations/${orgId}/analytics/models?days=${days}`
      )
      .then(unwrap),

  logs: (orgId: string, limit = 100, offset = 0) =>
    client
      .get<ApiResponse<UsageLog[]>>(
        `/organizations/${orgId}/analytics/logs?limit=${limit}&offset=${offset}`
      )
      .then(unwrap),
  savings: (orgId: string, days = 30) =>
    client
      .get<ApiResponse<{
        saved_cost:      number;
        saved_tokens:    number;
        cache_hit_count: number;
      }>>(
        `/organizations/${orgId}/analytics/savings?days=${days}`
      )
      .then(unwrap),
};
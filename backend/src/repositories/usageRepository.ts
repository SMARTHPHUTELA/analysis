import { query, queryOne } from '../config/database';
import { UsageLog, ProviderType, RequestStatus } from '../types';

export interface InsertUsageLogData {
  organizationId:   string;
  apiKeyId:         string | null;
  customerId:       string | null;
  feature:          string;
  provider:         ProviderType;
  model:            string;
  promptTokens:     number;
  completionTokens: number;
  totalTokens:      number;
  inputCost:        number;
  outputCost:       number;
  totalCost:        number;
  savedCost:        number;
  savedTokens:      number;
  latencyMs:        number | null;
  cacheHit:         boolean;
  requestStatus:    RequestStatus;
  httpStatus:       number | null;
  errorMessage:     string | null;
  requestId:        string | null;
}

export const usageRepository = {
  async insert(data: InsertUsageLogData): Promise<void> {
    await query(
      `INSERT INTO usage_logs (
        organization_id, api_key_id, customer_id, feature, provider, model,
        prompt_tokens, completion_tokens, total_tokens,
        input_cost, output_cost, total_cost,
        saved_cost, saved_tokens,
        latency_ms, cache_hit, request_status, http_status, error_message, request_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,
        $10,$11,$12,
        $13,$14,
        $15,$16,$17,$18,$19,$20
      )`,
      [
        data.organizationId,
        data.apiKeyId,
        data.customerId,
        data.feature,
        data.provider,
        data.model,
        data.promptTokens,
        data.completionTokens,
        data.totalTokens,
        data.inputCost,
        data.outputCost,
        data.totalCost,
        data.savedCost,
        data.savedTokens,
        data.latencyMs,
        data.cacheHit,
        data.requestStatus,
        data.httpStatus,
        data.errorMessage,
        data.requestId,
      ]
    );
  },

  async findByOrganization(
    organizationId: string,
    limit = 100,
    offset = 0
  ): Promise<UsageLog[]> {
    return query<UsageLog>(
      `SELECT * FROM usage_logs
       WHERE organization_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [organizationId, limit, offset]
    );
  },

  async getFeatureBreakdown(
    organizationId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<any[]> {
    return query(
      `SELECT
         feature,
         COUNT(*)::int            AS request_count,
         SUM(total_tokens)::int   AS total_tokens,
         SUM(total_cost)          AS total_cost,
         AVG(latency_ms)::int     AS avg_latency_ms,
         SUM(saved_cost)          AS saved_cost,
         SUM(saved_tokens)::int   AS saved_tokens
       FROM usage_logs
       WHERE organization_id = $1
         AND created_at BETWEEN $2 AND $3
         AND request_status != 'blocked'
       GROUP BY feature
       ORDER BY total_cost DESC`,
      [organizationId, fromDate, toDate]
    );
  },

  async getModelBreakdown(
    organizationId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<any[]> {
    return query(
      `SELECT
         provider,
         model,
         COUNT(*)::int            AS request_count,
         SUM(total_tokens)::int   AS total_tokens,
         SUM(total_cost)          AS total_cost,
         SUM(saved_cost)          AS saved_cost
       FROM usage_logs
       WHERE organization_id = $1
         AND created_at BETWEEN $2 AND $3
         AND request_status != 'blocked'
       GROUP BY provider, model
       ORDER BY total_cost DESC`,
      [organizationId, fromDate, toDate]
    );
  },

  async getDailySpend(
    organizationId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<any[]> {
    return query(
      `SELECT
         DATE(created_at)         AS date,
         COUNT(*)::int            AS request_count,
         SUM(total_cost)          AS total_cost,
         SUM(total_tokens)::int   AS total_tokens,
         SUM(saved_cost)          AS saved_cost
       FROM usage_logs
       WHERE organization_id = $1
         AND created_at BETWEEN $2 AND $3
         AND request_status != 'blocked'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [organizationId, fromDate, toDate]
    );
  },

  async getTotalSavings(
    organizationId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<{
    saved_cost:       number;
    saved_tokens:     number;
    cache_hit_count:  number;
  }> {
    const rows = await query(
      `SELECT
         COALESCE(SUM(saved_cost),   0)::float  AS saved_cost,
         COALESCE(SUM(saved_tokens), 0)::int     AS saved_tokens,
         COUNT(*) FILTER (WHERE cache_hit = TRUE)::int AS cache_hit_count
       FROM usage_logs
       WHERE organization_id = $1
         AND created_at BETWEEN $2 AND $3`,
      [organizationId, fromDate, toDate]
    );
    return rows[0];
  },

  async getPlatformSummary(): Promise<any[]> {
    return query(
      `SELECT
         o.id,
         o.name,
         o.slug,
         o.monthly_budget,
         o.status,
         COALESCE(s.total_cost,     0) AS spent,
         COALESCE(s.request_count,  0) AS request_count,
         COALESCE(s.total_tokens,   0) AS total_tokens
       FROM organizations o
       LEFT JOIN organization_budget_summary s
         ON s.organization_id = o.id
         AND s.month = DATE_TRUNC('month', NOW())::DATE
       WHERE o.status != 'deleted'
       ORDER BY spent DESC`
    );
  },
};
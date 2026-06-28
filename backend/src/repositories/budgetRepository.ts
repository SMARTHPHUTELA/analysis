import { query, queryOne } from '../config/database';
import { OrganizationBudgetSummary } from '../types';
import { startOfMonth } from 'date-fns';

export const budgetRepository = {
  // Used in the request pipeline — fast single-row read
  async getCurrentMonthSummary(
    organizationId: string
  ): Promise<OrganizationBudgetSummary | null> {
    const month = startOfMonth(new Date()).toISOString().split('T')[0];
    return queryOne<OrganizationBudgetSummary>(
      `SELECT * FROM organization_budget_summary
       WHERE organization_id = $1 AND month = $2`,
      [organizationId, month]
    );
  },

  // Called async after each successful request
  async upsertMonthSummary(data: {
    organizationId: string;
    totalCost: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }): Promise<void> {
    const month = startOfMonth(new Date()).toISOString().split('T')[0];
    await query(
      `INSERT INTO organization_budget_summary
         (organization_id, month, total_cost, prompt_tokens, completion_tokens, total_tokens, request_count)
       VALUES ($1, $2, $3, $4, $5, $6, 1)
       ON CONFLICT (organization_id, month) DO UPDATE SET
         total_cost        = organization_budget_summary.total_cost        + EXCLUDED.total_cost,
         prompt_tokens     = organization_budget_summary.prompt_tokens     + EXCLUDED.prompt_tokens,
         completion_tokens = organization_budget_summary.completion_tokens + EXCLUDED.completion_tokens,
         total_tokens      = organization_budget_summary.total_tokens      + EXCLUDED.total_tokens,
         request_count     = organization_budget_summary.request_count     + 1,
         updated_at        = NOW()`,
      [
        data.organizationId,
        month,
        data.totalCost,
        data.promptTokens,
        data.completionTokens,
        data.totalTokens,
      ]
    );
  },

  async getHistoricalSummaries(
    organizationId: string,
    months: number = 6
  ): Promise<OrganizationBudgetSummary[]> {
    return query<OrganizationBudgetSummary>(
      `SELECT * FROM organization_budget_summary
       WHERE organization_id = $1
       ORDER BY month DESC
       LIMIT $2`,
      [organizationId, months]
    );
  },
};
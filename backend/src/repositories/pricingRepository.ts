import { queryOne } from '../config/database';
import { ModelPricing, ProviderType } from '../types';

export const pricingRepository = {
  async findByProviderAndModel(
    provider: ProviderType,
    model:    string
  ): Promise<ModelPricing | null> {
    // 1. Exact match first
    const exact = await queryOne<ModelPricing>(
      `SELECT * FROM model_pricing
       WHERE provider = $1
         AND model = $2
         AND is_active = TRUE
       LIMIT 1`,
      [provider, model]
    );
    if (exact) return exact;

    // 2. Fuzzy match — handles versioned names like:
    //    "gpt-4o-mini-2024-07-18"  → matches "gpt-4o-mini"
    //    "gpt-4-turbo-2024-04-09"  → matches "gpt-4-turbo"
    //    "claude-3-5-sonnet-20241022" → matches "claude-sonnet-4-6"
    const fuzzy = await queryOne<ModelPricing>(
      `SELECT * FROM model_pricing
       WHERE provider = $1
         AND $2 LIKE model || '%'
         AND is_active = TRUE
       ORDER BY LENGTH(model) DESC
       LIMIT 1`,
      [provider, model]
    );

    if (fuzzy) return fuzzy;

    // 3. Reverse fuzzy — model in DB starts with what was returned
    const reverse = await queryOne<ModelPricing>(
      `SELECT * FROM model_pricing
       WHERE provider = $1
         AND model LIKE '%' || $2 || '%'
         AND is_active = TRUE
       ORDER BY LENGTH(model) ASC
       LIMIT 1`,
      [provider, model]
    );

    return reverse ?? null;
  },
};
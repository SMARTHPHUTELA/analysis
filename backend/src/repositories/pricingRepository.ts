import { queryOne } from '../config/database';
import { ModelPricing, ProviderType } from '../types';

export const pricingRepository = {
  async findByProviderAndModel(
    provider: ProviderType,
    model: string
  ): Promise<ModelPricing | null> {
    return queryOne<ModelPricing>(
      `SELECT * FROM model_pricing
       WHERE provider = $1 AND model = $2 AND is_active = TRUE
       LIMIT 1`,
      [provider, model]
    );
  },
};
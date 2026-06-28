import { pricingRepository } from '../repositories/pricingRepository';
import { ProviderType, LLMUsageResult } from '../types';
import { logger } from '../config/logger';

export const pricingService = {
  async calculate(
    provider: ProviderType,
    model: string,
    promptTokens: number,
    completionTokens: number
  ): Promise<LLMUsageResult> {
    const pricing = await pricingRepository.findByProviderAndModel(provider, model);

    let inputCostPer1k = 0;
    let outputCostPer1k = 0;

    if (!pricing) {
      logger.warn({ provider, model }, 'No pricing found for model — defaulting to 0');
    } else {
      inputCostPer1k = Number(pricing.input_cost_per_1k);
      outputCostPer1k = Number(pricing.output_cost_per_1k);
    }

    const inputCost  = (promptTokens     / 1000) * inputCostPer1k;
    const outputCost = (completionTokens / 1000) * outputCostPer1k;
    const totalCost  = inputCost + outputCost;

    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      inputCost:   parseFloat(inputCost.toFixed(8)),
      outputCost:  parseFloat(outputCost.toFixed(8)),
      totalCost:   parseFloat(totalCost.toFixed(8)),
    };
  },
};
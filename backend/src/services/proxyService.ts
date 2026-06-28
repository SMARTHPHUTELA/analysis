import { credentialRepository } from '../repositories/credentialRepository';
import { pricingService }       from '../pricing/pricingService';
import { getProviderAdapter }   from '../providers/providerFactory';
import { buildCacheKey }        from '../utils/cacheKey';
import { decrypt }              from '../utils/encryption';
import { redisClient }          from '../cache/redis';
import { usageRepository }      from '../repositories/usageRepository';
import { budgetRepository }     from '../repositories/budgetRepository';
import { alertService }         from './alertService';
import { logger }               from '../config/logger';
import {
  ProviderType,
  ProxyRequestContext,
  LLMUsageResult,
} from '../types';

interface ProxyCallInput {
  ctx:      ProxyRequestContext;
  provider: ProviderType;
  body:     any;
}

interface ProxyCallOutput {
  response:  any;
  cacheHit:  boolean;
  usage:     LLMUsageResult;
  latencyMs: number;
  model:     string;
}

const ZERO_USAGE: LLMUsageResult = {
  promptTokens:     0,
  completionTokens: 0,
  totalTokens:      0,
  inputCost:        0,
  outputCost:       0,
  totalCost:        0,
};

export const proxyService = {
  async call(input: ProxyCallInput): Promise<ProxyCallOutput> {
    const { ctx, provider, body } = input;
    const model = body.model as string;

    if (!model) throw new Error('Request body must include a model field');

    // ── Step 5: Check response cache ──────────────────────────
    const cacheKey = buildCacheKey(provider, body);
    const cached   = await redisClient.getResponse(cacheKey);

    if (cached) {
      logger.debug({ cacheKey, org: ctx.organizationId }, 'Response cache hit');
      const parsedCache = JSON.parse(cached);

      // Calculate what this call WOULD have cost without cache
      // The raw response has usage data stored inside it
      const rawUsage    = parsedCache?.usage ?? {};
      const promptToks  =
        rawUsage.prompt_tokens   ??   // openai format
        rawUsage.input_tokens    ??   // anthropic format
        rawUsage.promptTokenCount ?? 0; // gemini format
      const completionToks =
        rawUsage.completion_tokens   ??
        rawUsage.output_tokens       ??
        rawUsage.candidatesTokenCount ?? 0;

      const wouldHaveCost = await pricingService.calculate(
        provider,
        model,
        promptToks,
        completionToks
      );

      triggerAsyncTasks({
        ctx,
        provider,
        model,
        usage:         ZERO_USAGE,
        savedCost:     wouldHaveCost.totalCost,
        savedTokens:   wouldHaveCost.totalTokens,
        latencyMs:     0,
        cacheHit:      true,
        httpStatus:    200,
        requestStatus: 'cached',
        errorMessage:  null,
      });

      return {
        response:  parsedCache,
        cacheHit:  true,
        usage:     ZERO_USAGE,
        latencyMs: 0,
        model,
      };
    }

    // ── Step 6: Load + decrypt provider credential ─────────────
    const credential = await credentialRepository.findByOrgAndProvider(
      ctx.organizationId,
      provider
    );

    if (!credential) {
      throw new Error(
        `No active credential found for provider "${provider}". ` +
        `Please add credentials in your dashboard settings.`
      );
    }

    const plainApiKey = decrypt(
      credential.encrypted_key,
      credential.iv,
      credential.auth_tag
    );

    // ── Step 7: Call the LLM provider ─────────────────────────
    const adapter = getProviderAdapter(provider);
    const start   = Date.now();
    let providerResult;

    try {
      providerResult = await adapter.call(plainApiKey, body);
    } catch (err: any) {
      const latencyMs    = Date.now() - start;
      const httpStatus   = err.response?.status ?? 502;
      const errorMessage =
        err.response?.data?.error?.message ?? err.message;

      triggerAsyncTasks({
        ctx,
        provider,
        model,
        usage:         ZERO_USAGE,
        savedCost:     0,
        savedTokens:   0,
        latencyMs,
        cacheHit:      false,
        httpStatus,
        requestStatus: 'error',
        errorMessage,
      });

      throw err;
    }

    const latencyMs = Date.now() - start;

    // ── Step 8: Calculate cost ─────────────────────────────────
    const usage = await pricingService.calculate(
      provider,
      providerResult.model,
      providerResult.promptTokens,
      providerResult.completionTokens
    );

    // ── Step 9: Store in response cache ───────────────────────
    redisClient
      .setResponse(cacheKey, providerResult.rawResponse)
      .catch((err) =>
        logger.warn({ err }, 'Failed to write response to Redis cache')
      );

    // ── Steps 11a/b/c: Async fan-out ──────────────────────────
    triggerAsyncTasks({
      ctx,
      provider,
      model:         providerResult.model,
      usage,
      savedCost:     0,
      savedTokens:   0,
      latencyMs,
      cacheHit:      false,
      httpStatus:    200,
      requestStatus: 'success',
      errorMessage:  null,
    });

    return {
      response:  providerResult.rawResponse,
      cacheHit:  false,
      usage,
      latencyMs,
      model: providerResult.model,
    };
  },
};

// ── Async task fan-out ─────────────────────────────────────────

interface AsyncTaskInput {
  ctx:           ProxyRequestContext;
  provider:      ProviderType;
  model:         string;
  usage:         LLMUsageResult;
  savedCost:     number;
  savedTokens:   number;
  latencyMs:     number;
  cacheHit:      boolean;
  httpStatus:    number;
  requestStatus: 'success' | 'error' | 'blocked' | 'cached';
  errorMessage:  string | null;
}

function triggerAsyncTasks(input: AsyncTaskInput): void {
  const {
    ctx, provider, model, usage,
    savedCost, savedTokens,
    latencyMs, cacheHit, httpStatus,
    requestStatus, errorMessage,
  } = input;

  // Task 1 — Insert usage log
  usageRepository
    .insert({
      organizationId:   ctx.organizationId,
      apiKeyId:         ctx.keyId,
      customerId:       ctx.customerId,
      feature:          ctx.feature,
      provider,
      model,
      promptTokens:     usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens:      usage.totalTokens,
      inputCost:        usage.inputCost,
      outputCost:       usage.outputCost,
      totalCost:        usage.totalCost,
      savedCost,
      savedTokens,
      latencyMs,
      cacheHit,
      requestStatus,
      httpStatus,
      errorMessage,
      requestId: ctx.requestId,
    })
    .catch((err) =>
      logger.error({ err }, 'Async Task 1: usage log insert failed')
    );

  // Task 2 — Update budget summary (only real spend, not cache hits)
  if (usage.totalCost > 0) {
    budgetRepository
      .upsertMonthSummary({
        organizationId:   ctx.organizationId,
        totalCost:        usage.totalCost,
        promptTokens:     usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens:      usage.totalTokens,
      })
      .catch((err) =>
        logger.error({ err }, 'Async Task 2: budget summary upsert failed')
      );
  }

  // Task 3 — Budget threshold alert check
  if (requestStatus === 'success' || requestStatus === 'cached') {
    alertService
      .checkAndNotify(ctx.organizationId, ctx.monthlyBudget)
      .catch((err) =>
        logger.error({ err }, 'Async Task 3: alert check failed')
      );
  }
}
import { Request, Response } from 'express';
import { proxyService }      from '../services/proxyService';
import { sendError }         from '../utils/response';
import { logger }            from '../config/logger';
import { ProviderType }      from '../types';

const SUPPORTED_PROVIDERS: ProviderType[] = [
  'openai', 'anthropic', 'gemini', 'azure_openai'
];

export const proxyController = {
  async handle(req: Request, res: Response): Promise<void> {
    const provider = req.params['provider'] as ProviderType;

    if (!SUPPORTED_PROVIDERS.includes(provider)) {
      sendError(
        res,
        `Unsupported provider "${provider}". Supported: ${SUPPORTED_PROVIDERS.join(', ')}`,
        400
      );
      return;
    }

    try {
      const result = await proxyService.call({
        ctx: req.ctx,
        provider,
        body: req.body,
      });

      // Set cache header so clients can see if response was cached
      res.setHeader('x-cache',      result.cacheHit ? 'HIT' : 'MISS');
      res.setHeader('x-latency-ms', result.latencyMs.toString());
      res.setHeader('x-request-id', req.ctx.requestId);

      res.status(200).json(result.response);
    } catch (err: any) {
      logger.error({ err, org: req.ctx.organizationId }, 'Proxy call failed');

      const status  = err.response?.status ?? 502;
      const message = err.response?.data?.error?.message ?? err.message ?? 'Provider error';

      sendError(res, message, status);
    }
  },
};
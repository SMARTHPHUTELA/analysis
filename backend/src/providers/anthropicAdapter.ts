import axios from 'axios';
import { IProviderAdapter, ProviderCallResult } from './types';
import { logger } from '../config/logger';

export class AnthropicAdapter implements IProviderAdapter {
  readonly provider = 'anthropic' as const;

  async call(apiKey: string, body: any): Promise<ProviderCallResult> {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      body,
      {
        headers: {
          'x-api-key':         apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type':      'application/json',
        },
        timeout: 120_000,
      }
    );

    const data  = response.data;
    const usage = data.usage ?? {};

    return {
      rawResponse:       data,
      promptTokens:     usage.input_tokens  ?? 0,
      completionTokens: usage.output_tokens ?? 0,
      model:            data.model ?? body.model,
    };
  }
}
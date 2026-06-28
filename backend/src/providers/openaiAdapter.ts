import axios from 'axios';
import { IProviderAdapter, ProviderCallResult } from './types';
import { logger } from '../config/logger';

export class OpenAIAdapter implements IProviderAdapter {
  readonly provider = 'openai' as const;

  async call(apiKey: string, body: any): Promise<ProviderCallResult> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      body,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 120_000,
      }
    );

    const data = response.data;
    const usage = data.usage ?? {};

    return {
      rawResponse:       data,
      promptTokens:     usage.prompt_tokens     ?? 0,
      completionTokens: usage.completion_tokens ?? 0,
      model:            data.model ?? body.model,
    };
  }
}
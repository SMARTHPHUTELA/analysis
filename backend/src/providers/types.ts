import { ProviderType, LLMUsageResult } from '../types';

export interface ProviderCallResult {
  rawResponse: any;
  promptTokens: number;
  completionTokens: number;
  model: string;
}

export interface IProviderAdapter {
  provider: ProviderType;
  call(apiKey: string, body: any): Promise<ProviderCallResult>;
}
import { IProviderAdapter } from './types';
import { OpenAIAdapter }      from './openaiAdapter';
import { AnthropicAdapter }   from './anthropicAdapter';
import { GeminiAdapter }      from './geminiAdapter';
import { AzureOpenAIAdapter } from './azureAdapter';
import { ProviderType }       from '../types';

const adapters: Record<ProviderType, IProviderAdapter> = {
  openai:       new OpenAIAdapter(),
  anthropic:    new AnthropicAdapter(),
  gemini:       new GeminiAdapter(),
  azure_openai: new AzureOpenAIAdapter(),
};

export function getProviderAdapter(provider: ProviderType): IProviderAdapter {
  const adapter = adapters[provider];
  if (!adapter) throw new Error(`Unsupported provider: ${provider}`);
  return adapter;
}
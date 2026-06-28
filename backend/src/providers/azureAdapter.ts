import axios from 'axios';
import { IProviderAdapter, ProviderCallResult } from './types';

export class AzureOpenAIAdapter implements IProviderAdapter {
  readonly provider = 'azure_openai' as const;

  async call(apiKey: string, body: any): Promise<ProviderCallResult> {
    // Azure URL format: https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions?api-version=2024-02-01
    // We expect the apiKey to contain the full base URL + real key separated by "|"
    // Format stored in provider_credentials: "https://resource.openai.azure.com/openai/deployments/my-deployment|AZURE_KEY"
    const [baseUrl, azureKey] = apiKey.split('|');

    const url = `${baseUrl}/chat/completions?api-version=2024-02-01`;

    const response = await axios.post(url, body, {
      headers: {
        'api-key':       azureKey,
        'Content-Type':  'application/json',
      },
      timeout: 120_000,
    });

    const data  = response.data;
    const usage = data.usage ?? {};

    return {
      rawResponse:       data,
      promptTokens:     usage.prompt_tokens     ?? 0,
      completionTokens: usage.completion_tokens ?? 0,
      model:            data.model ?? body.model,
    };
  }
}
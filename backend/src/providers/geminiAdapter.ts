import axios from 'axios';
import { IProviderAdapter, ProviderCallResult } from './types';

export class GeminiAdapter implements IProviderAdapter {
  readonly provider = 'gemini' as const;

  async call(apiKey: string, body: any): Promise<ProviderCallResult> {
    const model    = body.model ?? 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Translate OpenAI-style messages to Gemini format if needed
    const geminiBody = this.translateBody(body);

    const response = await axios.post(endpoint, geminiBody, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 120_000,
    });

    const data     = response.data;
    const metadata = data.usageMetadata ?? {};

    return {
      rawResponse:       data,
      promptTokens:     metadata.promptTokenCount     ?? 0,
      completionTokens: metadata.candidatesTokenCount ?? 0,
      model,
    };
  }

  private translateBody(body: any): any {
    // If already in Gemini format, pass through
    if (body.contents) return body;

    // Translate from OpenAI messages format
    const contents = (body.messages ?? []).map((msg: any) => ({
      role:  msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    return {
      contents,
      generationConfig: {
        maxOutputTokens: body.max_tokens,
        temperature:     body.temperature,
        topP:            body.top_p,
      },
    };
  }
}
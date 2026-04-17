/**
 * Minimal OpenRouter client with primary + fallback model support.
 * No SDK dependency — just fetch. ESM only.
 */
import process from 'node:process';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

export class OpenRouterError extends Error {
  constructor(message, { status, body, model } = {}) {
    super(message);
    this.name = 'OpenRouterError';
    this.status = status;
    this.body = body;
    this.model = model;
  }
}

/**
 * Call a model. Returns the assistant text content.
 * Retries the fallback model if the primary fails with a recoverable error.
 */
export async function callModel({
  messages,
  model,
  fallbackModel,
  temperature = 0.55,
  maxTokens = 4096,
  apiKey = process.env.OPENROUTER_API_KEY,
  timeoutMs = 120_000,
  responseFormat,
}) {
  if (!apiKey) {
    throw new OpenRouterError('OPENROUTER_API_KEY missing from environment');
  }

  const candidates = [model, fallbackModel].filter(Boolean);
  let lastErr;

  for (const m of candidates) {
    try {
      const body = {
        model: m,
        messages,
        temperature,
        max_tokens: maxTokens,
      };
      if (responseFormat) body.response_format = responseFormat;

      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), timeoutMs);

      const res = await fetch(ENDPOINT, {
        method: 'POST',
        signal: ctl.signal,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://affiliatetools.co',
          'X-Title': 'AffiliateTools.co content pipeline',
        },
        body: JSON.stringify(body),
      }).finally(() => clearTimeout(to));

      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new OpenRouterError('Non-JSON response', {
          status: res.status,
          body: text.slice(0, 400),
          model: m,
        });
      }

      if (!res.ok || json.error) {
        throw new OpenRouterError(
          json?.error?.message || `HTTP ${res.status}`,
          { status: res.status, body: text.slice(0, 400), model: m },
        );
      }

      const content = json?.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new OpenRouterError('Empty response', {
          status: res.status,
          body: text.slice(0, 400),
          model: m,
        });
      }

      return { text: content, modelUsed: m, raw: json };
    } catch (err) {
      lastErr = err;
      // Only fall through to fallback for recoverable errors.
      const recoverable =
        err.name === 'AbortError' ||
        (err instanceof OpenRouterError &&
          (err.status >= 500 || err.status === 429 || err.status === 404));
      if (!recoverable) break;
    }
  }

  throw lastErr ?? new OpenRouterError('Model call failed with no diagnostic');
}

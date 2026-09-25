/**
 * Plain-text LLM chain for the packing notes.
 *
 * The list itself is built in code; the model only writes three short lines
 * about it, so this is a nice-to-have, never a blocker. What matters is that it
 * cannot hang: the old chain had no timeout on any rung, pointed at a paid-only
 * OpenRouter slug and a retired Gemini model, and could keep the request open
 * until the platform killed it. Every rung now has its own timeout under one
 * shared deadline, mirroring the Wardrobe's chain (verified slugs, 2026-08).
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

type Rung =
  | { provider: 'groq' | 'openrouter'; model: string }
  | { provider: 'gemini'; model: string };

const CHAIN: Rung[] = [
  { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  { provider: 'gemini', model: 'gemini-flash-lite-latest' },
  { provider: 'gemini', model: 'gemini-2.5-flash' },
  { provider: 'openrouter', model: 'openai/gpt-oss-20b:free' },
];

const RUNG_TIMEOUT_MS = 12_000;
const TOTAL_BUDGET_MS = 26_000;
const MIN_RUNG_MS = 4_000;

async function openAICompatible(url: string, key: string, model: string, messages: LLMMessage[], maxTokens: number, timeoutMs: number) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.5 }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => '')}`.slice(0, 200));
  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response');
  return text.trim();
}

async function gemini(key: string, model: string, messages: LLMMessage[], maxTokens: number, timeoutMs: number) {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const user = messages.filter((m) => m.role !== 'system').map((m) => m.content).join('\n\n');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: maxTokens },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    },
  );
  if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => '')}`.slice(0, 200));
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response');
  return text.trim();
}

/** Walk the chain. Throws only when every rung has failed or time is up. */
export async function chat(messages: LLMMessage[], maxTokens = 400): Promise<string> {
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const errors: string[] = [];

  for (const rung of CHAIN) {
    const key =
      rung.provider === 'groq' ? process.env.GROQ_API_KEY
      : rung.provider === 'openrouter' ? process.env.OPENROUTER_API_KEY
      : process.env.GEMINI_API_KEY;
    if (!key) continue;

    const remaining = deadline - Date.now();
    if (remaining < MIN_RUNG_MS) break;
    const timeout = Math.min(RUNG_TIMEOUT_MS, remaining);

    try {
      return rung.provider === 'gemini'
        ? await gemini(key, rung.model, messages, maxTokens, timeout)
        : await openAICompatible(
            rung.provider === 'groq'
              ? 'https://api.groq.com/openai/v1/chat/completions'
              : 'https://openrouter.ai/api/v1/chat/completions',
            key, rung.model, messages, maxTokens, timeout,
          );
    } catch (e) {
      errors.push(`${rung.provider}(${rung.model}): ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.warn('[llm] every rung failed', errors);
  throw new Error('All LLM providers failed');
}

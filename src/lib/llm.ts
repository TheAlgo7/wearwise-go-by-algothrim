export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface Provider {
  name: string;
  url: string;
  model: string;
  authHeader: () => string;
}

const providers: Provider[] = [
  {
    name: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    authHeader: () => `Bearer ${process.env.GROQ_API_KEY}`,
  },
  {
    name: 'openrouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'meta-llama/llama-3.3-70b-instruct',
    authHeader: () => `Bearer ${process.env.OPENROUTER_API_KEY}`,
  },
  {
    name: 'gemini',
    url: `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`,
    model: 'gemini-2.0-flash',
    authHeader: () => `Bearer ${process.env.GEMINI_API_KEY}`,
  },
];

export async function chat(messages: LLMMessage[], maxTokens = 1200): Promise<string> {
  for (const provider of providers) {
    try {
      const res = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: provider.authHeader(),
        },
        body: JSON.stringify({
          model:      provider.model,
          messages,
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const text: string | undefined = data?.choices?.[0]?.message?.content;
      if (text) return text.trim();
    } catch {
      // Try next provider
    }
  }

  throw new Error('All LLM providers failed');
}

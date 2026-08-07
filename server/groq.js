const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TIMEOUT_MS = 30000;

export class GroqError extends Error {
  constructor(status, message, kind) {
    super(message);
    this.name = 'GroqError';
    this.status = status;
    this.kind = kind; // 'timeout' | 'rate_limited' | 'upstream' | 'bad_response'
  }
}

export async function callGroq({ apiKey, model, messages }) {
  let res;
  try {
    res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 1,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new GroqError(504, 'Groq did not respond in time.', 'timeout');
    }
    throw new GroqError(502, 'Could not reach Groq.', 'upstream');
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new GroqError(502, 'Groq returned a non-JSON response.', 'bad_response');
  }

  if (!res.ok) {
    const code = res.status;
    if (code === 401) {
      throw new GroqError(500, 'Groq rejected the API key.', 'upstream');
    }
    if (code === 429) {
      throw new GroqError(429, 'Groq is rate limiting us. Try again in a few seconds.', 'rate_limited');
    }
    throw new GroqError(502, `Groq error (${code}).`, 'upstream');
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new GroqError(502, 'Groq returned an empty completion.', 'bad_response');
  }

  return content;
}

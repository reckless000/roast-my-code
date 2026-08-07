const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TIMEOUT_MS = 10000;

export async function verifyTurnstile(token, secret) {
  const form = new URLSearchParams();
  form.set('secret', secret);
  form.set('response', token);

  let res;
  try {
    res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return false;
  }

  if (!res.ok) return false;

  try {
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

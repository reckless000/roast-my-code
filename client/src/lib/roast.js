export async function roastCode(code, language, accent, turnstileToken) {
  const body = { code, language };
  if (accent) body.accent = accent;
  if (turnstileToken) body.turnstileToken = turnstileToken;

  let res;
  try {
    res = await fetch('/roast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg =
      (data && data.error) ||
      (res.status === 429
        ? 'Rate limited. Even the roaster needs a break — wait a minute.'
        : res.status === 413
          ? 'That payload was too big to even look at. Trim it down.'
          : 'The server got upset. Try again in a sec.');
    throw new Error(msg);
  }

  return data.roast ?? 'The model returned nothing. That\'s a roast in itself, honestly.';
}

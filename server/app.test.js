import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp, MAX_CODE_LENGTH } from './app.js';
import { GroqError } from './groq.js';

const SAMPLE_CODE = 'function double(x) { return x * 2; }';

function fakeGroqClient(result) {
  return async ({ messages }) => {
    lastMessages = messages;
    if (typeof result === 'string') return result;
    throw result;
  };
}

let lastMessages = null;

function makeApp({ result = 'Nice try, champ.', groqClient, turnstileSecretKey, turnstileSiteKey, verifyTurnstileFn } = {}) {
  const groq = groqClient || fakeGroqClient(result);
  return createApp({
    groqApiKey: 'test-key',
    groqModel: 'test-model',
    groqClient: groq,
    turnstileSecretKey,
    turnstileSiteKey,
    verifyTurnstileFn,
  });
}

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

async function withServer(app, fn) {
  const server = await listen(app);
  try {
    return await fn(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function post(base, path, body, contentType = 'application/json') {
  return fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: contentType === 'application/json' ? JSON.stringify(body) : body,
  });
}

test('GET /health returns ok', async () => {
  await withServer(makeApp(), async (base) => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
  });
});

test('GET /config exposes turnstileSiteKey only when set', async () => {
  await withServer(makeApp(), async (base) => {
    const res = await fetch(`${base}/config`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).turnstileSiteKey, null);
  });
});

test('GET /config exposes site key when configured', async () => {
  await withServer(makeApp({ turnstileSecretKey: 's', turnstileSiteKey: 'k' }), async (base) => {
    const res = await fetch(`${base}/config`);
    assert.deepEqual(await res.json(), { turnstileSiteKey: 'k' });
  });
});

test('POST /roast returns the roast from the model client', async () => {
  await withServer(makeApp({ result: 'A roast with a real talk line.' }), async (base) => {
    const res = await post(base, '/roast', { code: SAMPLE_CODE, language: 'javascript' });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { roast: 'A roast with a real talk line.' });
  });
});

test('the model actually receives the pasted code (prompt interpolation)', async () => {
  const calls = [];
  await withServer(
    makeApp({
      groqClient: async ({ messages }) => {
        calls.push(messages);
        return 'ok';
      },
    }),
    async (base) => {
      await post(base, '/roast', { code: SAMPLE_CODE, language: 'python' });
    }
  );
  assert.equal(calls.length, 1);
  const userMsg = calls[0][1].content;
  assert.match(userMsg, /<code>/);
  assert.ok(userMsg.includes(SAMPLE_CODE));
  assert.match(userMsg, /Language\/file type: python/);
});

test('the accent instruction is passed to the model', async () => {
  const calls = [];
  await withServer(
    makeApp({
      groqClient: async ({ messages }) => {
        calls.push(messages);
        return 'ok';
      },
    }),
    async (base) => {
      await post(base, '/roast', { code: SAMPLE_CODE, accent: 'egyptian-arabic' });
    }
  );
  const userMsg = calls[0][1].content;
  assert.match(userMsg, /Roast delivery style:.*Egyptian Arabic/);
  assert.match(userMsg, /Never transliterate or translate code/);
});

test('unknown accents are ignored without crashing', async () => {
  const calls = [];
  await withServer(
    makeApp({
      groqClient: async ({ messages }) => {
        calls.push(messages);
        return 'ok';
      },
    }),
    async (base) => {
      const res = await post(base, '/roast', { code: SAMPLE_CODE, accent: 'klingon' });
      assert.equal(res.status, 200);
    }
  );
  const userMsg = calls[0][1].content;
  assert.ok(!userMsg.includes('Roast delivery style'));
});

test('POST /roast rejects short code', async () => {
  await withServer(makeApp(), async (base) => {
    const res = await post(base, '/roast', { code: 'hi' });
    assert.equal(res.status, 400);
    assert.match((await res.json()).error, /actual code/);
  });
});

test('POST /roast rejects non-string code', async () => {
  await withServer(makeApp(), async (base) => {
    const res = await post(base, '/roast', { code: 12345 });
    assert.equal(res.status, 400);
    assert.match((await res.json()).error, /as a string/);
  });
});

test('POST /roast rejects non-JSON content-type without crashing', async () => {
  await withServer(makeApp(), async (base) => {
    const res = await post(base, '/roast', 'code=hello', 'text/plain');
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, 'Send the code as a string.');
  });
});

test('POST /roast rejects oversized code (> 20000 chars)', async () => {
  await withServer(makeApp(), async (base) => {
    const res = await post(base, '/roast', { code: 'a'.repeat(MAX_CODE_LENGTH + 1) });
    assert.equal(res.status, 400);
    assert.match((await res.json()).error, /too much/);
  });
});

test('POST /roast rejects oversized JSON body with 413', async () => {
  await withServer(makeApp(), async (base) => {
    const body = JSON.stringify({ code: 'a'.repeat(60000) });
    const res = await post(base, '/roast', body);
    assert.equal(res.status, 413);
    assert.match((await res.json()).error, /Payload too large/);
  });
});

test('maps Groq rate-limit errors to 429', async () => {
  await withServer(makeApp({ groqClient: fakeGroqClient(new GroqError(429, 'rate limited', 'rate_limited')) }), async (base) => {
    const res = await post(base, '/roast', { code: SAMPLE_CODE });
    assert.equal(res.status, 429);
  });
});

test('maps Groq upstream errors to 502', async () => {
  await withServer(makeApp({ groqClient: fakeGroqClient(new GroqError(502, 'upstream down', 'upstream')) }), async (base) => {
    const res = await post(base, '/roast', { code: SAMPLE_CODE });
    assert.equal(res.status, 502);
  });
});

test('unexpected errors become 500 without leaking details', async () => {
  await withServer(makeApp({ groqClient: fakeGroqClient(new Error('secret internal detail')) }), async (base) => {
    const res = await post(base, '/roast', { code: SAMPLE_CODE });
    assert.equal(res.status, 500);
    const json = await res.json();
    assert.equal(json.error, 'Something broke server-side.');
    assert.ok(!JSON.stringify(json).includes('secret internal detail'));
  });
});

test('rate limits after 10 requests in the window', async () => {
  await withServer(makeApp(), async (base) => {
    let last;
    for (let i = 0; i < 11; i += 1) {
      last = await post(base, '/roast', { code: 'hi' });
    }
    assert.equal(last.status, 429);
    assert.match((await last.json()).error, /Slow down/);
  });
});

test('when Turnstile is enabled, a missing token is rejected', async () => {
  await withServer(makeApp({ turnstileSecretKey: 'secret' }), async (base) => {
    const res = await post(base, '/roast', { code: SAMPLE_CODE });
    assert.equal(res.status, 403);
  });
});

test('when Turnstile is enabled, an invalid token is rejected', async () => {
  await withServer(
    makeApp({ turnstileSecretKey: 'secret', verifyTurnstileFn: async () => false }),
    async (base) => {
      const res = await post(base, '/roast', { code: SAMPLE_CODE, turnstileToken: 'bad' });
      assert.equal(res.status, 403);
    }
  );
});

test('when Turnstile is enabled, a valid token passes through to the roast', async () => {
  await withServer(
    makeApp({ turnstileSecretKey: 'secret', verifyTurnstileFn: async () => true, result: 'roasted' }),
    async (base) => {
      const res = await post(base, '/roast', { code: SAMPLE_CODE, turnstileToken: 'good' });
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { roast: 'roasted' });
    }
  );
});

test('SPA fallback serves index.html for unknown GET routes', async () => {
  await withServer(makeApp(), async (base) => {
    const res = await fetch(`${base}/some/unknown/route`);
    assert.equal(res.status, 200);
    assert.ok((await res.text()).includes('id="root"'));
  });
});

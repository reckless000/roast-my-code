import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { buildMessages } from './prompts.js';
import { callGroq, GroqError } from './groq.js';
import { verifyTurnstile } from './verify-turnstile.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const MAX_CODE_LENGTH = 20000;
export const MIN_CODE_LENGTH = 10;

export function createApp({
  groqApiKey,
  groqModel,
  groqClient = callGroq,
  turnstileSecretKey,
  turnstileSiteKey,
  verifyTurnstileFn = verifyTurnstile,
}) {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'script-src': ["'self'", 'https://challenges.cloudflare.com'],
          'frame-src': ['https://challenges.cloudflare.com'],
          'connect-src': ["'self'", 'https://challenges.cloudflare.com'],
        },
      },
    })
  );
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '50kb' }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Slow down. Ten roasts per 15 minutes — your code is not that bad.' },
  });
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Server is slammed. Come back in a minute.' },
  });
  app.use('/roast', globalLimiter, apiLimiter);

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/config', (_req, res) => {
    res.json({ turnstileSiteKey: turnstileSiteKey || null });
  });

  app.post('/roast', async (req, res) => {
    const { code, language, accent } = req.body ?? {};
    if (typeof code !== 'string') {
      return res.status(400).json({ error: 'Send the code as a string.' });
    }
    const trimmed = code.trim();
    if (trimmed.length < MIN_CODE_LENGTH) {
      return res.status(400).json({ error: 'Paste some actual code first.' });
    }
    if (code.length > MAX_CODE_LENGTH) {
      return res.status(400).json({ error: `That's too much to roast. Keep it under ${MAX_CODE_LENGTH.toLocaleString()} characters.` });
    }

    if (turnstileSecretKey) {
      const token = req.body?.turnstileToken;
      if (typeof token !== 'string' || token.length === 0) {
        return res.status(403).json({ error: 'Human check failed. Are you a bot?' });
      }
      let ok = false;
      try {
        ok = await verifyTurnstileFn(token, turnstileSecretKey);
      } catch (err) {
        console.error('[turnstile] verification error', err);
      }
      if (!ok) {
        return res.status(403).json({ error: 'Human check failed. Are you a bot?' });
      }
    }

    try {
      const messages = buildMessages(
        typeof language === 'string' ? language : '',
        trimmed,
        typeof accent === 'string' ? accent : ''
      );
      const roast = await groqClient({ apiKey: groqApiKey, model: groqModel, messages });
      res.json({ roast });
    } catch (err) {
      if (err instanceof GroqError) {
        console.error(`[groq] ${err.kind} status=${err.status} ${err.message}`);
        return res.status(err.status).json({ error: err.message });
      }
      console.error('[roast] unexpected error', err);
      res.status(500).json({ error: 'Something broke server-side.' });
    }
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found.' });
  });

  const distDir = path.join(__dirname, '..', 'dist');
  if (!process.env.VERCEL && fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, next) => {
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Payload too large. Keep it under 50kb.' });
    }
    if (err?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'That body was not valid JSON.' });
    }
    console.error('[http]', err);
    res.status(500).json({ error: 'Something broke server-side.' });
  });

  return app;
}

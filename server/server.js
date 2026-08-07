import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const groqApiKey = process.env.GROQ_API_KEY;
const groqModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY;
const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY;
const port = Number(process.env.PORT) || 3000;

if (!groqApiKey) {
  console.error('GROQ_API_KEY is not set. Copy .env.example to .env and add your key.');
  process.exit(1);
}

const app = createApp({ groqApiKey, groqModel, turnstileSecretKey, turnstileSiteKey });

const server = app.listen(port, () => {
  console.log(`Roast My Code running on http://localhost:${port} (model: ${groqModel})`);
  if (turnstileSecretKey) {
    console.log('Turnstile human-check: ON');
  } else {
    console.log('Turnstile human-check: OFF (set TURNSTILE_SECRET_KEY to enable)');
  }
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

import { createApp } from '../server/app.js';

const app = createApp({
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
  turnstileSiteKey: process.env.TURNSTILE_SITE_KEY,
});

export default app;

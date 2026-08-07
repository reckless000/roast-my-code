# Roast My Code

Paste your code. Get roasted by a grumpy senior dev (powered by Groq). React + Vite frontend, Express backend, Cloudflare Turnstile human-check.

## Run locally

```bash
npm install
npm run build
npm start
```

Dev mode (hot reload):

```bash
npm run dev
```

Copy `.env.example` to `.env` and fill in `GROQ_API_KEY` (and `TURNSTILE_*` keys if you want the human check on).

## Test

```bash
npm test
```

## Deploy

Runs as a single Node/Express process serving the built client from `client/dist`. A Dockerfile is included for Back4App Containers / any Docker host. Set `GROQ_API_KEY`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, and `PORT` in your host's env config.

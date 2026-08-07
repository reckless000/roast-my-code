import { useEffect, useState } from 'react';
import Ticker from './components/Ticker.jsx';
import CodePanel from './components/CodePanel.jsx';
import LoadingCard from './components/LoadingCard.jsx';
import ResultCard from './components/ResultCard.jsx';
import TurnstileWidget from './components/TurnstileWidget.jsx';
import { roastCode } from './lib/roast.js';
import { MIN_CODE_LENGTH, MAX_CODE_LENGTH } from './constants.js';

export default function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('auto');
  const [accent, setAccent] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [roast, setRoast] = useState('');
  const [error, setError] = useState('');
  const [turnstileSiteKey, setTurnstileSiteKey] = useState(null);
  const [humanToken, setHumanToken] = useState(null);
  const [turnstileReset, setTurnstileReset] = useState(0);

  useEffect(() => {
    fetch('/config')
      .then((r) => r.json())
      .then((cfg) => setTurnstileSiteKey(cfg.turnstileSiteKey || null))
      .catch(() => {});
  }, []);

  const loading = status === 'loading';
  const trimmed = code.trim();
  const tooShort = trimmed.length < MIN_CODE_LENGTH;
  const tooLong = code.length > MAX_CODE_LENGTH;
  const humanCheckPending = Boolean(turnstileSiteKey) && !humanToken;

  async function handleRoast() {
    if (loading || humanCheckPending) return;
    if (tooShort) {
      setStatus('error');
      setError('Paste some actual code first. Ten characters minimum — we both deserve that.');
      return;
    }
    if (tooLong) {
      setStatus('error');
      setError(`That is too much code. Keep it under ${MAX_CODE_LENGTH.toLocaleString()} characters.`);
      return;
    }
    setStatus('loading');
    setError('');
    try {
      const result = await roastCode(code, language, accent, humanToken);
      setRoast(result);
      setStatus('done');
    } catch (err) {
      setError(err.message || 'Something broke. Even the roaster gave up on this one.');
      setStatus('error');
    } finally {
      setTurnstileReset((n) => n + 1);
    }
  }

  function handleCodeChange(value) {
    setCode(value);
    if (status === 'error') setStatus('idle');
  }

  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRoast();
    }
  }

  return (
    <>
      <Ticker />
      <main className="page">
        <header className="masthead">
          <p className="kicker">THE HONEST PR REVIEW — EST. 2026 — MADE BY RECKLESS000</p>
          <h1 className="title">
            ROAST
            <span className="title-accent">MY</span>
            CODE
          </h1>
          <p className="sub">
            Paste your code. Regret it instantly. A grumpy senior dev will
            explain, in detail, why you should not be allowed near a keyboard.
          </p>
        </header>

        <div className="card-stack">
          <CodePanel
            code={code}
            onCodeChange={handleCodeChange}
            language={language}
            onLanguageChange={setLanguage}
            accent={accent}
            onAccentChange={setAccent}
            disabled={loading}
            onKeyDown={handleKeyDown}
          />

          <button
            type="button"
            className="roast-btn"
            onClick={handleRoast}
            disabled={loading || humanCheckPending}
          >
            {loading ? 'Roasting…' : humanCheckPending ? 'Prove you\'re human first' : 'Roast me'}
          </button>
          {turnstileSiteKey && (
            <div className="human-check">
              <TurnstileWidget
                siteKey={turnstileSiteKey}
                onToken={setHumanToken}
                onExpire={() => setHumanToken(null)}
                resetSignal={turnstileReset}
              />
              <p className="hint">Human check is on — the bots got too bold.</p>
            </div>
          )}
          <p className="hint">
            <kbd>Ctrl</kbd><span className="kbd-plus">+</span><kbd>Enter</kbd> to fire. No code is stored. No soft feelings guaranteed.
          </p>

          {status === 'loading' && <LoadingCard />}
          {status === 'done' && <ResultCard roast={roast} />}
          {status === 'error' && (
            <section className="error-card" role="alert">
              <span className="stamp stamp-red">HELD</span>
              <p>{error}</p>
            </section>
          )}
        </div>
      </main>
      <footer className="footer">
        <p>
          Server logs status codes only. Your code is never stored. If you broke
          production, that&apos;s on you, not on us.
        </p>
      </footer>
    </>
  );
}

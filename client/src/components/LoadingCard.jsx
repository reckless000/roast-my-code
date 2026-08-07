import { useEffect, useState } from 'react';
import { LOADING_PHRASES } from '../constants.js';

export default function LoadingCard() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setI((v) => (v + 1) % LOADING_PHRASES.length);
    }, 900);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="loading-card" role="status" aria-live="polite">
      <div className="loading-flag" aria-hidden="true">
        <div className="loading-flame" />
      </div>
      <div>
        <p className="loading-title">Roasting…</p>
        <p className="loading-phrase">{LOADING_PHRASES[i]}</p>
      </div>
    </section>
  );
}

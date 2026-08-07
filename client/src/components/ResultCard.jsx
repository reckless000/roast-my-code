import { useEffect, useState } from 'react';

function splitRealTalk(roast) {
  const lines = roast.trim().split('\n');
  const idx = lines.findIndex((l) => /^real talk:/i.test(l.trim()));
  if (idx === -1) {
    return { burn: lines.join('\n'), realTalk: null };
  }
  const burn = lines.slice(0, idx).join('\n').trim();
  const realTalk = lines[idx].trim().replace(/^real talk:\s*/i, '');
  return { burn, realTalk };
}

export default function ResultCard({ roast }) {
  const [copied, setCopied] = useState(false);
  const { burn, realTalk } = splitRealTalk(roast);

  useEffect(() => {
    setCopied(false);
  }, [roast]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(roast);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = roast;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="result-card" aria-live="polite">
      <div className="result-head">
        <span className="stamp">VERDICT</span>
        <button type="button" className="copy-btn" onClick={copy}>
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>
      {burn && <p className="roast-text">{burn}</p>}
      {realTalk && (
        <p className="real-talk">
          <span className="real-talk-label">REAL TALK:</span>
          {realTalk}
        </p>
      )}
    </section>
  );
}

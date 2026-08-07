import { useEffect, useRef } from 'react';
import { LANGUAGES, MAX_CODE_LENGTH, ROAST_ACCENTS } from '../constants.js';

export default function CodePanel({
  code,
  onCodeChange,
  language,
  onLanguageChange,
  accent,
  onAccentChange,
  disabled,
  onKeyDown,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const len = code.length;
  const over = len > MAX_CODE_LENGTH;

  return (
    <section className="code-card" aria-label="Code to roast">
      <div className="toolbar">
        <label htmlFor="language" className="toolbar-label">Language</label>
        <select
          id="language"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          disabled={disabled}
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
        <span className={`counter${over ? ' counter-over' : ''}`} aria-live="polite">
          {len.toLocaleString()} / {MAX_CODE_LENGTH.toLocaleString()}
        </span>
      </div>

      <label htmlFor="code" className="sr-only">Paste your code</label>
      <textarea
        id="code"
        ref={textareaRef}
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder="Paste your beautiful, definitely-not-cursed code here..."
        spellCheck="false"
      />
      {over && (
        <p className="counter-msg" role="alert">
          That is way too much code to roast. Delete some. The model has a dignity budget.
        </p>
      )}

      <div className="toolbar toolbar-accent">
        <label htmlFor="accent" className="toolbar-label">Roast dialect</label>
        <select
          id="accent"
          value={accent}
          onChange={(e) => onAccentChange(e.target.value)}
          disabled={disabled}
        >
          {ROAST_ACCENTS.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>
    </section>
  );
}

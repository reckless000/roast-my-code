const WORDS = [
  'FREE RANGE SENIOR DEVS',
  'WE JUDGE YOUR HARDCODED KEYS',
  'ROASTS SERVED HOT AND FRESH',
  'NO SOFT FEELINGS GUARANTEED',
  'YOUR CODE IS NOW PUBLIC DOMAIN',
  'DRY. LIKE YOUR SENSE OF HUMOR.',
  'COMMENTS APPRECIATED. NESTED ONES, LESS SO.',
];

function Marquee() {
  const row = [...WORDS, ...WORDS].map((w, i) => (
    <span className="ticker-item" key={i}>
      <span className="ticker-word">{w}</span>
      <span className="ticker-block" aria-hidden="true" />
    </span>
  ));
  return <div className="ticker-row" aria-hidden="true">{row}</div>;
}

export default function Ticker() {
  return (
    <header className="ticker">
      <Marquee />
    </header>
  );
}

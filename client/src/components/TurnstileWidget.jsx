import { useEffect, useRef } from 'react';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export default function TurnstileWidget({ siteKey, onToken, onExpire, resetSignal = 0 }) {
  const wrapRef = useRef(null);
  const widgetIdRef = useRef(null);
  const renderedRef = useRef(false);
  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);
  onTokenRef.current = onToken;
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!siteKey || !wrapRef.current) return undefined;
    renderedRef.current = false;

    function render() {
      if (renderedRef.current || !window.turnstile || !wrapRef.current?.isConnected) return;
      renderedRef.current = true;
      widgetIdRef.current = window.turnstile.render(wrapRef.current, {
        sitekey: siteKey,
        callback: (token) => onTokenRef.current(token),
        'expired-callback': () => onExpireRef.current(),
        'error-callback': () => onExpireRef.current(),
      });
    }

    if (window.turnstile) {
      render();
      return undefined;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = render;
    document.head.appendChild(script);

    return () => {
      if (window.turnstile && widgetIdRef.current != null) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
      renderedRef.current = false;
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetSignal === 0) return;
    if (widgetIdRef.current == null) return;
    window.turnstile.reset(widgetIdRef.current);
    onExpireRef.current();
  }, [resetSignal]);

  return <div ref={wrapRef} className="turnstile-wrap" />;
}

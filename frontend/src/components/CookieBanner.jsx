import { useState, useEffect } from 'react';

const COOKIE_KEY = 'vg_cookie_consent';

function getConsent() {
  try { return localStorage.getItem(COOKIE_KEY); } catch { return null; }
}
function setConsent(value) {
  try { localStorage.setItem(COOKIE_KEY, value); } catch { /* storage indisponible */ }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getConsent()) setVisible(true);
  }, []);

  const accept = () => { setConsent('accepted'); setVisible(false); };
  const refuse = () => { setConsent('refused'); setVisible(false); };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Consentement cookies">
      <div className="cookie-banner__content">
        <p>
          Ce site utilise uniquement des <strong>cookies fonctionnels</strong> (session, authentification)
          nécessaires à son bon fonctionnement. Aucun cookie publicitaire ou de suivi n'est utilisé.
        </p>
        <div className="cookie-banner__actions">
          <button className="btn btn-primary btn-sm" onClick={accept}>Accepter</button>
          <button className="btn btn-outline btn-sm" onClick={refuse}>Refuser</button>
        </div>
      </div>
    </div>
  );
}

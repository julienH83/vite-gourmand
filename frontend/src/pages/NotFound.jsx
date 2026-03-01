import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function NotFound() {
  useEffect(() => { document.title = 'Page non trouvée - Vite & Gourmand'; }, []);

  return (
    <div className="not-found">
      <h1 className="not-found__code">404</h1>
      <h2>Page non trouvée</h2>
      <p className="not-found__text">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Link to="/" className="btn btn-primary">Retour à l'accueil</Link>
    </div>
  );
}

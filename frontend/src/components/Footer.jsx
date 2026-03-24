import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function Footer() {
  const [hours, setHours] = useState([]);

  useEffect(() => {
    api.get('/hours')
      .then(res => res.json())
      .then(data => setHours(data))
      .catch(() => {});
  }, []);

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-inner">
        <div>
          <h3>Vite & Gourmand</h3>
          <p>Traiteur événementiel à Bordeaux.</p>
          <p>10 Place de la Bourse, 33000 Bordeaux</p>
          <p>Tél : 05 56 00 00 00</p>
          <p>Email : contact@vitegourmand.fr</p>
        </div>

        <div>
          <h3>Horaires</h3>
          <ul>
            {hours.map((h) => (
              <li key={h.day_of_week}>
                <strong>{DAY_NAMES[h.day_of_week]} :</strong>{' '}
                {h.is_closed ? 'Fermé' : `${h.open_time?.slice(0, 5)} - ${h.close_time?.slice(0, 5)}`}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3>Informations</h3>
          <ul>
            <li><Link to="/prestations">Prestations</Link></li>
            <li><Link to="/boissons">Boissons</Link></li>
            <li><Link to="/legal/mentions_legales">Mentions légales</Link></li>
            <li><Link to="/legal/confidentialite">Politique de confidentialité</Link></li>
            <li><Link to="/legal/cgv">Conditions Générales de Vente</Link></li>
            <li><Link to="/contact">Nous contacter</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Vite & Gourmand. Tous droits réservés.</p>
      </div>
    </footer>
  );
}

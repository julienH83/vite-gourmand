import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getDistanceKm } from '../utils/distance';

export default function OrderPage() {
  const { menuId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [distanceLoading, setDistanceLoading] = useState(false);
  const [distanceError, setDistanceError] = useState('');

  const [form, setForm] = useState({
    nb_persons: '',
    delivery_address: user?.address || '',
    delivery_city: '',
    delivery_date: '',
    delivery_time: '',
    delivery_distance_km: 0,
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  // Load menu
  useEffect(() => {
    let cancelled = false;

    api.get(`/menus/${menuId}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        setMenu(data);
        update('nb_persons', data.min_persons); // pré-rempli
      })
      .catch(() => {
        if (cancelled) return;
        setMenu(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [menuId]);

  // Auto distance (debounced)
  useEffect(() => {
    const city = (form.delivery_city || '').trim();
    const address = (form.delivery_address || '').trim();
    const isBordeaux = city.toLowerCase().includes('bordeaux');

    setDistanceError('');

    // Si Bordeaux => distance = 0
    if (isBordeaux) {
      update('delivery_distance_km', 0);
      return;
    }

    // si pas assez d'info => ne calcule pas
    if (!address || !city) return;

    const fullAddress = `${address}, ${city}`;

    let cancelled = false;
    setDistanceLoading(true);

    const t = setTimeout(async () => {
      try {
        const km = await getDistanceKm(fullAddress);
        if (cancelled) return;
        update('delivery_distance_km', km);
      } catch (e) {
        if (cancelled) return;
        update('delivery_distance_km', 0);
        setDistanceError("Impossible de calculer la distance automatiquement. Vérifie l'adresse.");
      } finally {
        if (cancelled) return;
        setDistanceLoading(false);
      }
    }, 800);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [form.delivery_address, form.delivery_city]);

  if (loading) return <div className="loading">Chargement...</div>;
  if (!menu) return <div className="container"><div className="alert alert-error">Menu non trouvé.</div></div>;

  // Values
  const nbPersons = parseInt(form.nb_persons, 10) || 0;
  const cityLower = (form.delivery_city || '').toLowerCase();
  const isBordeaux = cityLower.includes('bordeaux');
  const distance = Number(form.delivery_distance_km) || 0;

  // Calcul prix (miroir du PricingService backend)
  const minPersons = Number(menu.min_persons) || 1;
  const minPrice = Number(menu.min_price) || 0;

  const menuPrice = minPrice * nbPersons;

  const deliveryPrice = isBordeaux ? 0 : 5 + (0.59 * distance);

  const hasDiscount = nbPersons >= (minPersons + 5);
  const discount = hasDiscount ? menuPrice * 0.10 : 0;

  const totalPrice = menuPrice + deliveryPrice - discount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (nbPersons < minPersons) {
      return setError(`Minimum ${minPersons} personnes pour ce menu.`);
    }

    if (!form.delivery_address || !form.delivery_city || !form.delivery_date || !form.delivery_time) {
      return setError('Merci de remplir tous les champs requis.');
    }

    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        menu_id: menuId,
        nb_persons: nbPersons,
        delivery_address: form.delivery_address,
        delivery_city: form.delivery_city,
        delivery_date: form.delivery_date,
        delivery_time: form.delivery_time,
        delivery_distance_km: distance,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.errors?.join(', ') || 'Erreur lors de la commande');

      navigate(`/dashboard/orders/${data.id}`);
    } catch (err) {
      setError(err.message || 'Erreur lors de la commande');
    } finally {
      setSubmitting(false);
    }
  };

  // Tomorrow minimum date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="auth-page auth-page--lg">
      <div className="page-header">
        <h1>Commander : {menu.title}</h1>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {menu.conditions && (
        <div className="alert alert-info" role="alert">
          <strong>Conditions :</strong> {menu.conditions}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card card-padded">
        <h2>Vos informations</h2>

        <div className="form-row mt-4">
          <div className="form-group">
            <label>Prénom</label>
            <input type="text" value={user?.first_name || ''} disabled />
          </div>
          <div className="form-group">
            <label>Nom</label>
            <input type="text" value={user?.last_name || ''} disabled />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={user?.email || ''} disabled />
          </div>
          <div className="form-group">
            <label>Téléphone</label>
            <input type="tel" value={user?.phone || ''} disabled />
          </div>
        </div>

        <h2 className="mt-5">Détails de la commande</h2>

        <div className="form-group mt-4">
          <label htmlFor="order-persons">Nombre de personnes * (min. {minPersons})</label>
          <input
            id="order-persons"
            type="number"
            required
            min={minPersons}
            value={form.nb_persons}
            onChange={e => update('nb_persons', e.target.value)}
          />
          {hasDiscount && (
            <small className="password-hint--valid">
              Remise de 10% applicable ({minPersons + 5}+ personnes)
            </small>
          )}
          <small>
            Prix : {minPrice.toFixed(2)} € / personne
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="order-address">Adresse de livraison *</label>
          <input
            id="order-address"
            type="text"
            required
            value={form.delivery_address}
            onChange={e => update('delivery_address', e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="order-city">Ville *</label>
            <input
              id="order-city"
              type="text"
              required
              value={form.delivery_city}
              onChange={e => update('delivery_city', e.target.value)}
              placeholder="Bordeaux"
            />
          </div>

          <div className="form-group">
            <label htmlFor="order-distance">Distance (km)</label>
            <input
              id="order-distance"
              type="number"
              min="0"
              step="0.1"
              value={distance}
              readOnly
              disabled={isBordeaux}
              aria-busy={distanceLoading ? 'true' : 'false'}
            />
            {isBordeaux && (
              <small className="password-hint--valid">Livraison gratuite à Bordeaux !</small>
            )}
            {!isBordeaux && distanceLoading && (
              <small>Calcul de la distance...</small>
            )}
            {!isBordeaux && distanceError && (
              <small className="field-error">{distanceError}</small>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="order-date">Date de livraison *</label>
            <input
              id="order-date"
              type="date"
              required
              min={minDate}
              value={form.delivery_date}
              onChange={e => update('delivery_date', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="order-time">Heure de livraison *</label>
            <input
              id="order-time"
              type="time"
              required
              value={form.delivery_time}
              onChange={e => update('delivery_time', e.target.value)}
            />
          </div>
        </div>

        <div className="price-summary" aria-label="Récapitulatif des prix">
          <h3 className="mb-3">Récapitulatif</h3>

          <div className="price-line">
            <span>Menu ({nbPersons} pers. x {minPrice.toFixed(2)} €)</span>
            <span>{menuPrice.toFixed(2)} €</span>
          </div>

          <div className="price-line">
            <span>Livraison {isBordeaux ? '(Bordeaux - gratuite)' : `(${distance.toFixed(1)} km)`}</span>
            <span>{deliveryPrice.toFixed(2)} €</span>
          </div>

          {hasDiscount && (
            <div className="price-line discount">
              <span>Remise 10% (groupe)</span>
              <span>-{discount.toFixed(2)} €</span>
            </div>
          )}

          <div className="price-line total">
            <span>Total</span>
            <span>{totalPrice.toFixed(2)} €</span>
          </div>
          <div className="price-line">
            <span>Acompte à régler (30%)</span>
            <span>{(Math.round(totalPrice * 0.30 * 100) / 100).toFixed(2)} €</span>
          </div>
          <div className="price-line">
            <span>Solde restant</span>
            <span>{(totalPrice - Math.round(totalPrice * 0.30 * 100) / 100).toFixed(2)} €</span>
          </div>
        </div>

        <div className="alert alert-info mt-3">
          Un acompte de 30% du total sera demandé pour confirmer votre commande.
          Vous recevrez les instructions de paiement par email.
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full mt-5"
          disabled={submitting || distanceLoading}
          aria-disabled={submitting || distanceLoading}
        >
          {submitting ? 'Validation...' : `Confirmer la commande (${totalPrice.toFixed(2)} €)`}
        </button>
      </form>
    </div>
  );
}

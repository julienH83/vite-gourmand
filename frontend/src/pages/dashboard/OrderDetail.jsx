import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const STATUS_LABELS = {
  deposit_pending: 'Acompte en attente',
  confirmed: 'Confirmée',
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  en_preparation: 'En préparation',
  en_livraison: 'En cours de livraison',
  livree: 'Livrée',
  attente_retour_materiel: 'Attente retour matériel',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

const PAYMENT_STATUS_LABELS = {
  non_paye: 'Non payé',
  acompte_paye: 'Acompte reçu',
  paye: 'Payé',
};

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Modification commande (annuler/modifier si pas "acceptée")
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchOrder = () => {
    api.get(`/orders/${id}`)
      .then(r => r.json())
      .then(data => {
        setOrder(data);
        // Pré-remplir le formulaire d'édition avec les valeurs actuelles
        if (data) {
          setEditForm({
            nb_persons: data.nb_persons,
            delivery_address: data.delivery_address,
            delivery_city: data.delivery_city,
            delivery_date: data.delivery_date?.slice(0, 10),
            delivery_time: data.delivery_time?.slice(0, 5),
            delivery_distance_km: data.delivery_distance_km || 0,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');
    setEditSubmitting(true);
    try {
      const res = await api.put(`/orders/${id}`, editForm);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la modification.');
      setEditSuccess('Commande modifiée avec succès.');
      setEditing(false);
      fetchOrder();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    try {
      const res = await api.post(`/reviews/${id}`, reviewForm);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReviewSuccess('Merci pour votre avis !');
      fetchOrder();
    } catch (err) {
      setReviewError(err.message);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (!order) return <div className="container"><div className="alert alert-error">Commande non trouvée.</div></div>;

  return (
    <div className="auth-page auth-page--lg">
      <Link to="/dashboard">&larr; Retour au tableau de bord</Link>

      <h1 className="mt-4">Commande #{order.id.slice(0, 8)}</h1>

      <div className="card card-padded mt-4">
        <div className="flex-between mb-4">
          <h2>{order.menu_title}</h2>
          <span className={`badge badge-${order.status === 'terminee' || order.status === 'livree' ? 'green' : order.status === 'annulee' ? 'red' : 'orange'}`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        <div className="form-row">
          <div><strong>Personnes :</strong> {order.nb_persons}</div>
          <div><strong>Date :</strong> {new Date(order.delivery_date).toLocaleDateString('fr-FR')}</div>
        </div>
        <div className="form-row mt-2">
          <div><strong>Heure :</strong> {order.delivery_time?.slice(0, 5)}</div>
          <div><strong>Ville :</strong> {order.delivery_city}</div>
        </div>
        <div className="mt-2"><strong>Adresse :</strong> {order.delivery_address}</div>

        <div className="price-summary mt-4">
          <div className="price-line"><span>Menu</span><span>{Number(order.menu_price).toFixed(2)} €</span></div>
          <div className="price-line"><span>Livraison</span><span>{Number(order.delivery_price).toFixed(2)} €</span></div>
          {Number(order.discount) > 0 && (
            <div className="price-line discount"><span>Remise</span><span>-{Number(order.discount).toFixed(2)} €</span></div>
          )}
          <div className="price-line total"><span>Total</span><span>{Number(order.total_price).toFixed(2)} €</span></div>
        </div>

        {/* ── Infos paiement ── */}
        <div className="payment-info">
          <div className="form-row">
            <div>
              <strong>Paiement :</strong>{' '}
              <span className={`badge badge-${order.payment_status === 'paye' ? 'green' : order.payment_status === 'acompte_paye' ? 'orange' : 'red'}`}>
                {PAYMENT_STATUS_LABELS[order.payment_status] || 'Non payé'}
              </span>
            </div>
            {order.deposit_amount > 0 && (
              <div><strong>Mode :</strong> Virement bancaire</div>
            )}
          </div>
          {order.deposit_amount > 0 && (
            <div className="mt-2">
              <strong>Acompte (30%) :</strong> {Number(order.deposit_amount).toFixed(2)} €
              {order.deposit_paid_at && (
                <span className="text-muted" style={{ marginLeft: 8 }}>
                  — reçu le {new Date(order.deposit_paid_at).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Boutons paiement (employé/admin) */}
      {(user.role === 'employee' || user.role === 'admin') && (
        <section className="action-bar mt-5">
          {order.deposit_amount > 0 && order.payment_status === 'non_paye' && (
            <button
              className="btn btn-primary"
              onClick={async () => {
                try {
                  await api.post(`/orders/${id}/confirm-deposit`);
                  fetchOrder();
                } catch { /* erreur gérée par le serveur */ }
              }}
            >
              Confirmer acompte reçu
            </button>
          )}
          {order.payment_status !== 'paye' && (
            <button
              className="btn btn-success"
              onClick={async () => {
                try {
                  await api.post(`/orders/${id}/mark-paid`);
                  fetchOrder();
                } catch { /* erreur gérée par le serveur */ }
              }}
            >
              Marquer comme payé
            </button>
          )}
        </section>
      )}

      {/* Modification commande — visible si en_attente + rôle user */}
      {(order.status === 'en_attente' || order.status === 'deposit_pending') && user.role === 'user' && (
        <section className="mt-5">
          {editSuccess && <div className="alert alert-success">{editSuccess}</div>}
          {!editing ? (
            <button className="btn btn-outline" onClick={() => setEditing(true)}>
              Modifier la commande
            </button>
          ) : (
            <form onSubmit={handleEditSubmit} className="card card-padded mt-3">
              <h2>Modifier la commande</h2>
              <p className="section-subtitle">
                Le menu ne peut pas être modifié. Vous pouvez ajuster les autres informations.
              </p>
              {editError && <div className="alert alert-error">{editError}</div>}
              <div className="form-group">
                <label htmlFor="edit-persons">Nombre de personnes</label>
                <input
                  id="edit-persons"
                  type="number"
                  required
                  min="1"
                  value={editForm.nb_persons}
                  onChange={e => setEditForm({ ...editForm, nb_persons: parseInt(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-address">Adresse de livraison</label>
                <input
                  id="edit-address"
                  type="text"
                  required
                  value={editForm.delivery_address}
                  onChange={e => setEditForm({ ...editForm, delivery_address: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-city">Ville</label>
                  <input
                    id="edit-city"
                    type="text"
                    required
                    value={editForm.delivery_city}
                    onChange={e => setEditForm({ ...editForm, delivery_city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-distance">Distance (km)</label>
                  <input
                    id="edit-distance"
                    type="number"
                    min="0"
                    step="0.1"
                    value={editForm.delivery_distance_km}
                    onChange={e => setEditForm({ ...editForm, delivery_distance_km: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-date">Date de livraison</label>
                  <input
                    id="edit-date"
                    type="date"
                    required
                    value={editForm.delivery_date}
                    onChange={e => setEditForm({ ...editForm, delivery_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-time">Heure de livraison</label>
                  <input
                    id="edit-time"
                    type="time"
                    required
                    value={editForm.delivery_time}
                    onChange={e => setEditForm({ ...editForm, delivery_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="action-bar mt-2">
                <button type="submit" className="btn btn-primary" disabled={editSubmitting}>
                  {editSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => { setEditing(false); setEditError(''); }}>
                  Annuler
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {order.status_history && order.status_history.length > 0 && (
        <section className="mt-6">
          <h2>Suivi de commande</h2>
          <div className="timeline">
            {order.status_history.map((sh, i) => (
              <div className="timeline-item" key={i}>
                <div className="timeline-status">{STATUS_LABELS[sh.status]}</div>
                <div className="timeline-date">
                  {new Date(sh.created_at).toLocaleString('fr-FR')}
                  {sh.changed_by_name && ` - par ${sh.changed_by_name}`}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {order.status === 'terminee' && !order.review && user.role === 'user' && (
        <section className="mt-6">
          <h2>Donnez votre avis</h2>
          {reviewError && <div className="alert alert-error">{reviewError}</div>}
          {reviewSuccess && <div className="alert alert-success">{reviewSuccess}</div>}
          {!reviewSuccess && (
            <form onSubmit={submitReview} className="card card-padded mt-3">
              <div className="form-group">
                <label htmlFor="review-rating">Note</label>
                <select id="review-rating" value={reviewForm.rating} onChange={e => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })}>
                  {[5, 4, 3, 2, 1].map(n => (
                    <option key={n} value={n}>{'★'.repeat(n)}{'☆'.repeat(5 - n)} ({n}/5)</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="review-comment">Commentaire</label>
                <textarea id="review-comment" value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Partagez votre expérience..." />
              </div>
              <button type="submit" className="btn btn-primary">Envoyer mon avis</button>
            </form>
          )}
        </section>
      )}

      {order.review && (
        <div className="review-card mt-5">
          <div className="review-header">
            <span className="review-author">Mon avis</span>
            <span className="stars">{'★'.repeat(order.review.rating)}{'☆'.repeat(5 - order.review.rating)}</span>
          </div>
          <p>{order.review.comment}</p>
          <span className={`badge badge-${order.review.status === 'approved' ? 'green' : order.review.status === 'rejected' ? 'red' : 'orange'}`}>
            {order.review.status === 'approved' ? 'Approuvé' : order.review.status === 'rejected' ? 'Refusé' : 'En attente'}
          </span>
        </div>
      )}
    </div>
  );
}

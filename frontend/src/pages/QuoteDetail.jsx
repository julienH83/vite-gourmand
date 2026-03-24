import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const QUOTE_STATUS_LABELS = {
  draft:                 'Brouillon',
  sent:                  'Devis envoyé',
  accepted:              'Accepté',
  acompte_paye:          'Acompte réglé',
  converti_en_commande:  'Converti en commande',
  expire:                'Expiré',
  refuse:                'Refusé',
};

const UNIT_LABELS = {
  par_personne: '/ personne',
  forfait:      'forfait',
  par_heure:    '/ heure',
};

function statusBadgeColor(status) {
  if (['accepted', 'acompte_paye', 'converti_en_commande'].includes(status)) return 'green';
  if (['expire', 'refuse'].includes(status)) return 'red';
  return 'orange';
}

export default function QuoteDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [depositRef, setDepositRef] = useState('');
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(
    location.state?.created
      ? 'Votre demande de devis a été enregistrée avec succès. Notre équipe vous contactera sous 48h.'
      : ''
  );

  const fetchQuote = () => {
    setLoading(true);
    api.get(`/quotes/${id}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Impossible de charger le devis.');
        return data;
      })
      .then(data => {
        setError('');
        setQuote(data);
      })
      .catch((e) => setError(e.message || 'Impossible de charger le devis.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchQuote(); }, [id]);

  const doAction = async (action, body = {}) => {
    setActionError('');
    setActionLoading(true);
    try {
      const res = await api.post(`/quotes/${id}/${action}`, body);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action impossible.');

      if (action === 'convert') {
        setSuccessMsg('La commande a été créée avec succès.');
        navigate('/dashboard', { replace: true });
        return;
      }

      setSuccessMsg(
        action === 'accept' ? 'Devis accepté.' :
        action === 'refuse' ? 'Devis refusé.' :
        action === 'deposit' ? 'Acompte enregistré.' :
        action === 'send' ? 'Devis envoyé au client.' :
        'Action effectuée.'
      );

      setShowDepositForm(false);
      setDepositRef('');
      fetchQuote();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  if (error) return (
    <div className="container">
      <div className="alert alert-error">{error}</div>
      <Link to="/dashboard">&larr; Retour au tableau de bord</Link>
    </div>
  );

  if (!quote) return null;

  const isUser = user.role === 'user';
  const isStaff = user.role === 'employee' || user.role === 'admin';
  const guestCount = quote.guest_count;

  // Badge “instructions envoyées”
  const instructionsSent = Boolean(quote.deposit_instructions_sent_at);

  return (
    <div className="auth-page auth-page--xl">
      <Link to="/dashboard">&larr; Retour au tableau de bord</Link>

      <div className="flex-between flex-wrap flex-gap-sm mt-4">
        <h1>Devis #{quote.id.slice(0, 8)}</h1>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`badge badge-${statusBadgeColor(quote.status)}`}>
            {isUser && quote.status === 'draft'
              ? 'En attente de validation'
              : QUOTE_STATUS_LABELS[quote.status]}
          </span>

          {['accepted', 'acompte_paye', 'converti_en_commande'].includes(quote.status) && (
            <span className={`badge ${instructionsSent ? 'badge-success' : 'badge-warning'}`}>
              {instructionsSent ? 'Instructions envoyées' : 'Instructions non envoyées'}
            </span>
          )}
        </div>
      </div>

      {successMsg && <div className="alert alert-success mt-3">{successMsg}</div>}
      {actionError && <div className="alert alert-error mt-3">{actionError}</div>}

      {/* ── Détails de l'événement ── */}
      <div className="card card-padded mt-4">
        <h2 className="card-heading">Événement</h2>
        <div className="form-row mb-2">
          <div><strong>Type :</strong> {quote.event_type}</div>
          <div><strong>Personnes :</strong> {guestCount}</div>
        </div>
        <div className="form-row mb-2">
          <div><strong>Date :</strong> {new Date(quote.event_date).toLocaleDateString('fr-FR')}</div>
          {quote.event_time && <div><strong>Heure :</strong> {quote.event_time?.slice(0, 5)}</div>}
        </div>
        <div className="mb-2">
          <strong>Adresse :</strong> {quote.event_address}, {quote.event_city}
        </div>

        {quote.dietary_notes && (
          <div className="mb-2">
            <strong>Régimes / Allergènes :</strong> {quote.dietary_notes}
          </div>
        )}

        {quote.client_message && (
          <div className="mb-2">
            <strong>Message :</strong> {quote.client_message}
          </div>
        )}

        {quote.valid_until && quote.status === 'sent' && (
          <div className="mt-2">
            <strong>Valable jusqu'au :</strong>{' '}
            <span style={{ color: new Date(quote.valid_until) < new Date() ? 'var(--color-danger)' : 'inherit' }}>
              {new Date(quote.valid_until).toLocaleDateString('fr-FR')}
            </span>
          </div>
        )}

        {isStaff && quote.user_first_name && (
          <div className="mt-2">
            <strong>Client :</strong> {quote.user_first_name} {quote.user_last_name} — {quote.user_email}
            {quote.user_phone && ` — ${quote.user_phone}`}
          </div>
        )}
      </div>

      {/* ── Prestations ── */}
      {quote.items && quote.items.length > 0 && (
        <div className="card card-padded mt-4">
          <h2 className="card-heading">Prestations</h2>
          <table className="quote-table">
            <thead>
              <tr>
                <th>Prestation</th>
                <th>Détail</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.label}</td>
                  <td className="quote-table__detail">
                    {Number(item.unit_price).toFixed(2)} € {UNIT_LABELS[item.unit]}
                    {item.unit === 'par_personne' && ` × ${guestCount} pers.`}
                    {item.unit !== 'par_personne' && item.quantity > 1 && ` × ${item.quantity}`}
                  </td>
                  <td className="quote-table__amount">
                    {Number(item.line_total).toFixed(2)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="price-summary mt-4">
            <div className="price-line">
              <span>Sous-total</span>
              <span>{Number(quote.subtotal).toFixed(2)} €</span>
            </div>

            {Number(quote.discount_amount) > 0 && (
              <div className="price-line discount">
                <span>Remise ({Number(quote.discount_pct).toFixed(0)} %)</span>
                <span>-{Number(quote.discount_amount).toFixed(2)} €</span>
              </div>
            )}

            <div className="price-line total">
              <span>Total</span>
              <span>{Number(quote.total).toFixed(2)} €</span>
            </div>

            <div className="price-line text-muted text-sm">
              <span>Acompte (30 %)</span>
              <span>{Number(quote.deposit_amount).toFixed(2)} €</span>
            </div>
          </div>

          {quote.deposit_ref && (
            <div className="mt-2 text-sm text-muted">
              Réf. paiement acompte : <strong>{quote.deposit_ref}</strong>
            </div>
          )}
        </div>
      )}

      {/* ── Actions staff ── */}
      {isStaff && (
        <div className="card card-padded mt-4">
          <h2 className="card-heading--sm">Actions</h2>

          <div className="action-bar action-bar--lg">
            {quote.status === 'draft' && (
              <button
                className="btn btn-primary"
                onClick={() => doAction('send')}
                disabled={actionLoading}
              >
                Envoyer au client
              </button>
            )}

            {quote.status === 'accepted' && !instructionsSent && (
              <button
                className="btn btn-primary"
                onClick={() => { if (window.confirm('Envoyer les instructions de paiement au client ?')) doAction('send-deposit-instructions'); }}
                disabled={actionLoading}
              >
                Envoyer les instructions d'acompte
              </button>
            )}

            {quote.status === 'accepted' && !showDepositForm && (
              <button
                className="btn btn-primary"
                onClick={() => setShowDepositForm(true)}
                disabled={actionLoading || !instructionsSent}
                title={!instructionsSent ? 'Envoyez d\'abord les instructions de paiement.' : undefined}
              >
                Enregistrer l'acompte
              </button>
            )}

            {quote.status === 'accepted' && !instructionsSent && (
              <div className="text-sm text-muted" style={{ marginTop: 10 }}>
                Les instructions de paiement doivent être envoyées avant de pouvoir valider l'acompte.
              </div>
            )}

            {quote.status === 'acompte_paye' && (
              <button
                className="btn btn-primary"
                onClick={() => { if (window.confirm('Convertir ce devis en commande ?')) doAction('convert'); }}
                disabled={actionLoading}
              >
                Convertir en commande
              </button>
            )}

            {['draft', 'sent', 'accepted'].includes(quote.status) && (
              <button
                className="btn btn-danger"
                onClick={() => { if (window.confirm('Refuser ce devis ?')) doAction('refuse'); }}
                disabled={actionLoading}
              >
                Refuser
              </button>
            )}
          </div>

          {showDepositForm && (
            <div className="deposit-form">
              <div className="form-group">
                <label htmlFor="deposit-ref">Référence de paiement *</label>
                <input
                  id="deposit-ref"
                  type="text"
                  value={depositRef}
                  onChange={e => setDepositRef(e.target.value)}
                  placeholder="Ex: VIR-2024-001 / CHQ-12345"
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={() => doAction('deposit', { deposit_ref: depositRef })}
                disabled={actionLoading || !depositRef.trim()}
              >
                Confirmer
              </button>

              <button
                className="btn btn-outline"
                onClick={() => { setShowDepositForm(false); setDepositRef(''); }}
                disabled={actionLoading}
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Actions client ── */}
      {isUser && quote.status === 'sent' && (
        <div className="card card-padded mt-4">
          <h2 className="card-heading--sm">Votre décision</h2>
          {quote.valid_until && (
            <p className="text-sm text-muted mb-3">
              Ce devis est valable jusqu'au{' '}
              <strong style={{ color: new Date(quote.valid_until) < new Date() ? 'var(--color-danger)' : 'inherit' }}>
                {new Date(quote.valid_until).toLocaleDateString('fr-FR')}
              </strong>.
            </p>
          )}
          <div className="action-bar">
            <button
              className="btn btn-primary"
              onClick={() => { if (window.confirm('Accepter ce devis ? Notre équipe vous enverra les instructions de paiement.')) doAction('accept'); }}
              disabled={actionLoading}
            >
              Accepter le devis
            </button>
            <button
              className="btn btn-danger"
              onClick={() => { if (window.confirm('Refuser ce devis ? Cette action est irréversible.')) doAction('refuse'); }}
              disabled={actionLoading}
            >
              Refuser
            </button>
          </div>
        </div>
      )}

      {/* ── Historique ── */}
      {quote.status_history && quote.status_history.length > 0 && (
        <section className="mt-6">
          <h2>Historique</h2>
          <div className="timeline">
            {quote.status_history.map((sh, i) => (
              <div className="timeline-item" key={i}>
                <div className="timeline-status">
                  {QUOTE_STATUS_LABELS[sh.status] || sh.status}
                </div>
                <div className="timeline-date">
                  {new Date(sh.created_at).toLocaleString('fr-FR')}
                  {sh.changed_by_name && ` — par ${sh.changed_by_name}`}
                </div>
                {sh.note && (
                  <div className="text-sm text-muted mt-1">
                    {sh.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import OrderDetail from './OrderDetail';
import Seo from '../../components/Seo';
import QuoteDetail from '../QuoteDetail';

const STATUS_LABELS = {
  deposit_pending: 'Acompte en attente',
  confirmed: 'Confirmée',
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  en_preparation: 'En préparation',
  en_livraison: 'En livraison',
  livree: 'Livrée',
  attente_retour_materiel: 'Retour matériel',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

const QUOTE_STATUS_LABELS = {
  draft:                'Brouillon',
  sent:                 'Devis envoyé',
  accepted:             'Accepté',
  acompte_paye:         'Acompte réglé',
  converti_en_commande: 'Converti en commande',
  expire:               'Expiré',
  refuse:               'Refusé',
};

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/orders')
      .then(r => r.json())
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cancelOrder = async (id) => {
    if (!confirm('Annuler cette commande ?')) return;
    await api.post(`/orders/${id}/cancel`);
    setOrders(orders.map(o => o.id === id ? { ...o, status: 'annulee' } : o));
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <h2>Mes commandes</h2>
      {orders.length === 0 ? (
        <div className="dashboard-empty">
          <p>Aucune commande pour le moment.</p>
          <button className="btn btn-outline" onClick={() => navigate('/menus')}>Voir nos menus</button>
        </div>
      ) : (
        <div className="table-container mt-4">
          <table>
            <thead>
              <tr>
                <th scope="col">Commande</th>
                <th scope="col">Menu</th>
                <th scope="col">Date</th>
                <th scope="col">Total</th>
                <th scope="col">Statut</th>
                <th scope="col">Paiement</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id.slice(0, 8)}</td>
                  <td>{order.menu_title}</td>
                  <td>{new Date(order.delivery_date).toLocaleDateString('fr-FR')}</td>
                  <td>{Number(order.total_price).toFixed(2)} €</td>
                  <td><span className={`status-${order.status}`}>{STATUS_LABELS[order.status]}</span></td>
                  <td>
                    <span className={`badge badge-${order.payment_status === 'paye' ? 'green' : order.payment_status === 'acompte_paye' ? 'orange' : 'red'}`}>
                      {order.payment_status === 'paye' ? 'Payé' : order.payment_status === 'acompte_paye' ? 'Acompte reçu' : 'Non payé'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-outline btn-small" onClick={() => navigate(`/dashboard/orders/${order.id}`)}>
                      Détail
                    </button>
                    {order.status === 'en_attente' && (
                      <button className="btn btn-danger btn-small ml-1" onClick={() => cancelOrder(order.id)}>
                        Annuler
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MyQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/quotes')
      .then(r => r.json())
      .then(data => setQuotes(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <div className="flex-between">
        <h2>Mes devis</h2>
        <button className="btn btn-primary btn-small" onClick={() => navigate('/request-quote')}>
          + Demander un devis
        </button>
      </div>

      {quotes.length === 0 ? (
        <div className="dashboard-empty">
          <p>Aucun devis pour le moment.</p>
          <button className="btn btn-outline" onClick={() => navigate('/request-quote')}>
            Demander un devis pour mon événement
          </button>
        </div>
      ) : (
        <div className="table-container mt-4">
          <table>
            <thead>
              <tr>
                <th scope="col">Devis</th>
                <th scope="col">Événement</th>
                <th scope="col">Date</th>
                <th scope="col">Total</th>
                <th scope="col">Statut</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(q => (
                <tr key={q.id}>
                  <td>#{q.id.slice(0, 8)}</td>
                  <td>{q.event_type}</td>
                  <td>{new Date(q.event_date).toLocaleDateString('fr-FR')}</td>
                  <td>{Number(q.total).toFixed(2)} €</td>
                  <td>
                    <span className={`badge badge-${['accepted','acompte_paye','converti_en_commande'].includes(q.status) ? 'green' : ['expire','refuse'].includes(q.status) ? 'red' : 'orange'}`}>
                      {QUOTE_STATUS_LABELS[q.status]}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-outline btn-small"
                      onClick={() => navigate(`/dashboard/quotes/${q.id}`)}
                    >
                      Détail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{10,}$/;

function PasswordChangeForm() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!PASSWORD_REGEX.test(form.new_password)) {
      setError('Le nouveau mot de passe doit contenir au moins 10 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.');
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.put('/users/password', {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors du changement.');
      setSuccess('Mot de passe mis à jour.');
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="pwd-section-title" className="rgpd-section">
      <h3 id="pwd-section-title" className="card-heading--sm">Changer mon mot de passe</h3>
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit} className="dashboard-form">
        <div className="form-group">
          <label htmlFor="pwd-current">Mot de passe actuel</label>
          <input
            id="pwd-current"
            type="password"
            value={form.current_password}
            onChange={e => setForm({ ...form, current_password: e.target.value })}
            autoComplete="current-password"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="pwd-new">Nouveau mot de passe</label>
          <input
            id="pwd-new"
            type="password"
            value={form.new_password}
            onChange={e => setForm({ ...form, new_password: e.target.value })}
            autoComplete="new-password"
            required
          />
          <small className="rgpd-section__hint">
            10 caractères min., majuscule, minuscule, chiffre et caractère spécial.
          </small>
        </div>
        <div className="form-group">
          <label htmlFor="pwd-confirm">Confirmer le nouveau mot de passe</label>
          <input
            id="pwd-confirm"
            type="password"
            value={form.confirm_password}
            onChange={e => setForm({ ...form, confirm_password: e.target.value })}
            autoComplete="new-password"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Mise à jour...' : 'Changer le mot de passe'}
        </button>
      </form>
    </section>
  );
}

function MyProfile() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone,
    address: user.address,
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await updateProfile(form);
      setSuccess('Profil mis à jour.');
    } catch (err) {
      setError(err.message);
    }
  };

  // RGPD — Droit à la portabilité (art.20)
  const handleExport = async () => {
    setExportLoading(true);
    setError('');
    try {
      const res = await api.get('/users/export');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de l\'export.');
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mes-donnees-vite-gourmand-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setExportLoading(false);
    }
  };

  // RGPD — Droit à l'effacement (art.17) — anonymisation
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir supprimer votre compte ?\n\n' +
      'Cette action est irréversible. Vos données personnelles seront anonymisées ' +
      'conformément au RGPD. Vos commandes seront conservées pour nos obligations légales.\n\n' +
      'Cliquez OK pour confirmer.'
    );
    if (!confirmed) return;

    setDeleteLoading(true);
    setError('');
    try {
      const res = await api.delete('/users/account');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la suppression.');
      }
      logout();
      navigate('/');
    } catch (err) {
      setError(err.message);
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <h2>Mon profil</h2>
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="dashboard-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="profile-fn">Prénom</label>
            <input id="profile-fn" type="text" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="profile-ln">Nom</label>
            <input id="profile-ln" type="text" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="profile-phone">Téléphone</label>
          <input id="profile-phone" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor="profile-address">Adresse</label>
          <input id="profile-address" type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={user.email} disabled />
        </div>
        <button type="submit" className="btn btn-primary">Mettre à jour</button>
      </form>

      {/* ── Changement de mot de passe ───────────────────── */}
      <PasswordChangeForm />

      {/* ── Section RGPD ────────────────────────────────── */}
      <section aria-labelledby="rgpd-section-title" className="rgpd-section">
        <h3 id="rgpd-section-title" className="card-heading--sm">
          Mes droits RGPD
        </h3>
        <p className="section-subtitle">
          Conformément au Règlement Général sur la Protection des Données (RGPD),
          vous pouvez exporter ou supprimer vos données personnelles à tout moment.
        </p>

        {/* Droit à la portabilité */}
        <div className="mb-3">
          <button
            type="button"
            className="btn btn-outline w-full"
            onClick={handleExport}
            disabled={exportLoading}
            aria-busy={exportLoading}
          >
            {exportLoading ? 'Export en cours...' : 'Télécharger mes données (RGPD)'}
          </button>
          <small className="rgpd-section__hint">
            Télécharge un fichier JSON avec votre profil, commandes et avis.
          </small>
        </div>

        {/* Droit à l'effacement */}
        <div>
          <button
            type="button"
            className="btn btn-danger w-full"
            onClick={handleDeleteAccount}
            disabled={deleteLoading}
            aria-busy={deleteLoading}
          >
            {deleteLoading ? 'Suppression...' : 'Supprimer / anonymiser mon compte (RGPD)'}
          </button>
          <small className="rgpd-section__hint">
            Action irréversible. Impossible si vous avez des commandes en cours.
          </small>
        </div>
      </section>
    </div>
  );
}

function DashboardSummary() {
  const [counts, setCounts] = useState({ orders: 0, quotes: 0, pending: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/orders').then(r => r.json()),
      api.get('/quotes').then(r => r.json()),
    ]).then(([orders, quotesRes]) => {
      const quotes = quotesRes.data || [];
      const pendingOrders = orders.filter(o => o.status === 'en_attente').length;
      const pendingQuotes = quotes.filter(q => q.status === 'draft' || q.status === 'sent').length;
      setCounts({ orders: orders.length, quotes: quotes.length, pending: pendingOrders + pendingQuotes });
    }).catch(() => {});
  }, []);

  return (
    <div className="dashboard-summary">
      <div className="dashboard-summary__card">
        <div className="dashboard-summary__icon dashboard-summary__icon--orders" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        </div>
        <div>
          <div className="dashboard-summary__value">{counts.orders}</div>
          <div className="dashboard-summary__label">Commandes</div>
        </div>
      </div>
      <div className="dashboard-summary__card">
        <div className="dashboard-summary__icon dashboard-summary__icon--quotes" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        <div>
          <div className="dashboard-summary__value">{counts.quotes}</div>
          <div className="dashboard-summary__label">Devis</div>
        </div>
      </div>
      <div className="dashboard-summary__card">
        <div className="dashboard-summary__icon dashboard-summary__icon--pending" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div>
          <div className="dashboard-summary__value">{counts.pending}</div>
          <div className="dashboard-summary__label">En attente</div>
        </div>
      </div>
    </div>
  );
}

// Mes messages de contact
function MyMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/contact/mine').then(r => r.json()).then(setMessages).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <h2>Mes messages</h2>
      {messages.length === 0 ? (
        <p className="mt-4 text-muted">Vous n'avez envoyé aucun message. Utilisez la <a href="/contact">page de contact</a> pour nous écrire.</p>
      ) : (
        <div className="grid grid-1 mt-4" style={{ gap: '1rem' }}>
          {messages.map(m => (
            <div key={m.id} className="card" style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => navigate(`/dashboard/messages/${m.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>{m.title}</h3>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {Number(m.reply_count) > 0 && <span className="badge badge-success">{m.reply_count} réponse{Number(m.reply_count) > 1 ? 's' : ''}</span>}
                  <small className="text-muted">{new Date(m.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</small>
                </div>
              </div>
              <p className="text-muted" style={{ margin: '0.5rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMessageDetail() {
  const { id } = useParams();
  const [message, setMessage] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMessage = useCallback(() => {
    api.get(`/contact/${id}`).then(r => r.json()).then(setMessage).catch(() => navigate('/dashboard/messages')).finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => { fetchMessage(); }, [fetchMessage]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setSending(true);
    try {
      await api.post(`/contact/${id}/reply`, { content: replyContent });
      setReplyContent('');
      fetchMessage();
    } catch { /* ignore */ }
    setSending(false);
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (!message) return null;

  return (
    <div>
      <button className="btn btn-outline btn-small" onClick={() => navigate('/dashboard/messages')} style={{ marginBottom: '1rem' }}>← Retour à mes messages</button>
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>{message.title}</h2>
        <p className="text-muted" style={{ margin: '0.5rem 0' }}>
          Envoyé le {new Date(message.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: 'var(--radius)', whiteSpace: 'pre-wrap' }}>
          {message.description}
        </div>
      </div>

      {message.replies?.length > 0 && (
        <>
          <h3>Conversation ({message.replies.length} réponse{message.replies.length > 1 ? 's' : ''})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {message.replies.map(r => (
              <div key={r.id} style={{
                padding: '1rem',
                borderRadius: 'var(--radius)',
                background: r.role === 'client' ? 'var(--color-bg)' : '#e8f4e8',
                borderLeft: `4px solid ${r.role === 'client' ? 'var(--color-accent)' : '#4caf50'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>{r.role === 'client' ? 'Vous' : `${r.first_name} (Équipe Vite & Gourmand)`}</strong>
                  <small className="text-muted">{new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
                </div>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{r.content}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <form onSubmit={handleReply} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h3>Répondre</h3>
        <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="Votre message..." rows={4} required className="form-input" style={{ resize: 'vertical' }} />
        <div>
          <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? 'Envoi...' : 'Envoyer'}</button>
        </div>
      </form>
    </div>
  );
}

export default function UserDashboard() {
  return (
    <div className="dashboard">
      <Seo title="Mon espace" description="Gérez vos commandes, devis et profil sur votre espace client Vite & Gourmand." />
      <aside className="dashboard-sidebar" role="navigation" aria-label="Menu utilisateur">
        <NavLink to="/dashboard" end>Mes commandes</NavLink>
        <NavLink to="/dashboard/quotes">Mes devis</NavLink>
        <NavLink to="/dashboard/messages">Mes messages</NavLink>
        <NavLink to="/dashboard/profile">Mon profil</NavLink>
      </aside>
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="dashboard-header__top">
            <h1>Mon espace</h1>
            <span className="dashboard-header__badge">Client</span>
          </div>
          <p>Commandes, devis & informations personnelles</p>
          <div className="dashboard-sep" />
        </div>
        <DashboardSummary />
        <Routes>
          <Route index element={<MyOrders />} />
          <Route path="quotes" element={<MyQuotes />} />
          <Route path="quotes/:id" element={<QuoteDetail />} />
          <Route path="messages" element={<MyMessages />} />
          <Route path="messages/:id" element={<UserMessageDetail />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="orders/:id" element={<OrderDetail />} />
        </Routes>
      </div>
    </div>
  );
}

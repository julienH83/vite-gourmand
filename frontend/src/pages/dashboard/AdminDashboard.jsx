import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import OrderDetail from './OrderDetail';
import QuoteDetail from '../QuoteDetail';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const STATUS_LABELS = {
  deposit_pending: 'Acompte en attente', confirmed: 'Confirmée',
  en_attente: 'En attente', acceptee: 'Acceptée', en_preparation: 'En préparation',
  en_livraison: 'En cours de livraison', livree: 'Livrée', attente_retour_materiel: 'En attente du retour de matériel',
  terminee: 'Terminée', annulee: 'Annulée',
};
const ALLOWED_TRANSITIONS = {
  deposit_pending: ['confirmed', 'annulee'],
  confirmed: ['acceptee', 'annulee'],
  en_attente: ['acceptee', 'annulee'],
  acceptee: ['en_preparation', 'annulee'],
  en_preparation: ['en_livraison', 'annulee'],
  en_livraison: ['livree'],
  livree: ['attente_retour_materiel', 'terminee'],
  attente_retour_materiel: ['terminee'],
};

const QUOTE_STATUS_LABELS = {
  draft:                'Brouillon',
  sent:                 'Envoyé',
  accepted:             'Accepté',
  acompte_paye:         'Acompte réglé',
  converti_en_commande: 'Converti',
  expire:               'Expiré',
  refuse:               'Refusé',
};

const UNIT_LABELS = { par_personne: '/ personne', forfait: 'forfait', par_heure: '/ heure' };

function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [contactModal, setContactModal] = useState(null);

  const fetchOrders = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (clientFilter) params.set('user_id', clientFilter);
    api.get(`/orders?${params.toString()}`).then(r => r.json()).then(setOrders).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { api.get('/users/clients').then(r => r.json()).then(setClients).catch(() => {}); }, []);
  useEffect(() => { fetchOrders(); }, [statusFilter, clientFilter]);

  const updateStatus = async (orderId, status, contactData) => {
    const body = { status };
    if (contactData) { body.reason = contactData.reason; body.contact_method = contactData.contact_method; }
    await api.put(`/orders/${orderId}/status`, body);
    setContactModal(null);
    fetchOrders();
  };

  const handleStatusChange = (order, newStatus) => {
    if (newStatus === 'annulee') {
      setContactModal({ orderId: order.id, status: newStatus, reason: '', contact_method: 'email' });
    } else {
      updateStatus(order.id, newStatus);
    }
  };

  return (
    <div>
      <h2>Commandes</h2>
      <div className="filters-bar mt-4">
        <div className="form-group">
          <label htmlFor="adm-status">Statut</label>
          <select id="adm-status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Tous</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="adm-client">Client</label>
          <select id="adm-client" value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
            <option value="">Tous</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div className="loading">Chargement...</div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>#</th><th>Client</th><th>Menu</th><th>Date</th><th>Total</th><th>Statut</th><th>Action</th></tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td>{o.id.slice(0, 8)}</td>
                  <td>{o.first_name} {o.last_name}</td>
                  <td>{o.menu_title}</td>
                  <td>{new Date(o.delivery_date).toLocaleDateString('fr-FR')}</td>
                  <td>{Number(o.total_price).toFixed(2)} €</td>
                  <td><span className={`status-${o.status}`}>{STATUS_LABELS[o.status]}</span></td>
                  <td>
                    {ALLOWED_TRANSITIONS[o.status]?.length > 0 && (
                      <select onChange={e => { if (e.target.value) handleStatusChange(o, e.target.value); e.target.value = ''; }} defaultValue="" aria-label="Changer statut">
                        <option value="">Changer...</option>
                        {ALLOWED_TRANSITIONS[o.status].map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {contactModal && (
        <div className="modal-overlay" onClick={() => setContactModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Contact client requis</h2>
            <div className="form-group mt-4">
              <label htmlFor="adm-reason">Motif</label>
              <textarea id="adm-reason" required value={contactModal.reason} onChange={e => setContactModal({ ...contactModal, reason: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="adm-method">Mode de contact</label>
              <select id="adm-method" value={contactModal.contact_method} onChange={e => setContactModal({ ...contactModal, contact_method: e.target.value })}>
                <option value="email">Email</option>
                <option value="phone">Téléphone</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setContactModal(null)}>Annuler</button>
              <button className="btn btn-danger" disabled={!contactModal.reason} onClick={() => updateStatus(contactModal.orderId, contactModal.status, contactModal)}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuotesManagement() {
  const [quotes, setQuotes] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expireLoading, setExpireLoading] = useState(false);
  const [expireMsg, setExpireMsg] = useState('');
  const navigate = useNavigate();

  const fetchQuotes = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    api.get(`/quotes?${params.toString()}`)
      .then(r => r.json())
      .then(data => setQuotes(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchQuotes(); }, [statusFilter]);

  const triggerExpire = async () => {
    setExpireLoading(true);
    setExpireMsg('');
    try {
      const res = await api.post('/quotes/expire', {});
      const data = await res.json();
      setExpireMsg(`${data.expired} devis expirés.`);
      fetchQuotes();
    } catch {
      setExpireMsg('Erreur lors de l\'expiration.');
    } finally {
      setExpireLoading(false);
    }
  };

  return (
    <div>
      <div className="flex-between">
        <h2>Gestion des devis</h2>
        <button
          className="btn btn-outline btn-small"
          onClick={triggerExpire}
          disabled={expireLoading}
          title="Expirer les devis dont la date de validité est dépassée"
        >
          {expireLoading ? 'Traitement...' : 'Expirer les devis périmés'}
        </button>
      </div>
      {expireMsg && <div className="alert alert-success mt-2">{expireMsg}</div>}

      <div className="filters-bar mt-4">
        <div className="form-group">
          <label htmlFor="adm-quote-status">Statut</label>
          <select id="adm-quote-status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Tous</option>
            {Object.entries(QUOTE_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? <div className="loading">Chargement...</div> : (
        <div className="table-container mt-4">
          <table>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Client</th>
                <th scope="col">Événement</th>
                <th scope="col">Date</th>
                <th scope="col">Convives</th>
                <th scope="col">Total</th>
                <th scope="col">Statut</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-muted">Aucun devis.</td></tr>
              ) : quotes.map(q => (
                <tr key={q.id}>
                  <td>#{q.id.slice(0, 8)}</td>
                  <td>{q.user_first_name} {q.user_last_name}</td>
                  <td>{q.event_type}</td>
                  <td>{new Date(q.event_date).toLocaleDateString('fr-FR')}</td>
                  <td>{q.guest_count}</td>
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
                      Gérer
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

function QuoteOptionsManagement() {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpt, setEditOpt] = useState(null);
  const [form, setForm] = useState({ label: '', description: '', unit_price: '', unit: 'forfait' });
  const [error, setError] = useState('');

  const fetchOptions = () => {
    api.get('/quote-options?all=true')
      .then(r => r.json())
      .then(data => setOptions(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOptions(); }, []);

  const saveOption = async (e) => {
    e.preventDefault();
    setError('');
    const method = editOpt ? 'put' : 'post';
    const url = editOpt ? `/quote-options/${editOpt.id}` : '/quote-options';
    try {
      const res = await api[method](url, {
        ...form,
        unit_price: parseFloat(form.unit_price),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      fetchOptions();
      setEditOpt(null);
      setForm({ label: '', description: '', unit_price: '', unit: 'forfait' });
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (opt) => {
    setEditOpt(opt);
    setForm({
      label: opt.label,
      description: opt.description || '',
      unit_price: String(opt.unit_price),
      unit: opt.unit,
    });
  };

  const deleteOption = async (id) => {
    if (!confirm('Désactiver cette option ?')) return;
    await api.delete(`/quote-options/${id}`);
    fetchOptions();
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <h2>Options de devis</h2>
      {error && <div className="alert alert-error mt-2">{error}</div>}

      <form onSubmit={saveOption} className="card card-form">
        <h3 className="mb-3">{editOpt ? 'Modifier l\'option' : 'Nouvelle option'}</h3>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="opt-label">Libellé *</label>
            <input id="opt-label" required value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="opt-unit">Unité *</label>
            <select id="opt-unit" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
              <option value="par_personne">Par personne</option>
              <option value="forfait">Forfait</option>
              <option value="par_heure">Par heure</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="opt-price">Prix unitaire (€) *</label>
            <input id="opt-price" type="number" min="0" step="0.01" required value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="opt-desc">Description</label>
            <input id="opt-desc" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <div className="action-bar">
          <button type="submit" className="btn btn-primary">{editOpt ? 'Mettre à jour' : 'Ajouter'}</button>
          {editOpt && (
            <button type="button" className="btn btn-outline" onClick={() => { setEditOpt(null); setForm({ label: '', description: '', unit_price: '', unit: 'forfait' }); }}>
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="table-container">
        <table>
          <thead>
            <tr><th>Libellé</th><th>Description</th><th>Prix</th><th>Unité</th><th>Actif</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {options.map(opt => (
              <tr key={opt.id} style={{ opacity: opt.is_active ? 1 : 0.5 }}>
                <td>{opt.label}</td>
                <td>{opt.description || '—'}</td>
                <td>{Number(opt.unit_price).toFixed(2)} €</td>
                <td>{UNIT_LABELS[opt.unit]}</td>
                <td>
                  <span className={`badge badge-${opt.is_active ? 'green' : 'red'}`}>
                    {opt.is_active ? 'Oui' : 'Non'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-outline btn-small" onClick={() => startEdit(opt)}>Modifier</button>
                  {opt.is_active && (
                    <button className="btn btn-danger btn-small ml-1" onClick={() => deleteOption(opt.id)}>
                      Désactiver
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', email: '', address: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/users').then(r => r.json()).then(setUsers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const createEmployee = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/users/employee', form);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.errors?.join(', '));
      setSuccess('Compte employé créé avec succès.');
      setShowForm(false);
      setForm({ first_name: '', last_name: '', phone: '', email: '', address: '', password: '' });
      const updated = await api.get('/users').then(r => r.json());
      setUsers(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleStatus = async (id) => {
    await api.put(`/users/${id}/toggle-status`);
    const updated = await api.get('/users').then(r => r.json());
    setUsers(updated);
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <div className="flex-between">
        <h2>Gestion des utilisateurs</h2>
        <button className="btn btn-primary btn-small" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Fermer' : 'Créer un employé'}
        </button>
      </div>

      {success && <div className="alert alert-success mt-3">{success}</div>}
      {error && <div className="alert alert-error mt-3">{error}</div>}

      {showForm && (
        <form onSubmit={createEmployee} className="card card-padded mt-4">
          <h3>Nouveau compte employé</h3>
          <div className="form-row mt-3">
            <div className="form-group">
              <label htmlFor="emp-fn">Prénom</label>
              <input id="emp-fn" required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="emp-ln">Nom</label>
              <input id="emp-ln" required value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="emp-email">Email</label>
              <input id="emp-email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="emp-phone">Téléphone</label>
              <input id="emp-phone" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="emp-address">Adresse</label>
            <input id="emp-address" required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="emp-pw">Mot de passe</label>
            <input id="emp-pw" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            <small className={`password-hint${/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{10,}$/.test(form.password) ? ' password-hint--valid' : ''}`}>
              Min. 10 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
            </small>
          </div>
          <button type="submit" className="btn btn-primary">Créer le compte</button>
        </form>
      )}

      <div className="table-container mt-5">
        <table>
          <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.first_name} {u.last_name}</td>
                <td>{u.email}</td>
                <td><span className="badge badge-blue">{u.role}</span></td>
                <td><span className={`badge badge-${u.status === 'active' ? 'green' : 'red'}`}>{u.status}</span></td>
                <td>
                  {u.role !== 'admin' && (
                    <button className={`btn btn-small ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleStatus(u.id)}>
                      {u.status === 'active' ? 'Désactiver' : 'Activer'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalyticsDashboard() {
  const [ordersByMenu, setOrdersByMenu] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [trends, setTrends] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);

    Promise.all([
      api.get(`/analytics/orders-by-menu?${params.toString()}`).then(r => r.json()),
      api.get(`/analytics/revenue?${params.toString()}`).then(r => r.json()),
      api.get('/analytics/trends').then(r => r.json()),
    ]).then(([obm, rev, trd]) => {
      setOrdersByMenu(obm);
      setRevenue(rev);
      setTrends(Array.isArray(trd) ? trd : []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [dateFrom, dateTo]);

  const totalRevenue = ordersByMenu.reduce((sum, m) => sum + m.total_revenue, 0);
  const totalOrders = ordersByMenu.reduce((sum, m) => sum + m.total_orders, 0);

  const barData = {
    labels: ordersByMenu.map(m => m.menu_title),
    datasets: [{ label: 'Nombre de commandes', data: ordersByMenu.map(m => m.total_orders), backgroundColor: '#E67E22' }],
  };

  const pieData = {
    labels: ordersByMenu.map(m => m.menu_title),
    datasets: [{ data: ordersByMenu.map(m => m.total_revenue), backgroundColor: ['#E67E22', '#27AE60', '#2980B9', '#8E44AD', '#E74C3C', '#F39C12'] }],
  };

  const revenueData = {
    labels: revenue.map(r => `${r._id.month}/${r._id.year}`),
    datasets: [{ label: 'Chiffre d\'affaires (€)', data: revenue.map(r => r.total_revenue), backgroundColor: '#27AE60' }],
  };

  return (
    <div>
      <h2>Analytics</h2>

      <div className="filters-bar mt-4">
        <div className="form-group">
          <label htmlFor="ana-from">Date début</label>
          <input id="ana-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="ana-to">Date fin</label>
          <input id="ana-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <button className="btn btn-outline btn-small" onClick={() => { setDateFrom(''); setDateTo(''); }}>Réinitialiser</button>
      </div>

      {loading ? <div className="loading">Chargement...</div> : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{totalOrders}</div>
              <div className="stat-label">Commandes totales</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalRevenue.toFixed(0)} €</div>
              <div className="stat-label">Chiffre d'affaires</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{ordersByMenu.length}</div>
              <div className="stat-label">Menus actifs</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : 0} €</div>
              <div className="stat-label">Panier moyen</div>
            </div>
          </div>

          <div className="chart-grid">
            <div className="card card-padded">
              <h3>Commandes par menu</h3>
              <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
            <div className="card card-padded">
              <h3>CA par menu</h3>
              <Pie data={pieData} options={{ responsive: true }} />
            </div>
          </div>

          {revenue.length > 0 && (
            <div className="card card-padded mt-5">
              <h3>CA par mois</h3>
              <Bar data={revenueData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
          )}

          <div className="table-container mt-5">
            <table>
              <thead><tr><th>Menu</th><th>Commandes</th><th>CA total</th><th>CA menu</th><th>Livraison</th><th>Remises</th><th>Moy. pers.</th></tr></thead>
              <tbody>
                {ordersByMenu.map(m => (
                  <tr key={m._id}>
                    <td>{m.menu_title}</td>
                    <td>{m.total_orders}</td>
                    <td>{m.total_revenue.toFixed(2)} €</td>
                    <td>{m.total_menu_revenue.toFixed(2)} €</td>
                    <td>{m.total_delivery_revenue.toFixed(2)} €</td>
                    <td>{m.total_discount.toFixed(2)} €</td>
                    <td>{m.avg_persons.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {trends.length > 0 && (
            <div className="card card-padded mt-5">
              <h3>Tendances — 30 derniers jours vs 30 jours précédents</h3>
              <div className="table-container mt-3">
                <table>
                  <thead>
                    <tr>
                      <th>Menu</th>
                      <th>J-30 (actuel)</th>
                      <th>J-60 (préc.)</th>
                      <th>Δ commandes</th>
                      <th>Évolution</th>
                      <th>CA (30j)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.map(t => (
                      <tr key={t.menu_id}>
                        <td>{t.menu_title}</td>
                        <td>{t.current}</td>
                        <td>{t.previous}</td>
                        <td style={{ fontWeight: 600, color: t.trend === 'up' ? 'var(--color-success)' : t.trend === 'down' ? 'var(--color-danger)' : 'inherit' }}>
                          {t.delta > 0 ? '+' : ''}{t.delta}
                        </td>
                        <td>
                          {t.trend === 'up'   && <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>▲ {t.delta_pct !== null ? `+${t.delta_pct}%` : 'nouveau'}</span>}
                          {t.trend === 'down' && <span style={{ color: 'var(--color-danger)',  fontWeight: 700 }}>▼ {t.delta_pct !== null ? `${t.delta_pct}%`  : ''}</span>}
                          {t.trend === 'stable' && <span className="text-muted">= stable</span>}
                        </td>
                        <td>{Number(t.revenue).toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReviewsManagement() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reviews/pending').then(r => r.json()).then(setReviews).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleValidate = async (id, status) => {
    await api.put(`/reviews/${id}/validate`, { status });
    setReviews(reviews.filter(r => r.id !== id));
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <h2>Avis en attente</h2>
      {reviews.length === 0 ? (
        <p className="mt-4 text-muted">Aucun avis en attente.</p>
      ) : (
        <div className="grid grid-2 mt-4">
          {reviews.map(r => (
            <div className="review-card" key={r.id}>
              <div className="review-header">
                <span className="review-author">{r.first_name} {r.last_name}</span>
                <span className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              </div>
              <p className="card-text">{r.comment}</p>
              <small className="text-muted">Menu : {r.menu_title}</small>
              <div className="action-bar mt-3">
                <button className="btn btn-success btn-small" onClick={() => handleValidate(r.id, 'approved')}>Approuver</button>
                <button className="btn btn-danger btn-small" onClick={() => handleValidate(r.id, 'rejected')}>Refuser</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Gestion des menus
function MenusManagement() {
  const [menus, setMenus] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMenu, setEditMenu] = useState(null);
  const [menuForm, setMenuForm] = useState({ title: '', description: '', theme: '', diet: 'standard', min_persons: 6, min_price: 30, stock: 50, conditions: '', dish_ids: [] });

  useEffect(() => {
    Promise.all([
      api.get('/menus').then(r => r.json()),
      api.get('/dishes').then(r => r.json()),
    ]).then(([m, d]) => { setMenus(m); setDishes(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const saveMenu = async (e) => {
    e.preventDefault();
    const method = editMenu ? 'put' : 'post';
    const url = editMenu ? `/menus/${editMenu.id}` : '/menus';
    const res = await api[method](url, menuForm);
    if (res.ok) {
      const updated = await api.get('/menus').then(r => r.json());
      setMenus(updated);
      setEditMenu(null);
      setMenuForm({ title: '', description: '', theme: '', diet: 'standard', min_persons: 6, min_price: 30, stock: 50, conditions: '', dish_ids: [] });
    }
  };

  const startEdit = (menu) => {
    setEditMenu(menu);
    setMenuForm({
      title: menu.title, description: menu.description, theme: menu.theme, diet: menu.diet,
      min_persons: menu.min_persons, min_price: menu.min_price, stock: menu.stock,
      conditions: menu.conditions || '', dish_ids: (menu.dishes || []).map(d => d.id),
    });
  };

  const deleteMenu = async (id) => {
    if (!confirm('Désactiver ce menu ?')) return;
    await api.delete(`/menus/${id}`);
    setMenus(menus.filter(m => m.id !== id));
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <h2>{editMenu ? 'Modifier le menu' : 'Gestion des menus'}</h2>
      <form onSubmit={saveMenu} className="card card-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="adm-menu-title">Titre</label>
            <input id="adm-menu-title" required value={menuForm.title} onChange={e => setMenuForm({ ...menuForm, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="adm-menu-theme">Thème</label>
            <input id="adm-menu-theme" required value={menuForm.theme} onChange={e => setMenuForm({ ...menuForm, theme: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="adm-menu-desc">Description</label>
          <textarea id="adm-menu-desc" required value={menuForm.description} onChange={e => setMenuForm({ ...menuForm, description: e.target.value })} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="adm-menu-diet">Régime</label>
            <select id="adm-menu-diet" value={menuForm.diet} onChange={e => setMenuForm({ ...menuForm, diet: e.target.value })}>
              <option value="standard">Standard</option>
              <option value="vegetarien">Végétarien</option>
              <option value="vegan">Vegan</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="adm-menu-minpers">Min. personnes</label>
            <input id="adm-menu-minpers" type="number" min="1" value={menuForm.min_persons} onChange={e => setMenuForm({ ...menuForm, min_persons: parseInt(e.target.value) })} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="adm-menu-price">Prix/pers. (€)</label>
            <input id="adm-menu-price" type="number" min="0" step="0.01" value={menuForm.min_price} onChange={e => setMenuForm({ ...menuForm, min_price: parseFloat(e.target.value) })} />
          </div>
          <div className="form-group">
            <label htmlFor="adm-menu-stock">Stock</label>
            <input id="adm-menu-stock" type="number" min="0" value={menuForm.stock} onChange={e => setMenuForm({ ...menuForm, stock: parseInt(e.target.value) })} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="adm-menu-conditions">Conditions</label>
          <textarea id="adm-menu-conditions" value={menuForm.conditions} onChange={e => setMenuForm({ ...menuForm, conditions: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Plats</label>
          <div className="checkbox-grid">
            {dishes.map(d => (
              <label key={d.id}>
                <input
                  type="checkbox"
                  checked={menuForm.dish_ids.includes(d.id)}
                  onChange={e => {
                    const ids = e.target.checked
                      ? [...menuForm.dish_ids, d.id]
                      : menuForm.dish_ids.filter(id => id !== d.id);
                    setMenuForm({ ...menuForm, dish_ids: ids });
                  }}
                />
                {d.name} ({d.type})
              </label>
            ))}
          </div>
        </div>
        <div className="action-bar">
          <button type="submit" className="btn btn-primary">{editMenu ? 'Mettre à jour' : 'Créer le menu'}</button>
          {editMenu && <button type="button" className="btn btn-outline" onClick={() => { setEditMenu(null); setMenuForm({ title: '', description: '', theme: '', diet: 'standard', min_persons: 6, min_price: 30, stock: 50, conditions: '', dish_ids: [] }); }}>Annuler</button>}
        </div>
      </form>
      <div className="table-container">
        <table>
          <thead><tr><th>Titre</th><th>Thème</th><th>Régime</th><th>Prix</th><th>Stock</th><th>Actions</th></tr></thead>
          <tbody>
            {menus.map(m => (
              <tr key={m.id}>
                <td>{m.title}</td><td>{m.theme}</td><td>{m.diet}</td>
                <td>{Number(m.min_price).toFixed(2)} €</td><td>{m.stock}</td>
                <td>
                  <button className="btn btn-outline btn-small" onClick={() => startEdit(m)}>Modifier</button>
                  <button className="btn btn-danger btn-small ml-1" onClick={() => deleteMenu(m.id)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Gestion des plats
function DishesManagement() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDish, setEditDish] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', type: 'plat', allergens: '' });

  useEffect(() => {
    api.get('/dishes').then(r => r.json()).then(setDishes).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const saveDish = async (e) => {
    e.preventDefault();
    const data = { ...form, allergens: form.allergens ? form.allergens.split(',').map(a => a.trim()) : [] };
    const method = editDish ? 'put' : 'post';
    const url = editDish ? `/dishes/${editDish.id}` : '/dishes';
    const res = await api[method](url, data);
    if (res.ok) {
      const updated = await api.get('/dishes').then(r => r.json());
      setDishes(updated);
      setEditDish(null);
      setForm({ name: '', description: '', type: 'plat', allergens: '' });
    }
  };

  const startEdit = (dish) => {
    setEditDish(dish);
    setForm({ name: dish.name, description: dish.description || '', type: dish.type, allergens: (dish.allergens || []).join(', ') });
  };

  const deleteDish = async (id) => {
    if (!confirm('Supprimer ce plat ?')) return;
    await api.delete(`/dishes/${id}`);
    setDishes(dishes.filter(d => d.id !== id));
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <h2>{editDish ? 'Modifier le plat' : 'Gestion des plats'}</h2>
      <form onSubmit={saveDish} className="card card-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="adm-dish-name">Nom</label>
            <input id="adm-dish-name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="adm-dish-type">Type</label>
            <select id="adm-dish-type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="entree">Entrée</option>
              <option value="plat">Plat</option>
              <option value="dessert">Dessert</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="adm-dish-desc">Description</label>
          <textarea id="adm-dish-desc" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor="adm-dish-allergens">Allergènes (séparés par des virgules)</label>
          <input id="adm-dish-allergens" value={form.allergens} onChange={e => setForm({ ...form, allergens: e.target.value })} placeholder="lait, gluten, oeufs" />
        </div>
        <div className="action-bar">
          <button type="submit" className="btn btn-primary">{editDish ? 'Mettre à jour' : 'Ajouter le plat'}</button>
          {editDish && <button type="button" className="btn btn-outline" onClick={() => { setEditDish(null); setForm({ name: '', description: '', type: 'plat', allergens: '' }); }}>Annuler</button>}
        </div>
      </form>
      <div className="table-container">
        <table>
          <thead><tr><th>Nom</th><th>Type</th><th>Allergènes</th><th>Actions</th></tr></thead>
          <tbody>
            {dishes.map(d => (
              <tr key={d.id}>
                <td>{d.name}</td><td>{d.type}</td>
                <td>{(d.allergens || []).join(', ') || '-'}</td>
                <td>
                  <button className="btn btn-outline btn-small" onClick={() => startEdit(d)}>Modifier</button>
                  <button className="btn btn-danger btn-small ml-1" onClick={() => deleteDish(d.id)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Gestion des horaires
function HoursManagement() {
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  useEffect(() => {
    api.get('/hours').then(r => r.json()).then(setHours).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const updateHour = async (dayOfWeek, data) => {
    await api.put(`/hours/${dayOfWeek}`, data);
    const updated = await api.get('/hours').then(r => r.json());
    setHours(updated);
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <h2>Gestion des horaires</h2>
      <div className="table-container mt-4">
        <table>
          <thead><tr><th>Jour</th><th>Ouverture</th><th>Fermeture</th><th>Fermé</th><th>Action</th></tr></thead>
          <tbody>
            {hours.map(h => (
              <tr key={h.day_of_week}>
                <td>{DAY_NAMES[h.day_of_week]}</td>
                <td><input type="time" defaultValue={h.open_time?.slice(0, 5)} disabled={h.is_closed} onChange={e => { h._open = e.target.value; }} /></td>
                <td><input type="time" defaultValue={h.close_time?.slice(0, 5)} disabled={h.is_closed} onChange={e => { h._close = e.target.value; }} /></td>
                <td><input type="checkbox" defaultChecked={h.is_closed} onChange={e => { h._closed = e.target.checked; }} /></td>
                <td>
                  <button className="btn btn-primary btn-small" onClick={() => updateHour(h.day_of_week, {
                    open_time: h._open || h.open_time?.slice(0, 5),
                    close_time: h._close || h.close_time?.slice(0, 5),
                    is_closed: h._closed !== undefined ? h._closed : h.is_closed,
                  })}>Sauver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Scoring clients
function ClientScoring() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/client-scores')
      .then(r => r.json())
      .then(data => setScores(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const scoreColor = (s) => {
    const n = parseFloat(s);
    if (n >= 10) return 'var(--color-success)';
    if (n >= 5)  return 'var(--color-warning)';
    if (n < 0)   return 'var(--color-danger)';
    return 'var(--color-grey)';
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <h2>Scoring clients</h2>
      <p className="text-muted mt-1 mb-4">
        Score = +3 par devis accepté · -1 par devis refusé · +0.5 par tranche de 100 € dépensés
      </p>
      {scores.length === 0 ? (
        <p className="text-muted">Aucune donnée disponible (aucun devis enregistré).</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Client</th>
                <th>Email</th>
                <th>Score</th>
                <th>Devis total</th>
                <th>Acceptés</th>
                <th>Refusés</th>
                <th>Dépensé</th>
                <th>Dernière activité</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((c, i) => (
                <tr key={c.id}>
                  <td>{i + 1}</td>
                  <td><strong>{c.first_name} {c.last_name}</strong></td>
                  <td>{c.email}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: scoreColor(c.score) }}>
                      {parseFloat(c.score).toFixed(1)}
                    </span>
                  </td>
                  <td>{c.total_quotes}</td>
                  <td><span className="badge badge-green">{c.accepted_quotes}</span></td>
                  <td>
                    {parseInt(c.refused_quotes) > 0
                      ? <span className="badge badge-red">{c.refused_quotes}</span>
                      : <span className="text-muted">0</span>}
                  </td>
                  <td>{parseFloat(c.total_spent).toFixed(2)} €</td>
                  <td>{c.last_activity ? new Date(c.last_activity).toLocaleDateString('fr-FR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Gestion des pages légales
const LEGAL_TYPES = [
  { value: 'mentions_legales', label: 'Mentions légales' },
  { value: 'confidentialite',  label: 'Politique de confidentialité' },
  { value: 'cgv',              label: 'Conditions Générales de Vente' },
];

function LegalPagesManagement() {
  const [selectedType, setSelectedType] = useState('mentions_legales');
  const [form, setForm] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setSuccess('');
    setError('');
    api.get(`/legal/${selectedType}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.content) {
          setForm({ title: data.title || '', content: data.content });
        } else {
          setForm({ title: '', content: '' });
        }
      })
      .catch(() => setForm({ title: '', content: '' }))
      .finally(() => setLoading(false));
  }, [selectedType]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      const res = await api.put(`/legal/${selectedType}`, {
        title: form.title,
        content: form.content,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la sauvegarde.');
      setSuccess('Page sauvegardée.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2>Pages légales</h2>
      <div className="form-group mt-4" style={{ maxWidth: 300 }}>
        <label htmlFor="legal-type-select">Page à éditer</label>
        <select
          id="legal-type-select"
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
        >
          {LEGAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : (
        <form onSubmit={handleSave} className="dashboard-form mt-4">
          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="legal-title">Titre</label>
            <input
              id="legal-title"
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="legal-content">Contenu (Markdown)</label>
            <textarea
              id="legal-content"
              rows={20}
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar" role="navigation" aria-label="Menu administrateur">
        <NavLink to="/dashboard" end>Commandes</NavLink>
        <NavLink to="/dashboard/quotes">Devis</NavLink>
        <NavLink to="/dashboard/quote-options">Options devis</NavLink>
        <NavLink to="/dashboard/analytics">Analytics</NavLink>
        <NavLink to="/dashboard/client-scores">Scoring clients</NavLink>
        <NavLink to="/dashboard/users">Utilisateurs</NavLink>
        <NavLink to="/dashboard/reviews">Avis</NavLink>
        <NavLink to="/dashboard/menus">Menus</NavLink>
        <NavLink to="/dashboard/dishes">Plats</NavLink>
        <NavLink to="/dashboard/hours">Horaires</NavLink>
        <NavLink to="/dashboard/legal">Pages légales</NavLink>
      </aside>
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="dashboard-header__top">
            <h1>Administration</h1>
            <span className="dashboard-header__badge">Admin</span>
          </div>
          <p>Gestion et supervision de la plateforme.</p>
          <div className="dashboard-sep" />
        </div>
        <Routes>
          <Route index element={<OrdersManagement />} />
          <Route path="quotes" element={<QuotesManagement />} />
          <Route path="quotes/:id" element={<QuoteDetail />} />
          <Route path="quote-options" element={<QuoteOptionsManagement />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="client-scores" element={<ClientScoring />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="reviews" element={<ReviewsManagement />} />
          <Route path="menus" element={<MenusManagement />} />
          <Route path="dishes" element={<DishesManagement />} />
          <Route path="hours" element={<HoursManagement />} />
          <Route path="legal" element={<LegalPagesManagement />} />
          <Route path="orders/:id" element={<OrderDetail />} />
        </Routes>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import OrderDetail from './OrderDetail';
import QuoteDetail from '../QuoteDetail';

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

function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState(null);
  const [contactModal, setContactModal] = useState(null);

  const fetchOrders = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (clientFilter) params.set('user_id', clientFilter);
    api.get(`/orders?${params.toString()}`).then(r => r.json()).then(setOrders).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/users/clients').then(r => r.json()).then(setClients).catch(() => {});
  }, []);

  useEffect(() => { fetchOrders(); }, [statusFilter, clientFilter]);

  const updateStatus = async (orderId, status, contactData) => {
    const body = { status };
    if (contactData) {
      body.reason = contactData.reason;
      body.contact_method = contactData.contact_method;
    }
    await api.put(`/orders/${orderId}/status`, body);
    setStatusModal(null);
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
      <h2>Gestion des commandes</h2>

      <div className="filters-bar mt-4">
        <div className="form-group">
          <label htmlFor="emp-status-filter">Statut</label>
          <select id="emp-status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Tous</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="emp-client-filter">Client</label>
          <select id="emp-client-filter" value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
            <option value="">Tous</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div className="loading">Chargement...</div> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Client</th>
                <th scope="col">Menu</th>
                <th scope="col">Date</th>
                <th scope="col">Total</th>
                <th scope="col">Statut</th>
                <th scope="col">Paiement</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
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
                    <span className={`badge badge-${o.payment_status === 'paye' ? 'green' : o.payment_status === 'acompte_paye' ? 'orange' : 'red'}`}>
                      {o.payment_status === 'paye' ? 'Payé' : o.payment_status === 'acompte_paye' ? 'Acompte reçu' : 'Non payé'}
                    </span>
                  </td>
                  <td>
                    {ALLOWED_TRANSITIONS[o.status]?.length > 0 && (
                      <select
                        onChange={e => { if (e.target.value) handleStatusChange(o, e.target.value); e.target.value = ''; }}
                        defaultValue=""
                        aria-label={`Changer statut commande ${o.id.slice(0, 8)}`}
                      >
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
            <p>Vous devez contacter le client avant de modifier/annuler une commande.</p>
            <div className="form-group mt-4">
              <label htmlFor="contact-reason">Motif</label>
              <textarea id="contact-reason" required value={contactModal.reason} onChange={e => setContactModal({ ...contactModal, reason: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="contact-method">Mode de contact</label>
              <select id="contact-method" value={contactModal.contact_method} onChange={e => setContactModal({ ...contactModal, contact_method: e.target.value })}>
                <option value="email">Email</option>
                <option value="phone">Téléphone</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setContactModal(null)}>Annuler</button>
              <button className="btn btn-danger" disabled={!contactModal.reason} onClick={() => updateStatus(contactModal.orderId, contactModal.status, contactModal)}>
                Confirmer
              </button>
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

  return (
    <div>
      <h2>Gestion des devis</h2>

      <div className="filters-bar mt-4">
        <div className="form-group">
          <label htmlFor="emp-quote-status">Statut</label>
          <select id="emp-quote-status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
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
            <label htmlFor="menu-title">Titre</label>
            <input id="menu-title" required value={menuForm.title} onChange={e => setMenuForm({ ...menuForm, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="menu-theme">Thème</label>
            <input id="menu-theme" required value={menuForm.theme} onChange={e => setMenuForm({ ...menuForm, theme: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="menu-desc">Description</label>
          <textarea id="menu-desc" required value={menuForm.description} onChange={e => setMenuForm({ ...menuForm, description: e.target.value })} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="menu-diet">Régime</label>
            <select id="menu-diet" value={menuForm.diet} onChange={e => setMenuForm({ ...menuForm, diet: e.target.value })}>
              <option value="standard">Standard</option>
              <option value="vegetarien">Végétarien</option>
              <option value="vegan">Vegan</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="menu-minpers">Min. personnes</label>
            <input id="menu-minpers" type="number" min="1" value={menuForm.min_persons} onChange={e => setMenuForm({ ...menuForm, min_persons: parseInt(e.target.value) })} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="menu-price">Prix/pers. (€)</label>
            <input id="menu-price" type="number" min="0" step="0.01" value={menuForm.min_price} onChange={e => setMenuForm({ ...menuForm, min_price: parseFloat(e.target.value) })} />
          </div>
          <div className="form-group">
            <label htmlFor="menu-stock">Stock</label>
            <input id="menu-stock" type="number" min="0" value={menuForm.stock} onChange={e => setMenuForm({ ...menuForm, stock: parseInt(e.target.value) })} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="menu-conditions">Conditions</label>
          <textarea id="menu-conditions" value={menuForm.conditions} onChange={e => setMenuForm({ ...menuForm, conditions: e.target.value })} />
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
          <thead>
            <tr><th>Titre</th><th>Thème</th><th>Régime</th><th>Prix</th><th>Stock</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {menus.map(m => (
              <tr key={m.id}>
                <td>{m.title}</td>
                <td>{m.theme}</td>
                <td>{m.diet}</td>
                <td>{Number(m.min_price).toFixed(2)} €</td>
                <td>{m.stock}</td>
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
            <label htmlFor="dish-name">Nom</label>
            <input id="dish-name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="dish-type">Type</label>
            <select id="dish-type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="entree">Entrée</option>
              <option value="plat">Plat</option>
              <option value="dessert">Dessert</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="dish-desc">Description</label>
          <textarea id="dish-desc" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor="dish-allergens">Allergènes (séparés par des virgules)</label>
          <input id="dish-allergens" value={form.allergens} onChange={e => setForm({ ...form, allergens: e.target.value })} placeholder="lait, gluten, oeufs" />
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
                <td>{d.name}</td>
                <td>{d.type}</td>
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
        <p className="mt-4 text-muted">Aucun avis en attente de validation.</p>
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
                <td>
                  <input type="time" defaultValue={h.open_time?.slice(0, 5)} disabled={h.is_closed}
                    onChange={e => { h._open = e.target.value; }} />
                </td>
                <td>
                  <input type="time" defaultValue={h.close_time?.slice(0, 5)} disabled={h.is_closed}
                    onChange={e => { h._close = e.target.value; }} />
                </td>
                <td>
                  <input type="checkbox" defaultChecked={h.is_closed}
                    onChange={e => { h._closed = e.target.checked; }} />
                </td>
                <td>
                  <button className="btn btn-primary btn-small" onClick={() => {
                    updateHour(h.day_of_week, {
                      open_time: h._open || h.open_time?.slice(0, 5),
                      close_time: h._close || h.close_time?.slice(0, 5),
                      is_closed: h._closed !== undefined ? h._closed : h.is_closed,
                    });
                  }}>Sauver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Gestion des messages de contact (employé — lecture + réponse, sans suppression)
function EmpMessagesManagement() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/contact').then(r => r.json()).then(setMessages).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleMarkAsRead = async (id) => {
    await api.put(`/contact/${id}/read`);
    setMessages(msgs => msgs.map(m => m.id === id ? { ...m, is_read: true } : m));
  };

  const filtered = filter === 'all' ? messages : filter === 'unread' ? messages.filter(m => !m.is_read) : messages.filter(m => m.is_read);
  const unreadCount = messages.filter(m => !m.is_read).length;

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <h2>Messages de contact</h2>
        {unreadCount > 0 && <span className="badge badge-warning">{unreadCount} non lu{unreadCount > 1 ? 's' : ''}</span>}
      </div>
      <div className="filters" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button className={`btn btn-small ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('all')}>Tous ({messages.length})</button>
        <button className={`btn btn-small ${filter === 'unread' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('unread')}>Non lus ({unreadCount})</button>
        <button className={`btn btn-small ${filter === 'read' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('read')}>Lus ({messages.length - unreadCount})</button>
      </div>
      {filtered.length === 0 ? (
        <p className="mt-4 text-muted">Aucun message.</p>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Statut</th>
                <th>Date</th>
                <th>Email</th>
                <th>Sujet</th>
                <th>Réponses</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ fontWeight: m.is_read ? 'normal' : 'bold', cursor: 'pointer' }} onClick={() => navigate(`/dashboard/messages/${m.id}`)}>
                  <td>{m.is_read ? '✓ Lu' : '● Nouveau'}</td>
                  <td>{new Date(m.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{m.email}{m.user_first_name ? ` (${m.user_first_name} ${m.user_last_name})` : ''}</td>
                  <td>{m.title}</td>
                  <td>{m.reply_count || 0}</td>
                  <td onClick={e => e.stopPropagation()}>
                    {!m.is_read && <button className="btn btn-small btn-outline" onClick={() => handleMarkAsRead(m.id)}>Marquer lu</button>}
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

function EmpMessageDetail() {
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

  useEffect(() => {
    if (message && !message.is_read) {
      api.put(`/contact/${id}/read`);
    }
  }, [message, id]);

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
      <button className="btn btn-outline btn-small" onClick={() => navigate('/dashboard/messages')} style={{ marginBottom: '1rem' }}>← Retour aux messages</button>
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>{message.title}</h2>
        <p className="text-muted" style={{ margin: '0.5rem 0' }}>
          De : <strong>{message.email}</strong>
          {message.user_first_name && ` (${message.user_first_name} ${message.user_last_name})`}
          {' — '}
          {new Date(message.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: 'var(--radius)', whiteSpace: 'pre-wrap' }}>
          {message.description}
        </div>
      </div>

      <h3>Conversation ({message.replies?.length || 0} réponse{(message.replies?.length || 0) > 1 ? 's' : ''})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        {message.replies?.map(r => (
          <div key={r.id} style={{
            padding: '1rem',
            borderRadius: 'var(--radius)',
            background: r.role === 'client' ? 'var(--color-bg)' : '#e8f4e8',
            borderLeft: `4px solid ${r.role === 'client' ? 'var(--color-accent)' : '#4caf50'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <strong>{r.first_name} {r.last_name} <span className="text-muted">({r.role})</span></strong>
              <small className="text-muted">{new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
            </div>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{r.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleReply} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h3>Répondre</h3>
        <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="Votre réponse..." rows={4} required className="form-input" style={{ resize: 'vertical' }} />
        <div>
          <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? 'Envoi...' : 'Envoyer la réponse'}</button>
        </div>
      </form>
    </div>
  );
}

export default function EmployeeDashboard() {
  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar" role="navigation" aria-label="Menu employé">
        <NavLink to="/dashboard" end>Commandes</NavLink>
        <NavLink to="/dashboard/quotes">Devis</NavLink>
        <NavLink to="/dashboard/menus">Menus</NavLink>
        <NavLink to="/dashboard/dishes">Plats</NavLink>
        <NavLink to="/dashboard/messages">Messages</NavLink>
        <NavLink to="/dashboard/reviews">Avis</NavLink>
        <NavLink to="/dashboard/hours">Horaires</NavLink>
      </aside>
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="dashboard-header__top">
            <h1>Espace employé</h1>
            <span className="dashboard-header__badge">Staff</span>
          </div>
          <p>Suivi des devis, commandes et opérations.</p>
          <div className="dashboard-sep" />
        </div>
        <Routes>
          <Route index element={<OrdersManagement />} />
          <Route path="quotes" element={<QuotesManagement />} />
          <Route path="quotes/:id" element={<QuoteDetail />} />
          <Route path="menus" element={<MenusManagement />} />
          <Route path="dishes" element={<DishesManagement />} />
          <Route path="messages" element={<EmpMessagesManagement />} />
          <Route path="messages/:id" element={<EmpMessageDetail />} />
          <Route path="reviews" element={<ReviewsManagement />} />
          <Route path="hours" element={<HoursManagement />} />
          <Route path="orders/:id" element={<OrderDetail />} />
        </Routes>
      </div>
    </div>
  );
}

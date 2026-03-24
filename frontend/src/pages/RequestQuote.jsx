import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Seo from '../components/Seo';

const EVENT_TYPES = [
  { value: 'mariage',            label: 'Mariage' },
  { value: 'anniversaire',       label: 'Anniversaire' },
  { value: 'seminaire',          label: 'Séminaire' },
  { value: 'cocktail_dinatoire', label: 'Cocktail dînatoire' },
  { value: 'reunion_entreprise', label: "Réunion d'entreprise" },
  { value: 'soiree_gala',        label: 'Soirée gala' },
  { value: 'bapteme',            label: 'Baptême' },
  { value: 'autre',              label: 'Autre' },
];

// Mapping vers les valeurs de l'enum PostgreSQL
const EVENT_TYPE_DB = {
  mariage:            'mariage',
  anniversaire:       'anniversaire',
  seminaire:          'seminaire',
  cocktail_dinatoire: 'cocktail',
  reunion_entreprise: 'seminaire',
  soiree_gala:        'gala',
  bapteme:            'autre',
  autre:              'autre',
};

const getEventTypeLabel = (value) =>
  EVENT_TYPES.find(t => t.value === value)?.label || value;

const UNIT_LABELS = {
  par_personne: '/ personne',
  forfait: 'forfait',
  par_heure: '/ heure',
};

const STEPS = ['Votre événement', 'Menus & options', 'Récapitulatif'];

function StepIndicator({ current }) {
  return (
    <div className="stepper">
      {STEPS.map((label, i) => (
        <div key={i} className={`stepper__step${i < STEPS.length - 1 ? ' stepper__step--expand' : ''}`}>
          <div className="stepper__content">
            <div className={`stepper__circle ${i <= current ? 'stepper__circle--active' : 'stepper__circle--inactive'}`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`stepper__label ${i === current ? 'stepper__label--active' : 'stepper__label--inactive'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`stepper__line ${i < current ? 'stepper__line--active' : 'stepper__line--inactive'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// Étape 1 : Détails de l'événement

function Step1({ data, onChange, onNext }) {
  const [errors, setErrors] = useState({});
  const [budgetHint, setBudgetHint] = useState(null);

  useEffect(() => {
    if (!data.event_type || !data.guest_count || data.guest_count < 1) {
      setBudgetHint(null);
      return;
    }
    const timer = setTimeout(() => {
      api.get(`/suggestions/budget?event_type=${data.event_type}&guest_count=${data.guest_count}`)
        .then(r => r.json())
        .then(res => setBudgetHint(res && res.median ? res : null))
        .catch(() => setBudgetHint(null));
    }, 600);
    return () => clearTimeout(timer);
  }, [data.event_type, data.guest_count]);

  const today = new Date().toISOString().split('T')[0];

  const validate = () => {
    const e = {};
    if (!data.event_type) e.event_type = 'Veuillez choisir un type d\'événement.';
    if (!data.event_date) e.event_date = 'La date est obligatoire.';
    else if (data.event_date <= today) e.event_date = 'La date doit être dans le futur.';
    if (!data.event_address.trim()) e.event_address = 'L\'adresse est obligatoire.';
    if (!data.event_city.trim()) e.event_city = 'La ville est obligatoire.';
    if (!data.guest_count || data.guest_count < 1) e.guest_count = 'Nombre de personnes requis (min. 1).';
    if (data.guest_count > 500) e.guest_count = 'Maximum 500 personnes.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validate()) onNext(); };

  return (
    <div>
      <h2 className="mb-5">Votre événement</h2>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="rq-event-type">Type d'événement *</label>
          <select
            id="rq-event-type"
            value={data.event_type}
            onChange={e => onChange('event_type', e.target.value)}
          >
            <option value="">Sélectionner...</option>
            {EVENT_TYPES.map(t => (
  <option key={t.value} value={t.value}>
    {t.label}
  </option>
))}
          </select>
          {errors.event_type && <small className="field-error">{errors.event_type}</small>}
        </div>

        <div className="form-group">
          <label htmlFor="rq-guest-count">Nombre de personnes *</label>
          <input
            id="rq-guest-count"
            type="number"
            min="1"
            max="500"
            value={data.guest_count || ''}
            onChange={e => onChange('guest_count', parseInt(e.target.value) || '')}
          />
          {errors.guest_count && <small className="field-error">{errors.guest_count}</small>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="rq-event-date">Date de l'événement *</label>
          <input
            id="rq-event-date"
            type="date"
            min={today}
            value={data.event_date}
            onChange={e => onChange('event_date', e.target.value)}
          />
          {errors.event_date && <small className="field-error">{errors.event_date}</small>}
        </div>

        <div className="form-group">
          <label htmlFor="rq-event-time">Heure de début</label>
          <input
            id="rq-event-time"
            type="time"
            value={data.event_time}
            onChange={e => onChange('event_time', e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="rq-address">Adresse de l'événement *</label>
        <input
          id="rq-address"
          type="text"
          value={data.event_address}
          onChange={e => onChange('event_address', e.target.value)}
          placeholder="12 rue de la Paix"
        />
        {errors.event_address && <small className="field-error">{errors.event_address}</small>}
      </div>

      <div className="form-group">
        <label htmlFor="rq-city">Ville *</label>
        <input
          id="rq-city"
          type="text"
          value={data.event_city}
          onChange={e => onChange('event_city', e.target.value)}
          placeholder="Paris"
        />
        {errors.event_city && <small className="field-error">{errors.event_city}</small>}
      </div>

      <div className="form-group">
        <label htmlFor="rq-dietary">Régimes alimentaires / Allergènes</label>
        <textarea
          id="rq-dietary"
          value={data.dietary_notes}
          onChange={e => onChange('dietary_notes', e.target.value)}
          placeholder="Ex: 3 végétariens, 1 allergie aux fruits à coque..."
          style={{ minHeight: 80 }}
        />
      </div>

      {budgetHint && (
        <div className="budget-hint">
          <span className="budget-hint__label">Budget estimé pour ce type d'événement :</span>
          <span className="budget-hint__range">
            {budgetHint.q1.toFixed(0)} – {budgetHint.q3.toFixed(0)} €
          </span>
          <span className="budget-hint__median">
            (médiane : {budgetHint.median.toFixed(0)} € · {budgetHint.sample_count} devis)
          </span>
        </div>
      )}

      <div className="step-nav step-nav--end">
        <button type="button" className="btn btn-primary" onClick={handleNext}>
          Suivant →
        </button>
      </div>
    </div>
  );
}

// Étape 2 : Sélection menu + options

function Step2({ data, onChange, onNext, onBack, guestCount, preselectedLabels, eventType, dietaryNotes }) {
  const [menus, setMenus] = useState([]);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menusError, setMenusError] = useState('');
  const [selectError, setSelectError] = useState('');
  const [suggestedIds, setSuggestedIds] = useState(new Set());
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  useEffect(() => {
    setLoading(true);
    setMenusError('');

    const fetchMenus = api.get('/menus')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(menusData => {
        const available = (Array.isArray(menusData) ? menusData : []).filter(
          m => m.stock > 0 && (!m.min_persons || m.min_persons <= guestCount)
        );
        setMenus(available);
      })
      .catch(() => {
        setMenusError('Impossible de charger les menus. Veuillez réessayer.');
      });

    const fetchOptions = api.get('/quote-options')
      .then(r => {
        if (!r.ok) return null;
        return r.json();
      })
      .then(optionsData => {
        if (!optionsData) return;
        const loaded = Array.isArray(optionsData.data) ? optionsData.data
          : Array.isArray(optionsData) ? optionsData
          : [];
        setOptions(loaded);

        // Pré-cocher les options dont le label correspond aux sélections de Boissons/Prestations
        if (preselectedLabels.length > 0) {
          const toAdd = loaded.filter(opt =>
            preselectedLabels.some(lbl =>
              opt.label.toLowerCase().includes(lbl.toLowerCase()) ||
              lbl.toLowerCase().includes(opt.label.toLowerCase())
            )
          );
          if (toAdd.length > 0) {
            const existingOptionIds = data.items
              .filter(i => i.item_type === 'option')
              .map(i => i.option_id);
            const newItems = toAdd
              .filter(opt => !existingOptionIds.includes(opt.id))
              .map(opt => ({
                item_type: 'option',
                menu_id: null,
                option_id: opt.id,
                label: opt.label,
                unit_price: parseFloat(opt.unit_price),
                unit: opt.unit,
                quantity: 1,
              }));
            if (newItems.length > 0) {
              onChange('items', [...data.items, ...newItems]);
            }
          }
        }
      })
      .catch(() => {});

    const fetchSuggestions = api.get(`/suggestions/menus?event_type=${eventType || ''}&guest_count=${guestCount}`)
      .then(r => r.ok ? r.json() : [])
      .then(suggestions => {
        const ids = new Set(
          (Array.isArray(suggestions) ? suggestions : [])
            .filter(s => s.recommended)
            .map(s => s.id)
        );
        setSuggestedIds(ids);
      })
      .catch(() => {});

    Promise.all([fetchMenus, fetchOptions, fetchSuggestions]).finally(() => setLoading(false));
  }, [guestCount, eventType]);

  const selectMenu = (menu) => {
    const menuItem = {
      item_type: 'menu',
      menu_id: menu.id,
      option_id: null,
      label: menu.title,
      unit_price: parseFloat(menu.min_price),
      unit: 'par_personne',
      quantity: 1,
    };
    // Remplacer tout item de type 'menu' existant
    const withoutMenu = data.items.filter(i => i.item_type !== 'menu');
    onChange('items', [...withoutMenu, menuItem]);
  };

  const selectedMenuId = data.items.find(i => i.item_type === 'menu')?.menu_id || null;

  const toggleOption = (option) => {
    const exists = data.items.find(i => i.item_type === 'option' && i.option_id === option.id);
    if (exists) {
      onChange('items', data.items.filter(i => !(i.item_type === 'option' && i.option_id === option.id)));
    } else {
      onChange('items', [...data.items, {
        item_type: 'option',
        menu_id: null,
        option_id: option.id,
        label: option.label,
        unit_price: parseFloat(option.unit_price),
        unit: option.unit,
        quantity: 1,
      }]);
    }
  };

  const isOptionSelected = (optionId) => data.items.some(i => i.item_type === 'option' && i.option_id === optionId);

  const updateOptionQty = (optionId, qty) => {
    onChange('items', data.items.map(i =>
      (i.item_type === 'option' && i.option_id === optionId)
        ? { ...i, quantity: Math.max(1, parseInt(qty) || 1) }
        : i
    ));
  };

  const handleAISuggest = async () => {
    setAiLoading(true);
    setAiMessage('');
    try {
      const res = await api.post('/ai', {
        type: 'quote',
        data: {
          eventType: eventType || '',
          guestCount,
          dietaryNotes: dietaryNotes || '',
        },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur IA');

      // Prefill menu
      if (result.menuId) {
        const menu = menus.find(m => m.id === result.menuId);
        if (menu) selectMenu(menu);
      }
      // Prefill options
      if (Array.isArray(result.options)) {
        for (const opt of result.options) {
          const option = options.find(o => o.id === opt.optionId);
          if (option && !isOptionSelected(option.id)) {
            toggleOption(option);
          }
        }
      }
      if (result.reasoning) setAiMessage(result.reasoning);
    } catch {
      setAiMessage('Suggestion IA indisponible pour le moment.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleNext = () => {
    if (!selectedMenuId) {
      setSelectError('Veuillez sélectionner un menu.');
      return;
    }
    setSelectError('');
    onNext();
  };

  if (loading) return <div className="loading">Chargement des menus...</div>;

  return (
    <div>
      <h2 className="mb-2">Choisissez votre menu</h2>
      <p className="section-subtitle">
        Menus disponibles pour {guestCount} convive{guestCount > 1 ? 's' : ''}
      </p>

      <div className="ai-suggest-bar">
        <button
          type="button"
          className="btn btn-outline btn-ai"
          onClick={handleAISuggest}
          disabled={aiLoading || menus.length === 0}
        >
          {aiLoading ? 'Analyse en cours...' : '✨ Suggestion IA'}
        </button>
        {aiMessage && <p className="ai-suggest-bar__message">{aiMessage}</p>}
        <p className="ai-disclaimer">Suggestion basée sur nos menus et données réelles.</p>
      </div>

      {menusError && (
        <div className="alert alert-error">
          {menusError}
          <button type="button" className="btn btn-outline btn-small" style={{ marginLeft: 12 }} onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      )}

      {!menusError && menus.length === 0 ? (
        <div className="alert alert-error">
          Aucun menu disponible pour {guestCount} convive{guestCount > 1 ? 's' : ''}. Contactez-nous directement.
        </div>
      ) : !menusError && (
        <div className="grid grid-2 mb-6">
          {menus.map(menu => (
            <div
              key={menu.id}
              className={`card select-card${selectedMenuId === menu.id ? ' select-card--selected' : ''}`}
              onClick={() => selectMenu(menu)}
              role="button"
              aria-pressed={selectedMenuId === menu.id}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && selectMenu(menu)}
            >
              <div className="select-card__header">
                <h3 className="select-card__title">{menu.title}</h3>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {suggestedIds.has(menu.id) && (
                    <span className="badge badge--recommended">Recommandé</span>
                  )}
                  {selectedMenuId === menu.id && (
                    <span className="select-card__check">✓</span>
                  )}
                </div>
              </div>
              <p className="select-card__desc">{menu.description}</p>
              <div className="menu-price-row mt-2">
                <span className="menu-price">
                  {Number(menu.min_price).toFixed(2)} € / pers.
                </span>
                <span className="text-sm text-muted">
                  min. {menu.min_persons} pers.
                </span>
              </div>
              <div className="select-card__estimate">
                <span style={{ fontWeight: 600 }}>Total estimé : </span>
                <span className="text-accent">
                  {(Number(menu.min_price) * guestCount).toFixed(2)} €
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {options.length > 0 && (
        <>
          <h2 className="mb-2">Options supplémentaires</h2>
          <p className="section-subtitle">
            Personnalisez votre événement
          </p>
          <div className="mb-6" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {options.map(option => {
              const selected = isOptionSelected(option.id);
              const item = data.items.find(i => i.item_type === 'option' && i.option_id === option.id);
              return (
                <div
                  key={option.id}
                  className={`card option-row${selected ? ' option-row--selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    id={`opt-${option.id}`}
                    checked={selected}
                    onChange={() => toggleOption(option)}
                    className="option-row__checkbox"
                  />
                  <label htmlFor={`opt-${option.id}`} className="option-row__label">
                    <strong>{option.label}</strong>
                    {option.description && (
                      <span className="text-sm text-muted" style={{ display: 'block' }}>
                        {option.description}
                      </span>
                    )}
                  </label>
                  <span className="option-row__price">
                    {Number(option.unit_price).toFixed(2)} € {UNIT_LABELS[option.unit]}
                  </span>
                  {selected && option.unit !== 'par_personne' && (
                    <div className="option-row__qty">
                      <label htmlFor={`qty-${option.id}`}>Qté :</label>
                      <input
                        id={`qty-${option.id}`}
                        type="number"
                        min="1"
                        value={item?.quantity || 1}
                        onChange={e => updateOptionQty(option.id, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {selectError && <div className="alert alert-error mb-2">{selectError}</div>}

      <div className="step-nav">
        <button type="button" className="btn btn-outline" onClick={onBack}>
          ← Retour
        </button>
        <button type="button" className="btn btn-primary" onClick={handleNext}>
          Suivant →
        </button>
      </div>
    </div>
  );
}

// Étape 3 : Récapitulatif + envoi

function Step3({ data, onChange, onBack, onSubmit, submitting, guestCount }) {
  const subtotalMenu = data.items
    .filter(i => i.item_type === 'menu')
    .reduce((s, i) => s + parseFloat(i.unit_price) * guestCount, 0);

  const subtotalOptions = data.items
    .filter(i => i.item_type === 'option')
    .reduce((s, i) => {
      if (i.unit === 'par_personne') return s + parseFloat(i.unit_price) * guestCount;
      return s + parseFloat(i.unit_price) * i.quantity;
    }, 0);

  const subtotal = subtotalMenu + subtotalOptions;
  const deposit = subtotal * 0.30;

  return (
    <div>
      <h2 className="mb-5">Récapitulatif de votre demande</h2>

      <div className="card card-padded mb-5">
        <h3 className="card-heading--sm">Votre événement</h3>
        <div className="form-row mb-2">
          <div><strong>Type :</strong> {getEventTypeLabel(data.event_type)}</div>
          <div><strong>Personnes :</strong> {guestCount}</div>
        </div>
        <div className="form-row mb-2">
          <div><strong>Date :</strong> {new Date(data.event_date).toLocaleDateString('fr-FR')}</div>
          {data.event_time && <div><strong>Heure :</strong> {data.event_time}</div>}
        </div>
        <div><strong>Adresse :</strong> {data.event_address}, {data.event_city}</div>
        {data.dietary_notes && (
          <div className="mt-2"><strong>Régimes :</strong> {data.dietary_notes}</div>
        )}
      </div>

      <div className="card card-padded mb-5">
        <h3 className="card-heading--sm">Prestations sélectionnées</h3>
        <table className="quote-table">
          <tbody>
            {data.items.map((item, i) => {
              let lineTotal;
              if (item.unit === 'par_personne') {
                lineTotal = parseFloat(item.unit_price) * guestCount;
              } else {
                lineTotal = parseFloat(item.unit_price) * item.quantity;
              }
              return (
                <tr key={i}>
                  <td>{item.label}</td>
                  <td className="quote-table__detail">
                    {Number(item.unit_price).toFixed(2)} € {UNIT_LABELS[item.unit]}
                    {item.unit !== 'par_personne' && item.quantity > 1 && ` × ${item.quantity}`}
                    {item.unit === 'par_personne' && ` × ${guestCount} pers.`}
                  </td>
                  <td className="quote-table__amount">
                    {lineTotal.toFixed(2)} €
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="price-summary mt-4">
          <div className="price-line"><span>Sous-total</span><span>{subtotal.toFixed(2)} €</span></div>
          <div className="price-line total"><span>Total estimé</span><span>{subtotal.toFixed(2)} €</span></div>
          <div className="price-line text-muted text-sm">
            <span>Acompte (30%)</span><span>{deposit.toFixed(2)} €</span>
          </div>
        </div>

        <p className="mt-3 text-sm text-muted">
          * Prix indicatif. Le devis définitif sera établi par notre équipe et vous sera envoyé par email.
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="rq-message">Message complémentaire</label>
        <textarea
          id="rq-message"
          value={data.client_message}
          onChange={e => onChange('client_message', e.target.value)}
          placeholder="Informations supplémentaires, demandes particulières..."
          style={{ minHeight: 100 }}
        />
      </div>

      <div className="step-nav">
        <button type="button" className="btn btn-outline" onClick={onBack} disabled={submitting}>
          ← Retour
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? 'Envoi en cours...' : 'Envoyer ma demande de devis'}
        </button>
      </div>
    </div>
  );
}

// Composant principal

export default function RequestQuote() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Options pré-sélectionnées transmises depuis Boissons.jsx / Prestations.jsx
  const preselectedLabels = location.state?.preselectedLabels || [];

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const [formData, setFormData] = useState({
    event_type: '',
    event_date: '',
    event_time: '',
    event_address: '',
    event_city: '',
    guest_count: '',
    dietary_notes: '',
    client_message: preselectedLabels.length > 0
      ? `Intéressé(e) par : ${preselectedLabels.join(', ')}.`
      : '',
    items: [],
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setGlobalError('');
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        event_type: EVENT_TYPE_DB[formData.event_type] || formData.event_type,
        guest_count: parseInt(formData.guest_count),
        event_time: formData.event_time || undefined,
        dietary_notes: formData.dietary_notes || undefined,
        client_message: formData.client_message || undefined,
      };

      const res = await api.post('/quotes', payload);
      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || (Array.isArray(data.errors) ? data.errors.join(', ') : 'Erreur lors de la création du devis.');
        throw new Error(msg);
      }

      navigate('/dashboard/quotes/' + data.id, { state: { created: true } });
    } catch (err) {
      setGlobalError(err.message);
      setSubmitting(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="auth-page auth-page--xl">
      <Seo title="Demande de devis" description="Demandez un devis personnalisé pour votre événement à Bordeaux : mariage, séminaire, anniversaire. Réponse sous 24h." canonical="/request-quote" />
      <h1 className="mb-2">Demande de devis</h1>
      <p className="text-muted mb-6">
        Décrivez votre événement et nous vous préparerons un devis personnalisé sous 48h.
      </p>

      <StepIndicator current={step} />

      {globalError && (
        <div className="alert alert-error mb-5">{globalError}</div>
      )}

      {step === 0 && (
        <Step1
          data={formData}
          onChange={updateField}
          onNext={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <Step2
          data={formData}
          onChange={updateField}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
          guestCount={parseInt(formData.guest_count) || 0}
          preselectedLabels={preselectedLabels}
          eventType={formData.event_type}
          dietaryNotes={formData.dietary_notes}
        />
      )}

      {step === 2 && (
        <Step3
          data={formData}
          onChange={updateField}
          onBack={() => setStep(1)}
          onSubmit={handleSubmit}
          submitting={submitting}
          guestCount={parseInt(formData.guest_count) || 0}
        />
      )}
    </div>
  );
}

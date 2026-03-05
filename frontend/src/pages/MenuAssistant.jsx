import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Seo from '../components/Seo';

const EVENT_TYPES = [
  { value: 'mariage',      label: 'Mariage' },
  { value: 'anniversaire', label: 'Anniversaire' },
  { value: 'seminaire',    label: 'Séminaire' },
  { value: 'cocktail',     label: 'Cocktail dînatoire' },
  { value: 'gala',         label: 'Soirée gala' },
  { value: 'autre',        label: 'Autre' },
];

export default function MenuAssistant() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    eventType: '',
    guestCount: '',
    budget: '',
    dietaryNotes: '',
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.guestCount || form.guestCount < 1) {
      setError('Veuillez indiquer le nombre de convives.');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await api.post('/ai', {
        type: 'menu',
        data: {
          eventType: form.eventType || undefined,
          guestCount: parseInt(form.guestCount),
          budget: form.budget ? parseFloat(form.budget) : undefined,
          dietaryNotes: form.dietaryNotes || undefined,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setResults(data);
    } catch (err) {
      setError(err.message || 'Impossible de contacter l\'assistant IA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page--xl">
      <Seo
        title="Assistant Menu IA"
        description="Notre assistant intelligent vous aide à choisir le menu idéal pour votre événement à Bordeaux."
        canonical="/assistant"
      />

      <div className="page-section__header">
        <h1>Assistant Menu</h1>
        <p className="text-muted">
          Décrivez votre événement et notre IA vous recommandera les menus les plus adaptés.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card card-padded mb-6">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ai-event-type">Type d'événement</label>
            <select
              id="ai-event-type"
              value={form.eventType}
              onChange={e => update('eventType', e.target.value)}
            >
              <option value="">Tous types</option>
              {EVENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="ai-guests">Nombre de convives *</label>
            <input
              id="ai-guests"
              type="number"
              min="1"
              max="500"
              value={form.guestCount}
              onChange={e => update('guestCount', e.target.value)}
              placeholder="Ex : 50"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ai-budget">Budget total (€)</label>
            <input
              id="ai-budget"
              type="number"
              min="0"
              step="0.01"
              value={form.budget}
              onChange={e => update('budget', e.target.value)}
              placeholder="Optionnel"
            />
          </div>

          <div className="form-group">
            <label htmlFor="ai-dietary">Restrictions alimentaires</label>
            <input
              id="ai-dietary"
              type="text"
              value={form.dietaryNotes}
              onChange={e => update('dietaryNotes', e.target.value)}
              placeholder="Ex : végétarien, sans gluten..."
            />
          </div>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Analyse en cours...' : '✨ Trouver mes menus'}
        </button>
      </form>

      {results && (
        <div className="ai-results">
          <p className="ai-disclaimer">Suggestions générées automatiquement à partir de nos menus et données réelles.</p>

          {results.advice && (
            <div className="card card-padded ai-results__advice mb-5">
              <p>{results.advice}</p>
            </div>
          )}

          {results.suggestions && results.suggestions.length > 0 ? (
            <div className="grid grid-2">
              {results.suggestions.map((s, i) => (
                <div key={i} className="card select-card ai-results__card">
                  <div className="select-card__header">
                    <h3 className="select-card__title">{s.title}</h3>
                  </div>
                  <p className="select-card__desc">{s.reason}</p>
                  {s.estimatedTotal && (
                    <div className="select-card__estimate">
                      <span style={{ fontWeight: 600 }}>Total estimé : </span>
                      <span className="text-accent">
                        {Number(s.estimatedTotal).toFixed(2)} €
                      </span>
                      {s.estimatedPricePerPerson && (
                        <span className="text-sm text-muted" style={{ marginLeft: 8 }}>
                          ({Number(s.estimatedPricePerPerson).toFixed(2)} €/pers.)
                        </span>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary btn-small mt-3"
                    onClick={() => navigate('/request-quote')}
                  >
                    Demander un devis
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="alert alert-error">
              Aucun menu ne correspond à vos critères. Essayez avec un budget plus élevé ou moins de convives.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

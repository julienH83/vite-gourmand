import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="auth-page">
        <div className="alert alert-error">Lien de réinitialisation invalide.</div>
        <Link to="/forgot-password">Demander un nouveau lien</Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      return setError('Les mots de passe ne correspondent pas.');
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { token, password: form.password });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="page-header text-center">
        <h1>Nouveau mot de passe</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="card card-padded">
        <div className="form-group">
          <label htmlFor="reset-pw">Nouveau mot de passe</label>
          <input id="reset-pw" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <small className="password-hint">Min. 10 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial</small>
        </div>

        <div className="form-group">
          <label htmlFor="reset-confirm">Confirmer</label>
          <input id="reset-confirm" type="password" required value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Réinitialisation...' : 'Réinitialiser'}
        </button>
      </form>
    </div>
  );
}

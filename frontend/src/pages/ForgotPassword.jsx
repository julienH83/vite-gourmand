import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="page-header text-center">
        <h1>Mot de passe oublié</h1>
        <p>Entrez votre email pour recevoir un lien de réinitialisation.</p>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="card card-padded">
        <div className="form-group">
          <label htmlFor="forgot-email">Email</label>
          <input id="forgot-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Envoi...' : 'Envoyer le lien'}
        </button>

        <div className="auth-footer">
          <Link to="/login">Retour à la connexion</Link>
        </div>
      </form>
    </div>
  );
}

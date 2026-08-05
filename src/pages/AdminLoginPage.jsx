import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { checkUserAuth } = useAuth();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email.trim(), password);
      await checkUserAuth();
      const destination = params.get('from') || '/supercalifragilisticoespialidoso';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'No fue posible iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-8">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <h1 className="text-xl font-bold text-slate-900">Acceso privado</h1>
        <p className="mt-1 text-sm text-slate-500">Panel de administración de GuitarraIA</p>

        <label className="mt-6 block text-sm font-medium text-slate-700">Correo</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-500"
        />

        <label className="mt-4 block text-sm font-medium text-slate-700">Contraseña</label>
        <input
          type="password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-500"
        />

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            display: 'block',
            width: '100%',
            marginTop: '24px',
            padding: '14px 16px',
            border: 'none',
            borderRadius: '12px',
            backgroundColor: loading ? '#FDBA74' : '#F97316',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '16px',
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}

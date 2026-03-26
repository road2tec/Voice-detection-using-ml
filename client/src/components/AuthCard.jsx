import { useState } from 'react';
import { login, signup } from '../services/api';

const AuthCard = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response =
        mode === 'signin'
          ? await login({ email: form.email, password: form.password })
          : await signup({ name: form.name, email: form.email, password: form.password });

      onAuthSuccess(response.user);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || `${mode === 'signin' ? 'Sign in' : 'Sign up'} failed.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <section className="w-full rounded-2xl border border-slate-700 bg-slate-900/90 p-6">
          <h1 className="text-2xl font-bold text-white">NoiseGuard AI</h1>
          <p className="mt-2 text-sm text-slate-300">{mode === 'signin' ? 'Sign in to continue' : 'Create your account'}</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            {mode === 'signup' && (
              <div>
                <label className="mb-1 block text-sm text-slate-300">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none ring-blue-400/40 focus:ring"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm text-slate-300">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none ring-blue-400/40 focus:ring"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                required
                minLength={6}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none ring-blue-400/40 focus:ring"
              />
            </div>

            {error && <p className="text-sm text-red-300">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-900"
            >
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <button
            onClick={() => {
              setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
              setError('');
            }}
            className="mt-4 text-sm text-blue-300 hover:text-blue-200"
          >
            {mode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>

          <div className="mt-5 rounded-lg border border-slate-700 bg-slate-950/50 p-3 text-xs text-slate-400">
            Admin Login: admin@gmail.com / admin@gmail.com
          </div>
        </section>
      </div>
    </main>
  );
};

export default AuthCard;

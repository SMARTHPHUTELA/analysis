import { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi }             from '@/services/api';

export default function ResetPasswordPage() {
  const [searchParams]                  = useSearchParams();
  const token                           = searchParams.get('token') ?? '';
  const navigate                        = useNavigate();
  const [password,  setPassword]        = useState('');
  const [confirm,   setConfirm]         = useState('');
  const [loading,   setLoading]         = useState(false);
  const [done,      setDone]            = useState(false);
  const [error,     setError]           = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password)              { setError('Password is required'); return; }
    if (password.length < 8)    { setError('Min. 8 characters'); return; }
    if (password !== confirm)   { setError('Passwords do not match'); return; }
    if (!token)                 { setError('Invalid reset link'); return; }

    try {
      setLoading(true);
      setError(null);
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white
                    to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center
                          justify-center shadow-lg shadow-brand-200">
            <svg className="w-6 h-6 text-white" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">AI Cost Proxy</p>
            <p className="text-sm text-gray-500">Control Plane</p>
          </div>
        </div>

        <div className="card p-8">
          {done ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center
                              justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none"
                  stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Password reset!
              </h2>
              <p className="text-sm text-gray-500">
                Redirecting you to login…
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  Set new password
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Choose a strong password for your account
                </p>
              </div>

              {!token && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200
                                rounded-lg text-sm text-red-700">
                  Invalid or missing reset token.{' '}
                  <Link to="/forgot-password"
                    className="underline font-medium">
                    Request a new one
                  </Link>
                </div>
              )}

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200
                                rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">New password</label>
                  <input className="input" type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus />
                </div>
                <div>
                  <label className="label">Confirm password</label>
                  <input className="input" type="password"
                    placeholder="Repeat password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)} />
                </div>
                <button
                  type="submit"
                  disabled={loading || !token}
                  className="btn-primary w-full py-2.5"
                >
                  {loading ? 'Resetting…' : 'Reset password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
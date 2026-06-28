import { useState, FormEvent } from 'react';
import { Link }                from 'react-router-dom';
import { authApi }             from '@/services/api';

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    try {
      setLoading(true);
      setError(null);
      await authApi.forgotPassword(email);
      setSubmitted(true);
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
          {submitted ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center
                              justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none"
                  stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0
                       002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Check your email
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                If an account exists for <strong>{email}</strong>, we've sent
                a password reset link. Check your inbox and spam folder.
              </p>
              <Link to="/login" className="btn-primary inline-block">
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  Forgot password?
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your email and we'll send a reset link
                </p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200
                                rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-2.5"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Remember your password?{' '}
                <Link to="/login"
                  className="text-brand-600 hover:text-brand-700 font-medium">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
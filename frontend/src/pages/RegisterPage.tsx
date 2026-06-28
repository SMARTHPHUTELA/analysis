import { useState, FormEvent } from 'react';
import { Link, useNavigate }   from 'react-router-dom';
import { authApi }             from '@/services/api';
import { useAuth }             from '@/context/AuthContext';
import clsx                    from 'clsx';

export default function RegisterPage() {
  const { setUser } = useAuth();
  const navigate    = useNavigate();

  const [form, setForm] = useState({
    name:           '',
    email:          '',
    password:       '',
    confirm:        '',
    org_name:       '',
    org_slug:       '',
    monthly_budget: '',
  });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setForm((prev) => {
        const next = { ...prev, [key]: val };
        // Auto-generate slug from org name
        if (key === 'org_name') {
          next.org_slug = val
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
        }
        return next;
      });
    };

  const validate = (): string | null => {
    if (!form.name.trim())     return 'Full name is required';
    if (!form.email.trim())    return 'Email is required';
    if (!form.password)        return 'Password is required';
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (form.password !== form.confirm) return 'Passwords do not match';
    if (!form.org_name.trim()) return 'Organization name is required';
    if (!form.org_slug.trim()) return 'Organization slug is required';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    try {
      setLoading(true);
      setError(null);
      const { user } = await authApi.register({
        name:           form.name,
        email:          form.email,
        password:       form.password,
        org_name:       form.org_name,
        org_slug:       form.org_slug,
        monthly_budget: form.monthly_budget
          ? parseFloat(form.monthly_budget) : undefined,
      });
      setUser(user);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white
                    to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
            <p className="text-sm text-gray-500 mt-1">
              Set up your organization and start tracking AI costs
            </p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200
                            rounded-lg flex items-start gap-2">
              <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667
                     1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34
                     16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Section — Personal */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase
                            tracking-wider mb-3">
                Your Details
              </p>
              <div className="space-y-3">
                <div>
                  <label className="label">Full name</label>
                  <input className="input" type="text"
                    placeholder="John Smith"
                    value={form.name} onChange={set('name')} />
                </div>
                <div>
                  <label className="label">Email address</label>
                  <input className="input" type="email"
                    placeholder="you@example.com"
                    value={form.email} onChange={set('email')} />
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input
                      className="input pr-10"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={form.password}
                      onChange={set('password')}
                    />
                    <button type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2
                                 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732
                             7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542
                             7-1.274 4.057-5.064 7-9.542 7-4.477
                             0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirm password</label>
                  <input className="input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={form.confirm}
                    onChange={set('confirm')} />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase
                            tracking-wider mb-3">
                Organization
              </p>
              <div className="space-y-3">
                <div>
                  <label className="label">Organization name</label>
                  <input className="input" type="text"
                    placeholder="Acme Corp"
                    value={form.org_name}
                    onChange={set('org_name')} />
                </div>
                <div>
                  <label className="label">Slug</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-gray-50 border border-r-0
                                     border-gray-200 rounded-l-lg text-sm
                                     text-gray-400">
                      proxy/
                    </span>
                    <input
                      className="input rounded-l-none"
                      type="text"
                      placeholder="acme-corp"
                      value={form.org_slug}
                      onChange={set('org_slug')}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Auto-generated from org name. Lowercase, hyphens only.
                  </p>
                </div>
                <div>
                  <label className="label">
                    Monthly budget (USD){' '}
                    <span className="text-gray-400 font-normal">— optional</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2
                                     text-gray-400 text-sm">$</span>
                    <input className="input pl-7" type="number"
                      min="0" step="0.01"
                      placeholder="e.g. 100.00"
                      value={form.monthly_budget}
                      onChange={set('monthly_budget')} />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={clsx('btn-primary w-full py-2.5 mt-2',
                loading && 'opacity-70')}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none"
                    viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login"
              className="text-brand-600 hover:text-brand-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
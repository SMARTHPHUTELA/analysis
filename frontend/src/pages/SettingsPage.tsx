import { useState, useEffect }    from 'react';
import { useAuth }                from '@/context/AuthContext';
import { useOrganization }        from '@/hooks/useOrganization';
import { credentialApi }          from '@/services/api';
import { ProviderType }           from '@/types';
import { PROVIDER_LABELS }        from '@/utils/constants';
import Badge                      from '@/components/ui/Badge';
import clsx                       from 'clsx';

const PROVIDERS: ProviderType[] = ['openai', 'anthropic', 'gemini', 'azure_openai'];

// ── Section wrapper ────────────────────────────────────────────
function Section({
  title,
  subtitle,
  children,
}: {
  title:    string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <div className="mb-5">
        <p className="section-title">{title}</p>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

// ── Main page — single component, all hooks at top level ───────
export default function SettingsPage() {
  // ── All hooks at the very top — never conditionally ───────────
  const { user }                 = useAuth();
  const orgId                    = user?.organization_id ?? '';
  const { org, loading, update } = useOrganization(orgId);

  // Budget form state
  const [budget,  setBudget]  = useState('');
  const [email,   setEmail]   = useState('');
  const [slack,   setSlack]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  // Credential form state
  const [provider,     setProvider]     = useState<ProviderType>('openai');
  const [apiKey,       setApiKey]       = useState('');
  const [label,        setLabel]        = useState('default');
  const [credSaving,   setCredSaving]   = useState(false);
  const [credSaved,    setCredSaved]    = useState(false);
  const [credError,    setCredError]    = useState<string | null>(null);

  // Populate budget form when org loads
  useEffect(() => {
    if (!org) return;
    setBudget(org.monthly_budget > 0 ? String(org.monthly_budget) : '');
    setEmail(org.alert_email   ?? '');
    setSlack(org.slack_webhook ?? '');
  }, [org]);

  // ── Budget save ────────────────────────────────────────────────
  const handleBudgetSave = async () => {
    try {
      setSaving(true);
      setBudgetError(null);
      await update({
        monthly_budget: budget ? parseFloat(budget) : 0,
        alert_email:    email  || undefined,
        slack_webhook:  slack  || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setBudgetError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Credential save ────────────────────────────────────────────
  const handleCredSave = async () => {
    if (!apiKey.trim()) {
      setCredError('API key is required');
      return;
    }
    if (!orgId) {
      setCredError('No organization found');
      return;
    }
    try {
      setCredSaving(true);
      setCredError(null);
      await credentialApi.upsert(orgId, {
        provider,
        api_key: apiKey.trim(),
        label:   label || 'default',
      });
      setApiKey('');
      setCredSaved(true);
      setTimeout(() => setCredSaved(false), 2500);
    } catch (err: any) {
      setCredError(err.message);
    } finally {
      setCredSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="page-title">Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage your organization, budget, and provider credentials
        </p>
      </div>

      {/* ── Org Info ──────────────────────────────────────────── */}
      <Section title="Organization" subtitle="Your organization details">
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-gray-100 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { label: 'Name',   value: org?.name,   mono: false },
              { label: 'Slug',   value: org?.slug,   mono: false },
              { label: 'Status', value: org?.status, mono: false },
              { label: 'Org ID', value: org?.id,     mono: true  },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2.5
                           border-b border-gray-100 last:border-0"
              >
                <span className="text-sm text-gray-500">{row.label}</span>
                <span className={clsx(
                  'text-sm text-gray-900',
                  row.mono && 'font-mono text-xs'
                )}>
                  {row.value ?? '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Budget & Alerts ───────────────────────────────────── */}
      <Section
        title="Budget & Alerts"
        subtitle="Set a monthly spend cap. Alerted at 80%, blocked at 100%."
      >
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-gray-100 rounded-lg" />
            <div className="h-10 bg-gray-100 rounded-lg" />
          </div>
        ) : (
          <div className="space-y-4">
            {budgetError && (
              <div className="px-3 py-2.5 bg-red-50 border border-red-200
                              rounded-lg text-sm text-red-700">
                {budgetError}
              </div>
            )}

            <div>
              <label className="label">Monthly budget (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2
                                 text-gray-400 text-sm">$</span>
                <input
                  className="input pl-7"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 100.00"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Set to 0 for unlimited spend
              </p>
            </div>

            <div className="flex gap-2">
              {[
                { label: '80% — Alert sent',        color: 'warning' as const },
                { label: '100% — Requests blocked', color: 'error'   as const },
              ].map((t) => (
                <div
                  key={t.label}
                  className="flex-1 flex items-center gap-2 px-3 py-2
                             bg-gray-50 rounded-lg border border-gray-100"
                >
                  <Badge label={t.label} variant={t.color} />
                </div>
              ))}
            </div>

            <div>
              <label className="label">Alert email</label>
              <input
                className="input"
                type="email"
                placeholder="alerts@yourcompany.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Slack webhook URL</label>
              <input
                className="input"
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={slack}
                onChange={(e) => setSlack(e.target.value)}
              />
            </div>

            <button
              onClick={handleBudgetSave}
              disabled={saving}
              className={clsx(
                'btn-primary w-full transition-all',
                saved && 'bg-green-600 hover:bg-green-600'
              )}
            >
              {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
            </button>
          </div>
        )}
      </Section>

      {/* ── Provider Credentials ──────────────────────────────── */}
      <Section
        title="Provider Credentials"
        subtitle="Add your LLM provider API keys. Encrypted with AES-256 at rest."
      >
        <div className="space-y-4">
          {credError && (
            <div className="px-3 py-2.5 bg-red-50 border border-red-200
                            rounded-lg text-sm text-red-700">
              {credError}
            </div>
          )}

          {/* Provider selector */}
          <div>
            <label className="label">Provider</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={clsx(
                    'px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                    provider === p
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                  )}
                >
                  {PROVIDER_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">API Key</label>
            <input
              className="input font-mono"
              type="password"
              placeholder={
                provider === 'openai'       ? 'sk-...'        :
                provider === 'anthropic'    ? 'sk-ant-...'    :
                provider === 'gemini'       ? 'AIza...'       :
                'https://resource.openai.azure.com/...|key'
              }
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            {provider === 'azure_openai' && (
              <p className="text-xs text-amber-600 mt-1">
                Format: base_url|api_key
              </p>
            )}
          </div>

          <div>
            <label className="label">Label (optional)</label>
            <input
              className="input"
              placeholder="default"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              Use labels to manage multiple keys per provider
            </p>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2.5 p-3 bg-green-50
                          border border-green-200 rounded-lg">
            <svg className="w-4 h-4 text-green-600 shrink-0 mt-0.5"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955
                   11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824
                   10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052
                   -.382-3.016z" />
            </svg>
            <p className="text-xs text-green-700">
              Keys are encrypted with AES-256-GCM before storage.
              Decrypted only in memory at request time — never logged.
            </p>
          </div>

          <button
            onClick={handleCredSave}
            disabled={credSaving}
            className={clsx(
              'btn-primary w-full',
              credSaved && 'bg-green-600 hover:bg-green-600'
            )}
          >
            {credSaving
              ? 'Saving…'
              : credSaved
              ? '✓ Saved!'
              : `Save ${PROVIDER_LABELS[provider]} Key`}
          </button>
        </div>
      </Section>
    </div>
  );
}
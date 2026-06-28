import { useState }       from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApiKeys }     from '@/hooks/useApiKeys';
import Table              from '@/components/ui/Table';
import Badge              from '@/components/ui/Badge';
import Modal              from '@/components/ui/Modal';
import { ApiKey }         from '@/types';
import { formatDateTime, formatDate } from '@/utils/formatters';
import clsx               from 'clsx';

const AVAILABLE_SCOPES = ['chat', 'summarization', 'translation', 'embeddings'];

// ── Create Key Modal ───────────────────────────────────────────
function CreateKeyModal({
  open,
  onClose,
  onCreate,
}: {
  open:     boolean;
  onClose:  () => void;
  onCreate: (data: { name: string; scopes: string[] }) => Promise<ApiKey>;
}) {
  const [name,      setName]      = useState('');
  const [scopes,    setScopes]    = useState<string[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied,    setCopied]    = useState(false);

  const toggleScope = (scope: string) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    try {
      setLoading(true);
      setError(null);
      const key = await onCreate({ name: name.trim(), scopes });
      setCreatedKey(key.plaintext_key ?? null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setName('');
    setScopes([]);
    setError(null);
    setCreatedKey(null);
    setCopied(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create API Key" width="md">
      {createdKey ? (
        /* ── Key reveal screen ── */
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border
                          border-amber-200 rounded-xl">
            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667
                   1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34
                   16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">
                Copy this key now
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                This is the only time the full key will be shown.
                It cannot be retrieved later.
              </p>
            </div>
          </div>

          <div>
            <label className="label">Your new API key</label>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2.5 bg-gray-900 text-green-400
                               text-xs rounded-lg font-mono break-all select-all">
                {createdKey}
              </code>
            </div>
            <button
              onClick={handleCopy}
              className={clsx(
                'mt-2 w-full py-2 rounded-lg text-sm font-medium transition-all',
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {copied ? '✓ Copied!' : 'Copy to clipboard'}
            </button>
          </div>

          <div className="pt-1">
            <p className="text-xs text-gray-500 mb-3">Use this key in your requests:</p>
            <code className="block px-3 py-2.5 bg-gray-900 text-gray-300
                             text-xs rounded-lg font-mono leading-relaxed">
              <span className="text-blue-400">curl</span>{' '}
              <span className="text-green-400">-H</span>{' '}
              <span className="text-yellow-300">"x-proxy-key: {createdKey.slice(0, 20)}..."</span>
              {' '}\{'\n'}
              {'     '}<span className="text-green-400">-H</span>{' '}
              <span className="text-yellow-300">"x-feature: chat"</span>{' '}
              \{'\n'}
              {'     '}http://localhost:3000/v1/proxy/openai
            </code>
          </div>

          <button onClick={handleClose} className="btn-primary w-full">
            Done
          </button>
        </div>
      ) : (
        /* ── Create form ── */
        <div className="space-y-4">
          {error && (
            <div className="px-3 py-2.5 bg-red-50 border border-red-200
                            rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="label">Key name</label>
            <input
              className="input"
              placeholder="e.g. Production App, Dev Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div>
            <label className="label">Scopes</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {AVAILABLE_SCOPES.map((scope) => (
                <button
                  key={scope}
                  onClick={() => toggleScope(scope)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                    scopes.includes(scope)
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                  )}
                >
                  {scope}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Leave empty to allow all features
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Creating…' : 'Create Key'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Revoke Confirm Modal ───────────────────────────────────────
function RevokeModal({
  open,
  keyName,
  onClose,
  onConfirm,
}: {
  open:      boolean;
  keyName:   string;
  onClose:   () => void;
  onConfirm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Revoke API Key" width="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-red-50 border
                        border-red-200 rounded-xl">
          <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0
                 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-800">
              This action is irreversible
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              <strong>{keyName}</strong> will be permanently revoked.
              Any apps using it will immediately lose access.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="btn-danger flex-1"
          >
            {loading ? 'Revoking…' : 'Revoke Key'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function ApiKeysPage() {
  const { user }                          = useAuth();
  const orgId                             = user?.organization_id ?? '';
  const { keys, loading, create, revoke } = useApiKeys(orgId);
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

  const columns = [
    {
      key:    'name',
      header: 'Name',
      render: (row: ApiKey) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{row.key_prefix}••••••••</p>
        </div>
      ),
    },
    {
      key:    'scopes',
      header: 'Scopes',
      render: (row: ApiKey) =>
        row.scopes.length === 0 ? (
          <span className="text-xs text-gray-400">All features</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {row.scopes.map((s) => (
              <Badge key={s} label={s} variant="info" />
            ))}
          </div>
        ),
    },
    {
      key:    'status',
      header: 'Status',
      render: (row: ApiKey) => (
        <Badge
          label={row.is_active ? 'Active' : 'Revoked'}
          variant={row.is_active ? 'success' : 'error'}
          dot
        />
      ),
    },
    {
      key:    'last_used_at',
      header: 'Last Used',
      render: (row: ApiKey) => (
        <span className="text-gray-500 text-xs">
          {row.last_used_at ? formatDateTime(row.last_used_at) : 'Never'}
        </span>
      ),
    },
    {
      key:    'expires_at',
      header: 'Expires',
      render: (row: ApiKey) => (
        <span className="text-gray-500 text-xs">
          {row.expires_at ? formatDate(row.expires_at) : 'Never'}
        </span>
      ),
    },
    {
      key:    'created_at',
      header: 'Created',
      render: (row: ApiKey) => (
        <span className="text-gray-500 text-xs">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key:    'actions',
      header: '',
      render: (row: ApiKey) =>
        row.is_active ? (
          <button
            onClick={() => setRevokeTarget(row)}
            className="text-xs text-red-600 hover:text-red-700 font-medium
                       hover:underline transition-colors"
          >
            Revoke
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">API Keys</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {keys.filter((k) => k.is_active).length} active key
            {keys.filter((k) => k.is_active).length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 4v16m8-8H4" />
          </svg>
          New Key
        </button>
      </div>

      {/* Usage hint */}
      <div className="card p-4 bg-gray-50 border-gray-100">
        <p className="text-xs text-gray-600 font-medium mb-1">
          How to use your proxy key
        </p>
        <code className="text-xs text-gray-500 font-mono">
          curl -X POST http://localhost:3000/v1/proxy/openai \<br />
          {'  '}-H "x-proxy-key: YOUR_KEY" \<br />
          {'  '}-H "x-feature: chat" \<br />
          {'  '}-d {'{"model":"gpt-4o-mini","messages":[...]}'}
        </code>
      </div>

      {/* Keys table */}
      <div className="card">
        <Table
          columns={columns}
          data={keys}
          loading={loading}
          rowKey={(row) => row.id}
          empty="No API keys yet. Create one to get started."
        />
      </div>

      {/* Modals */}
      <CreateKeyModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={create}
      />
      <RevokeModal
        open={!!revokeTarget}
        keyName={revokeTarget?.name ?? ''}
        onClose={() => setRevokeTarget(null)}
        onConfirm={() => revoke(revokeTarget!.id)}
      />
    </div>
  );
}
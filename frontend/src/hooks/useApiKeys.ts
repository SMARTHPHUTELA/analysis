import { useState, useEffect, useCallback } from 'react';
import { keyApi }  from '@/services/api';
import { ApiKey }  from '@/types';

export function useApiKeys(orgId: string) {
  const [keys,    setKeys]    = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await keyApi.list(orgId);
      setKeys(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = useCallback(async (data: {
    name: string;
    scopes?: string[];
    expiresAt?: string;
  }) => {
    const newKey = await keyApi.create(orgId, data);
    await fetch();
    return newKey; // contains plaintext_key
  }, [orgId, fetch]);

  const revoke = useCallback(async (keyId: string) => {
    await keyApi.revoke(orgId, keyId);
    await fetch();
  }, [orgId, fetch]);

  return { keys, loading, error, refetch: fetch, create, revoke };
}
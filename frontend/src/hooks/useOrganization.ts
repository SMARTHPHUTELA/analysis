import { useState, useEffect, useCallback } from 'react';
import { orgApi }        from '@/services/api';
import { Organization }  from '@/types';

export function useOrganization(orgId: string) {
  const [org,     setOrg]     = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await orgApi.getOne(orgId);
      setOrg(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { fetch(); }, [fetch]);

  const update = useCallback(async (updates: Parameters<typeof orgApi.update>[1]) => {
    const updated = await orgApi.update(orgId, updates);
    setOrg(updated);
    return updated;
  }, [orgId]);

  return { org, loading, error, refetch: fetch, update };
}

export function useOrganizations() {
  const [orgs,    setOrgs]    = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orgApi.list();
      setOrgs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { orgs, loading, error, refetch: fetch };
}
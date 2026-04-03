import { useState, useEffect, useCallback } from 'react';
import type { Anomaly } from '../types/index';

export function useAnomalies() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnomalies = useCallback(async () => {
    try {
      const res = await fetch('/api/anomalies');
      if (res.ok) {
        const data: Anomaly[] = await res.json();
        setAnomalies(data);
      }
    } catch (err) {
      console.error('[useAnomalies]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  const dismissAnomaly = useCallback(async (anomalyId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/anomalies/${anomalyId}/dismiss`, { method: 'PATCH' });
      if (res.ok) {
        setAnomalies(prev => prev.filter(a => a.id !== anomalyId));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return { anomalies, setAnomalies, loading, refetch: fetchAnomalies, dismissAnomaly };
}

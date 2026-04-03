import { useEffect, useCallback } from 'react';
import { useGymContext } from '../store/GymContext';
import type { Gym } from '../types/index';

export function useGymData() {
  const { setGyms, setAnomalyCount } = useGymContext();

  const fetchGyms = useCallback(async () => {
    try {
      const [gymsRes, anomalyRes] = await Promise.all([
        fetch('/api/gyms'),
        fetch('/api/anomalies'),
      ]);
      if (gymsRes.ok) {
        const gyms: Gym[] = await gymsRes.json();
        setGyms(gyms);
      }
      if (anomalyRes.ok) {
        const anomalies: unknown[] = await anomalyRes.json();
        setAnomalyCount(anomalies.length);
      }
    } catch (err) {
      console.error('[useGymData] Fetch error:', err);
    }
  }, [setGyms, setAnomalyCount]);

  useEffect(() => {
    fetchGyms();
    // Refresh every 60s as fallback
    const timer = setInterval(fetchGyms, 60_000);
    return () => clearInterval(timer);
  }, [fetchGyms]);

  return { refetch: fetchGyms };
}

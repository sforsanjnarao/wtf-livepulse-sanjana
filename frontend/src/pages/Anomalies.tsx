import React, { useEffect } from 'react';
import { useGymContext } from '../store/GymContext';
import { AnomalyTable } from '../components/AnomalyTable';
import { useAnomalies } from '../hooks/useAnomalies';

export function Anomalies() {
  const { state, setAnomalyCount, decrementAnomalyCount } = useGymContext();
  const { anomalies, setAnomalies, loading, refetch, dismissAnomaly } = useAnomalies();

  // Sync anomaly count in context with actual fetched data
  useEffect(() => {
    const activeCount = anomalies.filter(a => !a.resolved && !a.dismissed).length;
    setAnomalyCount(activeCount);
  }, [anomalies, setAnomalyCount]);

  // Refetch when WS delivers new anomaly events
  useEffect(() => {
    refetch();
  }, [state.anomalyCount, refetch]);

  const handleDismiss = async (id: string): Promise<boolean> => {
    const ok = await dismissAnomaly(id);
    if (ok) decrementAnomalyCount();
    return ok;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#E2E8F0] mb-1">Anomaly Detection Log</h1>
          <p className="text-sm text-[#64748B]">Real-time alerts across all gym locations · refreshes every 30s</p>
        </div>
        <button
          onClick={refetch}
          className="px-4 py-2 text-sm border border-[#252540] text-[#64748B] rounded-md hover:text-[#14B8A6] hover:border-[#14B8A6]/40 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="label mb-1">Total Anomalies</p>
          <p className="text-3xl font-bold font-mono text-[#E2E8F0]">{anomalies.length}</p>
        </div>
        <div className="card p-4">
          <p className="label mb-1">Critical</p>
          <p className="text-3xl font-bold font-mono text-red-400">
            {anomalies.filter(a => a.severity === 'critical' && !a.resolved).length}
          </p>
        </div>
        <div className="card p-4">
          <p className="label mb-1">Warnings</p>
          <p className="text-3xl font-bold font-mono text-yellow-400">
            {anomalies.filter(a => a.severity === 'warning' && !a.resolved).length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-[#14B8A6] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-[#64748B] text-sm">Loading anomalies…</p>
        </div>
      ) : (
        <AnomalyTable anomalies={anomalies} onDismiss={handleDismiss} />
      )}
    </div>
  );
}

import React, { useState } from 'react';
import type { Anomaly } from '../types/index';

interface Props {
  anomalies: Anomaly[];
  onDismiss: (id: string) => Promise<boolean>;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
}

const TYPE_LABELS: Record<string, string> = {
  zero_checkins: 'Zero Check-ins',
  capacity_breach: 'Capacity Breach',
  revenue_drop: 'Revenue Drop',
};

export function AnomalyTable({ anomalies, onDismiss }: Props) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState<Set<string>>(new Set());

  const handleDismiss = async (id: string) => {
    setDismissing(prev => new Set(prev).add(id));
    const ok = await onDismiss(id);
    setDismissing(prev => { const s = new Set(prev); s.delete(id); return s; });
    if (ok) setConfirming(null);
  };

  if (anomalies.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <p className="text-[#E2E8F0] font-medium">No active anomalies</p>
        <p className="text-[#64748B] text-sm mt-1">All systems operating normally</p>
      </div>
    );
  }

  return (
    <>
      {/* Confirmation modal */}
      {confirming && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card p-6 max-w-sm w-full mx-4 border border-[#14B8A6]/30">
            <h3 className="text-lg font-semibold text-[#E2E8F0] mb-2">Dismiss Anomaly?</h3>
            <p className="text-sm text-[#64748B] mb-6">
              This will mark the anomaly as dismissed. You can still see it until it resolves automatically.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDismiss(confirming)}
                disabled={dismissing.has(confirming)}
                className="flex-1 py-2 rounded-md bg-[#14B8A6] text-[#0D0D1A] font-semibold text-sm hover:bg-[#0D9488] disabled:opacity-50"
              >
                {dismissing.has(confirming) ? 'Dismissing...' : 'Dismiss'}
              </button>
              <button
                onClick={() => setConfirming(null)}
                className="flex-1 py-2 rounded-md border border-[#252540] text-[#64748B] text-sm hover:text-[#E2E8F0]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#252540] bg-[#0D0D1A]">
              <th className="label px-4 py-3 text-left">Gym</th>
              <th className="label px-4 py-3 text-left">Type</th>
              <th className="label px-4 py-3 text-left">Severity</th>
              <th className="label px-4 py-3 text-left">Detected</th>
              <th className="label px-4 py-3 text-left">Status</th>
              <th className="label px-4 py-3 text-left">Message</th>
              <th className="label px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#252540]">
            {anomalies.map((a) => (
              <tr key={a.id} className="hover:bg-[#252540]/30 transition-colors">
                <td className="px-4 py-3 text-[#E2E8F0] font-medium whitespace-nowrap">
                  {(a.gym_name ?? a.gym_id).replace('WTF Gyms — ', '')}
                </td>
                <td className="px-4 py-3 text-[#E2E8F0] whitespace-nowrap">
                  {TYPE_LABELS[a.type] ?? a.type}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    a.severity === 'critical'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {a.severity === 'critical' ? '🔴' : '⚠️'} {a.severity.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#64748B] whitespace-nowrap text-xs">
                  {formatTime(a.detected_at)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {a.resolved ? (
                    <span className="text-green-400 text-xs font-medium">✓ Resolved</span>
                  ) : a.dismissed ? (
                    <span className="text-[#64748B] text-xs font-medium">Dismissed</span>
                  ) : (
                    <span className="text-red-400 text-xs font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[#64748B] text-xs max-w-xs">
                  <span className="truncate block" title={a.message}>{a.message}</span>
                </td>
                <td className="px-4 py-3">
                  {a.severity !== 'critical' && !a.resolved && !a.dismissed ? (
                    <button
                      id={`dismiss-${a.id}`}
                      onClick={() => setConfirming(a.id)}
                      disabled={dismissing.has(a.id)}
                      className="px-3 py-1 text-xs rounded border border-[#252540] text-[#64748B] hover:text-yellow-400 hover:border-yellow-500/40 transition-colors disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  ) : (
                    <span className="text-[#252540] text-xs">
                      {a.severity === 'critical' ? '— critical' : '—'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

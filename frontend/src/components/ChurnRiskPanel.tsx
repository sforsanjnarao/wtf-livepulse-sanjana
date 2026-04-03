import React from 'react';
import type { ChurnRiskMember } from '../types/index';

interface Props {
  members: ChurnRiskMember[];
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function ChurnRiskPanel({ members }: Props) {
  if (members.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-green-400 font-medium">✓ No churn risk members</p>
        <p className="text-[#64748B] text-sm mt-1">All active members checked in recently</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-[#252540] flex items-center justify-between">
        <p className="label">Churn Risk Members</p>
        <span className="text-xs text-[#64748B]">{members.length} at risk</span>
      </div>
      <div className="overflow-y-auto max-h-72">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[#1A1A2E]">
            <tr className="border-b border-[#252540]">
              <th className="label px-4 py-2.5 text-left">Member</th>
              <th className="label px-4 py-2.5 text-left">Last Check-in</th>
              <th className="label px-4 py-2.5 text-left">Days Absent</th>
              <th className="label px-4 py-2.5 text-left">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#252540]">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-[#252540]/30 transition-colors">
                <td className="px-4 py-3 text-[#E2E8F0]">{m.name}</td>
                <td className="px-4 py-3 text-[#64748B]">{formatDate(m.last_checkin_at)}</td>
                <td className="px-4 py-3 text-[#E2E8F0] font-mono">{m.days_absent}d</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    m.risk_level === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {m.risk_level}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

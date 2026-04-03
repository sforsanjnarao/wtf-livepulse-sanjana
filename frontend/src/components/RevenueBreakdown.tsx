import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface Props {
  data: { plan_type: string; total: number }[];
  dateRange: '7d' | '30d' | '90d';
  onChangeDateRange: (r: '7d' | '30d' | '90d') => void;
}

const COLORS: Record<string, string> = {
  monthly: '#14B8A6',
  quarterly: '#8B5CF6',
  annual: '#F59E0B',
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number; name: string }[] }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A1A2E] border border-[#252540] rounded-lg p-3 text-sm">
      <p className="text-[#E2E8F0] font-semibold">₹{Number(payload[0].value).toLocaleString('en-IN')}</p>
    </div>
  );
};

export function RevenueBreakdown({ data, dateRange, onChangeDateRange }: Props) {
  const chartData = data.map(d => ({
    plan: d.plan_type.charAt(0).toUpperCase() + d.plan_type.slice(1),
    plan_raw: d.plan_type,
    total: Number(d.total),
  }));

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="label">Revenue by Plan Type</p>
        <div className="flex gap-1">
          {(['7d', '30d', '90d'] as const).map(r => (
            <button
              key={r}
              onClick={() => onChangeDateRange(r)}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                dateRange === r
                  ? 'bg-[#14B8A6] text-[#0D0D1A]'
                  : 'text-[#64748B] hover:text-[#E2E8F0] border border-[#252540]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      {chartData.length === 0 ? (
        <p className="text-[#64748B] text-sm text-center py-8">No payment data for this period</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={40}>
            <XAxis dataKey="plan" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#252540' }} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={COLORS[entry.plan_raw] ?? '#14B8A6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

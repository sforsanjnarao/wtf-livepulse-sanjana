import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { CrossGymRevenue } from '../types/index';

interface Props {
  data: CrossGymRevenue[];
}

function shortName(name: string): string {
  return name.replace('WTF Gyms — ', '').replace('Sector 18 ', '');
}

const RANK_COLORS = ['#14B8A6', '#0D9488', '#0F766E', '#115E59', '#134E4A'];

export function CrossGymRevenueChart({ data }: Props) {
  const chartData = data.map((d, i) => ({
    name: shortName(d.gym_name),
    value: Number(d.total_revenue),
    rank: d.rank,
    color: RANK_COLORS[Math.min(i, RANK_COLORS.length - 1)],
  }));

  return (
    <div className="card p-5">
      <p className="label mb-4">30-Day Revenue — All Gyms</p>
      {chartData.length === 0 ? (
        <p className="text-[#64748B] text-sm text-center py-8">No data available</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical" barSize={18} margin={{ left: 80 }}>
            <XAxis
              type="number"
              tick={{ fill: '#64748B', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#E2E8F0', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{ background: '#1A1A2E', border: '1px solid #252540', borderRadius: 8 }}
              itemStyle={{ color: '#E2E8F0' }}
              formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
              cursor={{ fill: '#252540' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

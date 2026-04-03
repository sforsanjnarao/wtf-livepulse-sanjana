import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  data: { new_count: number; renewal_count: number };
}

const COLORS = ['#14B8A6', '#8B5CF6'];

export function NewVsRenewal({ data }: Props) {
  const total = data.new_count + data.renewal_count;
  const chartData = [
    { name: 'New', value: data.new_count },
    { name: 'Renewal', value: data.renewal_count },
  ];

  const newPct = total > 0 ? ((data.new_count / total) * 100).toFixed(1) : '0';
  const renewPct = total > 0 ? ((data.renewal_count / total) * 100).toFixed(1) : '0';

  return (
    <div className="card p-5">
      <p className="label mb-4">New vs Renewal Members</p>
      {total === 0 ? (
        <p className="text-[#64748B] text-sm text-center py-8">No membership data</p>
      ) : (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="50%" height={180}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1A1A2E', border: '1px solid #252540', borderRadius: 8 }}
                itemStyle={{ color: '#E2E8F0' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full bg-[#14B8A6]" />
                <span className="text-xs text-[#64748B]">New Members</span>
              </div>
              <p className="text-2xl font-bold font-mono text-[#14B8A6]">{newPct}%</p>
              <p className="text-xs text-[#64748B]">{data.new_count.toLocaleString('en-IN')} members</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
                <span className="text-xs text-[#64748B]">Renewals</span>
              </div>
              <p className="text-2xl font-bold font-mono text-[#8B5CF6]">{renewPct}%</p>
              <p className="text-xs text-[#64748B]">{data.renewal_count.toLocaleString('en-IN')} members</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

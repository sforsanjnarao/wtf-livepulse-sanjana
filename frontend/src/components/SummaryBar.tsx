import React from 'react';
import { useGymContext } from '../store/GymContext';
import { AnimatedNumber } from './AnimatedNumber';

export function SummaryBar() {
  const { state } = useGymContext();
  const { gyms, occupancyMap, revenueMap, anomalyCount } = state;

  const totalOccupancy = Object.values(occupancyMap).reduce((a, b) => a + b, 0);
  const totalRevenue = Object.values(revenueMap).reduce((a, b) => a + b, 0);
  const totalCapacity = gyms.reduce((a, g) => a + g.capacity, 0);
  const capacityPct = totalCapacity > 0 ? ((totalOccupancy / totalCapacity) * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="card p-4">
        <p className="label mb-1">Total Checked In</p>
        <div className="flex items-end gap-2">
          <AnimatedNumber value={totalOccupancy} className="text-3xl font-bold text-[#E2E8F0] font-mono" />
          <span className="text-sm text-[#64748B] mb-0.5">/ {totalCapacity.toLocaleString('en-IN')}</span>
        </div>
        <p className="text-xs text-[#14B8A6] mt-1">{capacityPct}% capacity</p>
      </div>

      <div className="card p-4">
        <p className="label mb-1">Today's Revenue (All Gyms)</p>
        <AnimatedNumber
          value={Math.round(totalRevenue)}
          formatter={(n) => `₹${n.toLocaleString('en-IN')}`}
          className="text-3xl font-bold text-[#14B8A6] font-mono"
        />
        <p className="text-xs text-[#64748B] mt-1">across {gyms.length} locations</p>
      </div>

      <div className="card p-4">
        <p className="label mb-1">Active Anomalies</p>
        <AnimatedNumber
          value={anomalyCount}
          className={`text-3xl font-bold font-mono ${
            anomalyCount === 0 ? 'text-green-400' : anomalyCount > 2 ? 'text-red-400' : 'text-yellow-400'
          }`}
        />
        <p className="text-xs text-[#64748B] mt-1">
          {anomalyCount === 0 ? 'All clear' : 'Requires attention'}
        </p>
      </div>
    </div>
  );
}

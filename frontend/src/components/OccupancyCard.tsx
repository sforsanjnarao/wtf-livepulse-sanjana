import React from 'react';
import { useGymContext } from '../store/GymContext';
import { AnimatedNumber } from './AnimatedNumber';

export function OccupancyCard() {
  const { state } = useGymContext();
  const { selectedGymId, occupancyMap, gyms } = state;

  const gym = gyms.find(g => g.id === selectedGymId);
  const occupancy = selectedGymId ? (occupancyMap[selectedGymId] ?? 0) : 0;
  const capacity = gym?.capacity ?? 1;
  const pct = parseFloat(((occupancy / capacity) * 100).toFixed(1));

  const colorClass =
    pct > 85 ? 'text-red-400' :
    pct > 60 ? 'text-yellow-400' :
    'text-green-400';

  const barColor =
    pct > 85 ? 'bg-red-500' :
    pct > 60 ? 'bg-yellow-500' :
    'bg-[#14B8A6]';

  return (
    <div className="card p-6">
      <p className="label mb-3">Live Occupancy</p>
      <div className="flex items-baseline gap-3 mb-4">
        <AnimatedNumber value={occupancy} className={`text-5xl font-bold font-mono ${colorClass}`} />
        <div className="text-[#64748B]">
          <span className="text-xl">/ {capacity}</span>
          <p className="text-xs mt-0.5">members</p>
        </div>
      </div>
      <div className="w-full bg-[#252540] rounded-full h-3 mb-2">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className={`text-sm font-medium ${colorClass}`}>{pct}% capacity</p>
    </div>
  );
}

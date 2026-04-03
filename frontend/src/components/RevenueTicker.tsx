import React from 'react';
import { useGymContext } from '../store/GymContext';
import { AnimatedNumber } from './AnimatedNumber';

export function RevenueTicker() {
  const { state } = useGymContext();
  const { selectedGymId, revenueMap } = state;

  const revenue = selectedGymId ? (revenueMap[selectedGymId] ?? 0) : 0;

  return (
    <div className="card p-6">
      <p className="label mb-3">Today's Revenue</p>
      <AnimatedNumber
        value={Math.round(revenue)}
        formatter={(n) => `₹${n.toLocaleString('en-IN')}`}
        className="text-4xl font-bold font-mono text-[#14B8A6]"
      />
      <p className="text-xs text-[#64748B] mt-2">live accumulating</p>
    </div>
  );
}

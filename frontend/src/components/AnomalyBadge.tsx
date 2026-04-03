import React from 'react';
import { useGymContext } from '../store/GymContext';

export function AnomalyBadge() {
  const { state } = useGymContext();
  const { anomalyCount } = state;

  if (anomalyCount === 0) return null;

  return (
    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-red-500 text-white ml-1.5">
      {anomalyCount > 9 ? '9+' : anomalyCount}
    </span>
  );
}

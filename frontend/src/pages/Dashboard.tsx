import React from 'react';
import { useGymContext } from '../store/GymContext';
import { SummaryBar } from '../components/SummaryBar';
import { OccupancyCard } from '../components/OccupancyCard';
import { RevenueTicker } from '../components/RevenueTicker';
import { ActivityFeed } from '../components/ActivityFeed';
import { SimulatorControls } from '../components/SimulatorControls';

export function Dashboard() {
  const { state, setSelectedGym } = useGymContext();
  const { gyms, selectedGymId } = state;

  const handleStart = async (speed: 1 | 5 | 10) => {
    await fetch('/api/simulator/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed }),
    });
  };

  const handleStop = async () => {
    await fetch('/api/simulator/stop', { method: 'POST' });
  };

  const handleReset = async () => {
    await fetch('/api/simulator/reset', { method: 'POST' });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#E2E8F0] mb-1">Live Gym Operations</h1>
        <p className="text-sm text-[#64748B]">Real-time view across all WTF Gym locations</p>
      </div>

      {/* Summary bar */}
      <SummaryBar />

      {/* Gym selector */}
      <div className="mb-6">
        <label className="label mb-2 block">Select Gym</label>
        <select
          id="gym-selector"
          value={selectedGymId ?? ''}
          onChange={(e) => setSelectedGym(e.target.value)}
          className="bg-[#1A1A2E] border border-[#252540] text-[#E2E8F0] rounded-md px-4 py-2.5 text-sm
                     focus:outline-none focus:border-[#14B8A6] transition-colors cursor-pointer w-72"
        >
          {gyms.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <OccupancyCard />
        <RevenueTicker />
        <div className="card p-5">
          <p className="label mb-3">Selected Gym</p>
          {gyms.find(g => g.id === selectedGymId) ? (() => {
            const gym = gyms.find(g => g.id === selectedGymId)!;
            return (
              <div className="space-y-2">
                <p className="text-lg font-semibold text-[#E2E8F0]">{gym.name}</p>
                <p className="text-sm text-[#64748B]">{gym.city}</p>
                <div className="flex items-center gap-4 mt-3">
                  <div>
                    <p className="label mb-0.5">Capacity</p>
                    <p className="text-xl font-bold font-mono text-[#E2E8F0]">{gym.capacity}</p>
                  </div>
                  <div>
                    <p className="label mb-0.5">Status</p>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                      {gym.status}
                    </span>
                  </div>
                  <div>
                    <p className="label mb-0.5">Hours</p>
                    <p className="text-xs text-[#64748B]">{gym.opens_at} — {gym.closes_at}</p>
                  </div>
                </div>
              </div>
            );
          })() : <p className="text-[#64748B] text-sm">Select a gym above</p>}
        </div>
      </div>

      {/* Activity feed + Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed />
        <div className="space-y-4">
          <SimulatorControls onStart={handleStart} onStop={handleStop} onReset={handleReset} />
          <div className="card p-5">
            <p className="label mb-3">All Gyms — Live Overview</p>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {gyms.map(g => {
                const occ = state.occupancyMap[g.id] ?? g.current_occupancy;
                const pct = parseFloat(((occ / g.capacity) * 100).toFixed(1));
                const barColor = pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : 'bg-[#14B8A6]';
                return (
                  <div
                    key={g.id}
                    className="cursor-pointer group"
                    onClick={() => setSelectedGym(g.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium truncate transition-colors ${
                        g.id === selectedGymId ? 'text-[#14B8A6]' : 'text-[#E2E8F0] group-hover:text-[#14B8A6]'
                      }`}>
                        {g.name.replace('WTF Gyms — ', '')}
                      </span>
                      <span className="text-xs text-[#64748B] ml-2 flex-shrink-0">{occ}/{g.capacity}</span>
                    </div>
                    <div className="w-full bg-[#252540] rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

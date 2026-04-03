import React from 'react';
import { useGymContext } from '../store/GymContext';
import { LiveIndicator } from './LiveIndicator';
import { AnomalyBadge } from './AnomalyBadge';

type Page = 'dashboard' | 'analytics' | 'anomalies';

interface Props {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '⚡' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'anomalies', label: 'Anomalies', icon: '🔔' },
];

export function Layout({ children, currentPage, onNavigate }: Props) {
  const { state } = useGymContext();

  return (
    <div className="min-h-screen bg-[#0D0D1A] flex flex-col">
      {/* Top bar */}
      <header className="bg-[#1A1A2E] border-b border-[#252540] px-6 py-3 flex items-center gap-6 sticky top-0 z-40">
        {/* Branding */}
        <div className="flex items-center gap-3 mr-4">
          <div className="w-8 h-8 bg-[#14B8A6] rounded-md flex items-center justify-center font-bold text-[#0D0D1A] text-sm">
            W
          </div>
          <div>
            <p className="text-sm font-bold text-[#E2E8F0] leading-none">WTF LivePulse</p>
            <p className="text-[10px] text-[#64748B] font-mono leading-none mt-0.5">Real-Time Intelligence</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                currentPage === item.id
                  ? 'bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/30'
                  : 'text-[#64748B] hover:text-[#E2E8F0] hover:bg-[#252540]'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'anomalies' && <AnomalyBadge />}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-4">
          <span className="text-xs text-[#64748B] font-mono">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          <LiveIndicator connected={state.wsConnected} />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
}

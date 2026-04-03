import React from 'react';
import { useGymContext } from '../store/GymContext';

const EVENT_ICONS: Record<string, string> = {
  CHECKIN_EVENT: '→',
  CHECKOUT_EVENT: '←',
  PAYMENT_EVENT: '₹',
};

const EVENT_COLORS: Record<string, string> = {
  CHECKIN_EVENT: 'text-[#14B8A6]',
  CHECKOUT_EVENT: 'text-[#64748B]',
  PAYMENT_EVENT: 'text-yellow-400',
};

const EVENT_LABELS: Record<string, string> = {
  CHECKIN_EVENT: 'Checked In',
  CHECKOUT_EVENT: 'Checked Out',
  PAYMENT_EVENT: 'Payment',
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export function ActivityFeed() {
  const { state } = useGymContext();
  const { activityFeed, gyms } = state;

  const getGymName = (gymId: string) => gyms.find(g => g.id === gymId)?.name ?? gymId;

  return (
    <div className="card p-5 flex flex-col h-full">
      <p className="label mb-4">Live Activity Feed</p>
      <div className="flex-1 overflow-y-auto space-y-2 max-h-64 pr-1">
        {activityFeed.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[#64748B] text-sm">Waiting for events… Start the simulator.</p>
          </div>
        ) : (
          activityFeed.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-3 p-2.5 rounded-md bg-[#0D0D1A] border border-[#252540] hover:border-[#14B8A6]/30 transition-colors"
            >
              <span className={`text-lg font-bold w-5 text-center flex-shrink-0 ${EVENT_COLORS[ev.type]}`}>
                {EVENT_ICONS[ev.type]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#E2E8F0] font-medium truncate">{ev.member_name}</p>
                <p className="text-xs text-[#64748B] truncate">
                  {EVENT_LABELS[ev.type]} · {getGymName(ev.gym_id).replace('WTF Gyms — ', '')}
                  {ev.detail ? ` · ${ev.detail}` : ''}
                </p>
              </div>
              <span className="text-xs text-[#64748B] flex-shrink-0">{timeAgo(ev.timestamp)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

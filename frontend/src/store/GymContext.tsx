import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { Gym, Anomaly, ActivityEvent, WSEvent } from '../types/index';

// ─── State shape ──────────────────────────────────────────────────────────────
interface GymState {
  gyms: Gym[];
  selectedGymId: string | null;
  occupancyMap: Record<string, number>;   // gym_id -> current occupancy
  revenueMap: Record<string, number>;     // gym_id -> today's revenue
  activityFeed: ActivityEvent[];          // last 20 events
  anomalyCount: number;                   // unread anomaly badge
  wsConnected: boolean;
}

// ─── Actions ──────────────────────────────────────────────────────────────────
type Action =
  | { type: 'SET_GYMS'; gyms: Gym[] }
  | { type: 'SET_SELECTED_GYM'; gymId: string }
  | { type: 'SET_WS_CONNECTED'; connected: boolean }
  | { type: 'SET_ANOMALY_COUNT'; count: number }
  | { type: 'DECREMENT_ANOMALY_COUNT' }
  | { type: 'UPDATE_FROM_WS'; event: WSEvent };

// ─── Reducer ──────────────────────────────────────────────────────────────────
function gymReducer(state: GymState, action: Action): GymState {
  switch (action.type) {
    case 'SET_GYMS': {
      const occupancyMap: Record<string, number> = {};
      const revenueMap: Record<string, number> = {};
      for (const g of action.gyms) {
        occupancyMap[g.id] = g.current_occupancy;
        revenueMap[g.id] = Number(g.today_revenue);
      }
      return {
        ...state,
        gyms: action.gyms,
        occupancyMap,
        revenueMap,
        selectedGymId: state.selectedGymId ?? (action.gyms[0]?.id ?? null),
      };
    }
    case 'SET_SELECTED_GYM':
      return { ...state, selectedGymId: action.gymId };

    case 'SET_WS_CONNECTED':
      return { ...state, wsConnected: action.connected };

    case 'SET_ANOMALY_COUNT':
      return { ...state, anomalyCount: action.count };

    case 'DECREMENT_ANOMALY_COUNT':
      return { ...state, anomalyCount: Math.max(0, state.anomalyCount - 1) };

    case 'UPDATE_FROM_WS': {
      const ev = action.event;

      if (ev.type === 'CHECKIN_EVENT' || ev.type === 'CHECKOUT_EVENT') {
        const newOccupancy = { ...state.occupancyMap, [ev.gym_id]: ev.current_occupancy };
        const activityItem: ActivityEvent = {
          id: `${ev.type}-${Date.now()}-${Math.random()}`,
          type: ev.type,
          gym_id: ev.gym_id,
          member_name: ev.member_name,
          timestamp: ev.timestamp,
          detail: `${ev.capacity_pct}% capacity`,
        };
        const feed = [activityItem, ...state.activityFeed].slice(0, 20);
        return { ...state, occupancyMap: newOccupancy, activityFeed: feed };
      }

      if (ev.type === 'PAYMENT_EVENT') {
        const newRevenue = { ...state.revenueMap, [ev.gym_id]: ev.today_total };
        const activityItem: ActivityEvent = {
          id: `PAYMENT-${Date.now()}-${Math.random()}`,
          type: 'PAYMENT_EVENT',
          gym_id: ev.gym_id,
          member_name: ev.member_name,
          timestamp: new Date().toISOString(),
          detail: `₹${ev.amount.toLocaleString('en-IN')} — ${ev.plan_type}`,
        };
        const feed = [activityItem, ...state.activityFeed].slice(0, 20);
        return { ...state, revenueMap: newRevenue, activityFeed: feed };
      }

      if (ev.type === 'ANOMALY_DETECTED') {
        return { ...state, anomalyCount: state.anomalyCount + 1 };
      }

      if (ev.type === 'ANOMALY_RESOLVED') {
        return { ...state, anomalyCount: Math.max(0, state.anomalyCount - 1) };
      }

      return state;
    }
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface GymContextValue {
  state: GymState;
  setGyms: (gyms: Gym[]) => void;
  setSelectedGym: (gymId: string) => void;
  setWsConnected: (connected: boolean) => void;
  setAnomalyCount: (count: number) => void;
  decrementAnomalyCount: () => void;
  updateFromWSEvent: (event: WSEvent) => void;
}

const GymContext = createContext<GymContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function GymProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gymReducer, {
    gyms: [],
    selectedGymId: null,
    occupancyMap: {},
    revenueMap: {},
    activityFeed: [],
    anomalyCount: 0,
    wsConnected: false,
  });

  const setGyms = useCallback((gyms: Gym[]) => dispatch({ type: 'SET_GYMS', gyms }), []);
  const setSelectedGym = useCallback((gymId: string) => dispatch({ type: 'SET_SELECTED_GYM', gymId }), []);
  const setWsConnected = useCallback((connected: boolean) => dispatch({ type: 'SET_WS_CONNECTED', connected }), []);
  const setAnomalyCount = useCallback((count: number) => dispatch({ type: 'SET_ANOMALY_COUNT', count }), []);
  const decrementAnomalyCount = useCallback(() => dispatch({ type: 'DECREMENT_ANOMALY_COUNT' }), []);
  const updateFromWSEvent = useCallback((event: WSEvent) => dispatch({ type: 'UPDATE_FROM_WS', event }), []);

  return (
    <GymContext.Provider value={{ state, setGyms, setSelectedGym, setWsConnected, setAnomalyCount, decrementAnomalyCount, updateFromWSEvent }}>
      {children}
    </GymContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useGymContext(): GymContextValue {
  const ctx = useContext(GymContext);
  if (!ctx) throw new Error('useGymContext must be used within GymProvider');
  return ctx;
}

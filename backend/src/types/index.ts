// ============================================================
// Database entity types
// ============================================================

export interface Gym {
  id: string;
  name: string;
  city: string;
  address: string | null;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  opens_at: string;
  closes_at: string;
  created_at: string;
  updated_at: string;
}

export interface GymWithStats extends Gym {
  current_occupancy: number;
  today_revenue: number;
}

export interface Member {
  id: string;
  gym_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  plan_type: 'monthly' | 'quarterly' | 'annual';
  member_type: 'new' | 'renewal';
  status: 'active' | 'inactive' | 'frozen';
  joined_at: string;
  plan_expires_at: string;
  last_checkin_at: string | null;
  created_at: string;
}

export interface Checkin {
  id: number;
  member_id: string;
  gym_id: string;
  checked_in: string;
  checked_out: string | null;
  duration_min: number | null;
}

export interface CheckinWithMember extends Checkin {
  member_name: string;
  gym_name: string;
}

export interface Payment {
  id: string;
  member_id: string;
  gym_id: string;
  amount: number;
  plan_type: string;
  payment_type: 'new' | 'renewal';
  paid_at: string;
  notes: string | null;
}

export interface Anomaly {
  id: string;
  gym_id: string;
  gym_name?: string;
  type: 'zero_checkins' | 'capacity_breach' | 'revenue_drop';
  severity: 'warning' | 'critical';
  message: string;
  resolved: boolean;
  dismissed: boolean;
  detected_at: string;
  resolved_at: string | null;
}

export interface HourlyStat {
  gym_id: string;
  day_of_week: number;
  hour_of_day: number;
  checkin_count: number;
}

export interface ChurnRiskMember {
  id: string;
  name: string;
  last_checkin_at: string | null;
  days_absent: number;
  risk_level: 'HIGH' | 'CRITICAL';
}

export interface CrossGymRevenue {
  gym_id: string;
  gym_name: string;
  total_revenue: number;
  rank: number;
}

// ============================================================
// WebSocket event types
// ============================================================

export interface CheckinEvent {
  type: 'CHECKIN_EVENT';
  gym_id: string;
  member_name: string;
  timestamp: string;
  current_occupancy: number;
  capacity_pct: number;
}

export interface CheckoutEvent {
  type: 'CHECKOUT_EVENT';
  gym_id: string;
  member_name: string;
  timestamp: string;
  current_occupancy: number;
  capacity_pct: number;
}

export interface PaymentEvent {
  type: 'PAYMENT_EVENT';
  gym_id: string;
  amount: number;
  plan_type: string;
  member_name: string;
  today_total: number;
}

export interface AnomalyDetectedEvent {
  type: 'ANOMALY_DETECTED';
  anomaly_id: string;
  gym_id: string;
  gym_name: string;
  anomaly_type: string;
  severity: string;
  message: string;
}

export interface AnomalyResolvedEvent {
  type: 'ANOMALY_RESOLVED';
  anomaly_id: string;
  gym_id: string;
  resolved_at: string;
}

export type WSEvent =
  | CheckinEvent
  | CheckoutEvent
  | PaymentEvent
  | AnomalyDetectedEvent
  | AnomalyResolvedEvent;

// ============================================================
// API response types
// ============================================================

export interface LiveGymSnapshot {
  gym: GymWithStats;
  occupancy: {
    current: number;
    capacity: number;
    percentage: number;
  };
  today_revenue: number;
  recent_events: CheckinWithMember[];
  active_anomalies: Anomaly[];
}

export interface AnalyticsData {
  peak_hours: HourlyStat[];
  revenue_by_plan: { plan_type: string; total: number }[];
  churn_risk: ChurnRiskMember[];
  new_vs_renewal: { new_count: number; renewal_count: number };
}

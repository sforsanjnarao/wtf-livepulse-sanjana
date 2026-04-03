import React, { useEffect, useState } from 'react';
import { useGymContext } from '../store/GymContext';
import { PeakHoursHeatmap } from '../components/PeakHoursHeatmap';
import { RevenueBreakdown } from '../components/RevenueBreakdown';
import { ChurnRiskPanel } from '../components/ChurnRiskPanel';
import { NewVsRenewal } from '../components/NewVsRenewal';
import { CrossGymRevenueChart } from '../components/CrossGymRevenue';
import { SkeletonCard } from '../components/SkeletonLoader';
import type { AnalyticsData, CrossGymRevenue } from '../types/index';

export function Analytics() {
  const { state, setSelectedGym } = useGymContext();
  const { gyms, selectedGymId } = state;

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [crossGymData, setCrossGymData] = useState<CrossGymRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedGymId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/gyms/${selectedGymId}/analytics?dateRange=${dateRange}`).then(r => r.json()),
      fetch('/api/analytics/cross-gym').then(r => r.json()),
    ]).then(([analytics, crossGym]) => {
      setAnalyticsData(analytics);
      setCrossGymData(crossGym);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedGymId, dateRange]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#E2E8F0] mb-1">Analytics Engine</h1>
        <p className="text-sm text-[#64748B]">Deep insights across gym performance</p>
      </div>

      {/* Gym + date range selectors */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div>
          <label className="label mb-1.5 block">Gym</label>
          <select
            id="analytics-gym-selector"
            value={selectedGymId ?? ''}
            onChange={(e) => setSelectedGym(e.target.value)}
            className="bg-[#1A1A2E] border border-[#252540] text-[#E2E8F0] rounded-md px-4 py-2 text-sm
                       focus:outline-none focus:border-[#14B8A6] transition-colors cursor-pointer"
          >
            {gyms.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-52" />)}
        </div>
      ) : analyticsData ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <PeakHoursHeatmap data={analyticsData.peak_hours} />
            <RevenueBreakdown
              data={analyticsData.revenue_by_plan}
              dateRange={dateRange}
              onChangeDateRange={setDateRange}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <NewVsRenewal data={analyticsData.new_vs_renewal} />
            <ChurnRiskPanel members={analyticsData.churn_risk} />
          </div>
          <CrossGymRevenueChart data={crossGymData} />
        </>
      ) : (
        <p className="text-[#64748B] text-sm">Select a gym to view analytics</p>
      )}
    </div>
  );
}

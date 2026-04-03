import type { ChurnRiskMember, CrossGymRevenue, HourlyStat } from '../types/index';
export declare function getGymOccupancy(gymId: string): Promise<number>;
export declare function getTodayRevenue(gymId: string): Promise<number>;
export declare function getAllGymsWithStats(): Promise<any[]>;
export declare function getChurnRiskMembers(gymId: string): Promise<ChurnRiskMember[]>;
export declare function getPeakHours(gymId: string): Promise<HourlyStat[]>;
export declare function getRevenueByPlanType(gymId: string, dateRange: string): Promise<any[]>;
export declare function getNewVsRenewalRatio(gymId: string, dateRange: string): Promise<{
    new_count: number;
    renewal_count: number;
}>;
export declare function getCrossGymRevenue(): Promise<CrossGymRevenue[]>;
//# sourceMappingURL=statsService.d.ts.map
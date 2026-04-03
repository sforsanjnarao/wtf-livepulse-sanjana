import {
  detectZeroCheckins,
  detectCapacityBreach,
  detectRevenueDrop,
  resolveAnomalies,
} from '../services/anomalyService';

export function startAnomalyDetector(): void {
  // Run immediately after 5s startup delay
  setTimeout(async () => {
    console.log('[AnomalyDetector] Running initial detection...');
    try {
      await resolveAnomalies();
      await detectZeroCheckins();
      await detectCapacityBreach();
      await detectRevenueDrop();
      console.log('[AnomalyDetector] Initial detection complete.');
    } catch (err) {
      console.error('[AnomalyDetector] Error during initial run:', err);
    }
  }, 5_000);

  // Then every 30s
  setInterval(async () => {
    try {
      await resolveAnomalies();
      await detectZeroCheckins();
      await detectCapacityBreach();
      await detectRevenueDrop();
    } catch (err) {
      console.error('[AnomalyDetector] Error during scheduled run:', err);
    }
  }, 30_000);

  console.log('[AnomalyDetector] Scheduler started (every 30s)');
}

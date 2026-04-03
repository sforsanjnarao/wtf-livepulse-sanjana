"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAnomalyDetector = startAnomalyDetector;
const anomalyService_1 = require("../services/anomalyService");
function startAnomalyDetector() {
    // Run immediately after 5s startup delay
    setTimeout(async () => {
        console.log('[AnomalyDetector] Running initial detection...');
        try {
            await (0, anomalyService_1.resolveAnomalies)();
            await (0, anomalyService_1.detectZeroCheckins)();
            await (0, anomalyService_1.detectCapacityBreach)();
            await (0, anomalyService_1.detectRevenueDrop)();
            console.log('[AnomalyDetector] Initial detection complete.');
        }
        catch (err) {
            console.error('[AnomalyDetector] Error during initial run:', err);
        }
    }, 5_000);
    // Then every 30s
    setInterval(async () => {
        try {
            await (0, anomalyService_1.resolveAnomalies)();
            await (0, anomalyService_1.detectZeroCheckins)();
            await (0, anomalyService_1.detectCapacityBreach)();
            await (0, anomalyService_1.detectRevenueDrop)();
        }
        catch (err) {
            console.error('[AnomalyDetector] Error during scheduled run:', err);
        }
    }, 30_000);
    console.log('[AnomalyDetector] Scheduler started (every 30s)');
}
//# sourceMappingURL=anomalyDetector.js.map
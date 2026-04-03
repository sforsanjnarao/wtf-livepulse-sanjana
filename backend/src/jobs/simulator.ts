import { startSimulator } from '../services/simulatorService';

// The simulator is controlled via REST API (POST /api/simulator/start|stop|reset)
// This file just re-exports for clarity; auto-start is NOT done on boot —
// the simulator starts only when the frontend presses "Start".

export { startSimulator };

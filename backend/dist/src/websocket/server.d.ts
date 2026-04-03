import type { Server } from 'http';
import type { WSEvent } from '../types/index';
export declare function setupWebSocket(server: Server): void;
export declare function broadcast(event: WSEvent): void;
export declare function getConnectedClientCount(): number;
//# sourceMappingURL=server.d.ts.map
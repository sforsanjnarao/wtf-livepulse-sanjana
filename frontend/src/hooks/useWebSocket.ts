import { useEffect, useRef, useCallback } from 'react';
import { useGymContext } from '../store/GymContext';
import type { WSEvent } from '../types/index';

const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

export function useWebSocket() {
  const { setWsConnected, updateFromWSEvent } = useGymContext();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(1000);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected');
      setWsConnected(true);
      backoffRef.current = 1000; // reset backoff
    };

    ws.onmessage = (msgEvent) => {
      try {
        const data = JSON.parse(msgEvent.data as string) as WSEvent;
        updateFromWSEvent(data);
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected — reconnecting...');
      setWsConnected(false);
      const delay = Math.min(backoffRef.current, 5000);
      backoffRef.current = Math.min(backoffRef.current * 1.5, 5000);
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [setWsConnected, updateFromWSEvent]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);
}

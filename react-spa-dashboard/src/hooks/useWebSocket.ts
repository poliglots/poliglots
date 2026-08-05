import { useEffect, useRef, useCallback } from "react";

type MessageHandler = (data: unknown) => void;

/**
 * Custom hook for WebSocket connections with auto-reconnect.
 */
export function useWebSocket(
  url: string,
  onMessage: MessageHandler,
  reconnectInterval: number = 3000
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        onMessage(event.data);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected, reconnecting...");
      reconnectTimer.current = setTimeout(connect, reconnectInterval);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      ws.close();
    };

    wsRef.current = ws;
  }, [url, onMessage, reconnectInterval]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  return { send: (data: string) => wsRef.current?.send(data) };
}

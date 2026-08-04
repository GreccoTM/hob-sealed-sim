import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientAction, RoomView, ServerEvent } from "@hob/shared";
import { wsUrl } from "../lib/apiBase.js";

export type ConnectionStatus = "connecting" | "open" | "closed";

export function useGameSocket(roomCode: string, token: string) {
  const [state, setState] = useState<RoomView | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const closedByUser = useRef(false);

  const connect = useCallback(() => {
    const ws = new WebSocket(wsUrl(`/api/rooms/${roomCode}/socket?token=${encodeURIComponent(token)}`));
    wsRef.current = ws;
    setStatus("connecting");

    ws.onopen = () => {
      setStatus("open");
      reconnectAttempt.current = 0;
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data as string) as ServerEvent;
      if (data.type === "SNAPSHOT") setState(data.state);
    };

    ws.onclose = () => {
      setStatus("closed");
      if (closedByUser.current) return;
      const delay = Math.min(1000 * 2 ** reconnectAttempt.current, 10000);
      reconnectAttempt.current += 1;
      setTimeout(connect, delay);
    };
  }, [roomCode, token]);

  useEffect(() => {
    closedByUser.current = false;
    connect();
    return () => {
      closedByUser.current = true;
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((action: ClientAction) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
    }
  }, []);

  return { state, status, send };
}

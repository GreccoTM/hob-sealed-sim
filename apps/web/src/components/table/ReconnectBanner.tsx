import type { ConnectionStatus } from "../../hooks/useGameSocket.js";

interface ReconnectBannerProps {
  status: ConnectionStatus;
  opponentConnected: boolean;
}

export function ReconnectBanner({ status, opponentConnected }: ReconnectBannerProps) {
  if (status === "open" && opponentConnected) return null;

  return (
    <div className="reconnect-banner">
      {status !== "open" ? "Reconectando..." : "Oponente desconectado — aguardando reconexão..."}
    </div>
  );
}

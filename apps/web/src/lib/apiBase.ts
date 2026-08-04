// Vazio em dev (o proxy do Vite cuida de /api). Em produção, defina
// VITE_API_BASE_URL com a URL absoluta do Worker (ex: https://hob-sealed-sim-worker.<conta>.workers.dev),
// já que Pages e Worker vivem em domínios diferentes.
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "";

export function wsUrl(path: string): string {
  if (API_BASE_URL) {
    return API_BASE_URL.replace(/^http/, "ws") + path;
  }
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${location.host}${path}`;
}

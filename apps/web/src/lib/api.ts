import type { SealedPoolEntry } from "@hob/shared";
import { supabase } from "./supabaseClient.js";
import { API_BASE_URL } from "./apiBase.js";

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Não autenticado");
  return { Authorization: `Bearer ${token}` };
}

export interface OpenPoolResult {
  id: string;
  pool: SealedPoolEntry[];
}

export async function openSealedPool(): Promise<OpenPoolResult> {
  const response = await fetch(`${API_BASE_URL}/api/pools`, { method: "POST", headers: await authHeaders() });
  if (!response.ok) {
    throw new Error(`Falha ao gerar pool: HTTP ${response.status}`);
  }
  return response.json();
}

export interface SaveDeckInput {
  poolId: string;
  name?: string;
  maindeck: SealedPoolEntry[];
  sideboard: SealedPoolEntry[];
}

export async function saveDeck(input: SaveDeckInput): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE_URL}/api/decks`, {
    method: "POST",
    headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Falha ao salvar deck: HTTP ${response.status}`);
  }
  return response.json();
}

export interface RoomResult {
  roomCode: string;
  token: string;
}

export async function createRoom(deckId: string): Promise<RoomResult> {
  const response = await fetch(`${API_BASE_URL}/api/rooms`, {
    method: "POST",
    headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ deckId }),
  });
  if (!response.ok) {
    throw new Error(`Falha ao criar sala: HTTP ${response.status}`);
  }
  return response.json();
}

export async function joinRoom(roomCode: string, deckId: string): Promise<RoomResult> {
  const response = await fetch(`${API_BASE_URL}/api/rooms/${roomCode}/join`, {
    method: "POST",
    headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ deckId }),
  });
  if (!response.ok) {
    const body: { error?: string } = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Falha ao entrar na sala: HTTP ${response.status}`);
  }
  return response.json();
}

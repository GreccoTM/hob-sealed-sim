import { Hono } from "hono";
import type { SealedPoolEntry } from "@hob/shared";
import { requireAuth, type AuthVariables } from "../lib/authMiddleware.js";
import { supabaseForRequest } from "../lib/supabaseForRequest.js";
import type { Env } from "../types.js";

export const roomsRoute = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem caracteres ambíguos (0/O, 1/I)
const ROOM_CODE_LENGTH = 6;
const MIN_DECK_SIZE = 40;

function randomRoomCode(): string {
  const buf = new Uint32Array(ROOM_CODE_LENGTH);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => ROOM_CODE_CHARS[n % ROOM_CODE_CHARS.length]).join("");
}

async function loadMaindeck(
  env: Env,
  accessToken: string,
  deckId: string,
): Promise<SealedPoolEntry[] | null> {
  const supabase = supabaseForRequest(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, accessToken);
  const { data, error } = await supabase.from("decks").select("maindeck").eq("id", deckId).maybeSingle();
  if (error || !data) return null;
  return data.maindeck as SealedPoolEntry[];
}

roomsRoute.use("*", requireAuth);

roomsRoute.post("/", async (c) => {
  const body = await c.req.json<{ deckId: string; displayName?: string }>();
  const maindeck = await loadMaindeck(c.env, c.get("accessToken"), body.deckId);
  if (!maindeck) return c.json({ error: "deck não encontrado" }, 404);

  const totalCards = maindeck.reduce((sum, entry) => sum + entry.count, 0);
  if (totalCards < MIN_DECK_SIZE) {
    return c.json({ error: `deck precisa de pelo menos ${MIN_DECK_SIZE} cartas` }, 400);
  }

  const roomCode = randomRoomCode();
  const stub = c.env.MATCH_ROOM.get(c.env.MATCH_ROOM.idFromName(roomCode));
  const response = await stub.fetch("https://do/register", {
    method: "POST",
    body: JSON.stringify({
      role: "player1",
      roomCode,
      userId: c.get("userId"),
      displayName: body.displayName ?? "Jogador 1",
      maindeck,
    }),
  });
  const result = await response.json<{ token: string }>();
  return c.json({ roomCode, token: result.token });
});

roomsRoute.post("/:code/join", async (c) => {
  const roomCode = c.req.param("code").toUpperCase();
  const body = await c.req.json<{ deckId: string; displayName?: string }>();
  const maindeck = await loadMaindeck(c.env, c.get("accessToken"), body.deckId);
  if (!maindeck) return c.json({ error: "deck não encontrado" }, 404);

  const totalCards = maindeck.reduce((sum, entry) => sum + entry.count, 0);
  if (totalCards < MIN_DECK_SIZE) {
    return c.json({ error: `deck precisa de pelo menos ${MIN_DECK_SIZE} cartas` }, 400);
  }

  const stub = c.env.MATCH_ROOM.get(c.env.MATCH_ROOM.idFromName(roomCode));
  const response = await stub.fetch("https://do/register", {
    method: "POST",
    body: JSON.stringify({
      role: "player2",
      roomCode,
      userId: c.get("userId"),
      displayName: body.displayName ?? "Jogador 2",
      maindeck,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    return c.json(err, response.status as 400 | 404 | 409);
  }
  const result = await response.json<{ token: string }>();
  return c.json({ roomCode, token: result.token });
});

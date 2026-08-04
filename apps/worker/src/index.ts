import { Hono } from "hono";
import { cors } from "hono/cors";
import { poolsRoute } from "./routes/pools.js";
import { decksRoute } from "./routes/decks.js";
import { roomsRoute } from "./routes/rooms.js";
import { imagesRoute } from "./routes/images.js";
import type { Env } from "./types.js";

export { MatchRoomDO } from "./durable-objects/MatchRoomDO.js";

const app = new Hono<{ Bindings: Env }>();

const ALLOWED_ORIGINS = [
  "https://hob-sealed-sim.pages.dev",
  "http://localhost:5173",
];

app.use(
  "/api/*",
  cors({
    origin: (origin) => (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]),
  }),
);

app.get("/api/health", (c) => c.json({ ok: true }));

// Precisa ser registrado ANTES de app.route("/api/rooms", roomsRoute): o upgrade
// de WebSocket nativo do navegador não carrega header Authorization, então essa
// rota fica fora do requireAuth (que roomsRoute aplica em "*" via middleware) —
// a autorização aqui é feita pelo token de sala emitido no POST /api/rooms (ou
// /join), validado dentro do próprio Durable Object. Registrar depois faria o
// middleware "*" de roomsRoute interceptar e devolver 401 antes de chegar aqui.
app.get("/api/rooms/:code/socket", (c) => {
  const roomCode = c.req.param("code").toUpperCase();
  const stub = c.env.MATCH_ROOM.get(c.env.MATCH_ROOM.idFromName(roomCode));
  return stub.fetch(c.req.raw);
});

app.route("/api/pools", poolsRoute);
app.route("/api/decks", decksRoute);
app.route("/api/rooms", roomsRoute);
app.route("/images", imagesRoute);

export default app;

import { Hono } from "hono";
import { requireAuth, type AuthVariables } from "../lib/authMiddleware.js";
import { supabaseForRequest } from "../lib/supabaseForRequest.js";
import type { Env } from "../types.js";

export const decksRoute = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

decksRoute.use("*", requireAuth);

function client(c: { env: Env; get: (key: "accessToken") => string }) {
  return supabaseForRequest(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, c.get("accessToken"));
}

decksRoute.get("/", async (c) => {
  const { data, error } = await client(c)
    .from("decks")
    .select("id, name, pool_id, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ decks: data });
});

decksRoute.post("/", async (c) => {
  const body = await c.req.json<{ poolId: string; name?: string; maindeck: unknown; sideboard: unknown }>();

  const { data, error } = await client(c)
    .from("decks")
    .insert({
      user_id: c.get("userId"),
      pool_id: body.poolId,
      name: body.name ?? "Meu deck",
      maindeck: body.maindeck,
      sideboard: body.sideboard ?? [],
    })
    .select("id")
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ id: data.id });
});

decksRoute.get("/:id", async (c) => {
  const { data, error } = await client(c).from("decks").select("*").eq("id", c.req.param("id")).maybeSingle();
  if (error) return c.json({ error: error.message }, 500);
  if (!data) return c.json({ error: "not found" }, 404);
  return c.json(data);
});

decksRoute.put("/:id", async (c) => {
  const body = await c.req.json<{ name?: string; maindeck?: unknown; sideboard?: unknown }>();

  const { error } = await client(c)
    .from("decks")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", c.req.param("id"));

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true });
});

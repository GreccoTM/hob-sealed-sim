import { Hono } from "hono";
import { generateSealedPool, secureRandom } from "@hob/shared";
import { cards } from "../lib/cards.js";
import { requireAuth, type AuthVariables } from "../lib/authMiddleware.js";
import { supabaseForRequest } from "../lib/supabaseForRequest.js";
import type { Env } from "../types.js";

export const poolsRoute = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

poolsRoute.use("*", requireAuth);

poolsRoute.post("/", async (c) => {
  const pool = generateSealedPool(cards, secureRandom);
  const supabase = supabaseForRequest(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, c.get("accessToken"));

  const { data, error } = await supabase
    .from("sealed_pools")
    .insert({ user_id: c.get("userId"), set_code: "HOB", cards: pool })
    .select("id")
    .single();

  if (error) return c.json({ error: error.message }, 500);

  return c.json({ id: data.id, pool });
});

poolsRoute.get("/:id", async (c) => {
  const supabase = supabaseForRequest(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, c.get("accessToken"));
  const { data, error } = await supabase
    .from("sealed_pools")
    .select("id, cards, created_at")
    .eq("id", c.req.param("id"))
    .maybeSingle();

  if (error) return c.json({ error: error.message }, 500);
  if (!data) return c.json({ error: "not found" }, 404);

  return c.json({ id: data.id, pool: data.cards, createdAt: data.created_at });
});

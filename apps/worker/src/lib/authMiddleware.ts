import type { MiddlewareHandler } from "hono";
import type { Env } from "../types.js";
import { verifyAuth } from "./verifyJwt.js";

export type AuthVariables = {
  userId: string;
  accessToken: string;
};

export const requireAuth: MiddlewareHandler<{ Bindings: Env; Variables: AuthVariables }> = async (c, next) => {
  const user = await verifyAuth(c.req.raw, c.env.SUPABASE_URL);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  c.set("userId", user.id);
  c.set("accessToken", c.req.header("Authorization")!.slice("Bearer ".length));
  await next();
};

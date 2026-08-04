import { Hono } from "hono";
import type { Env } from "../types.js";

export const imagesRoute = new Hono<{ Bindings: Env }>();

const CACHE_CONTROL = "public, max-age=31536000, immutable";

imagesRoute.get("/cards/:id/:file", async (c) => {
  const { id, file } = c.req.param();
  if (file !== "normal.jpg" && file !== "large.jpg") {
    return c.notFound();
  }

  const object = await c.env.CARD_IMAGES.get(`cards/${id}/${file}`);
  if (!object) return c.notFound();

  return new Response(object.body, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": CACHE_CONTROL,
      ETag: object.httpEtag,
    },
  });
});
